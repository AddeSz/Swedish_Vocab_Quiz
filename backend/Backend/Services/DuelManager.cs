using System.Collections.Concurrent;
using Backend.Models;
using Backend.DTOs;
using Microsoft.AspNetCore.SignalR;
using Backend.Hubs;

namespace Backend.Services;

public class DuelManager
{
  private readonly ConcurrentQueue<Guid> _waitingUserIds = new();
  private readonly ConcurrentDictionary<Guid, DuelState> _activeDuels = new();
  private readonly ConcurrentDictionary<Guid, Guid> _userToDuelMap = new();
  private readonly ConcurrentDictionary<Guid, string> _pendingConnections = new();
  private readonly IHubContext<DuelHub> _hubContext;
  private readonly IServiceScopeFactory _scopeFactory;

  public DuelManager(IHubContext<DuelHub> hubContext, IServiceScopeFactory scopeFactory)
  {
    _hubContext = hubContext;
    _scopeFactory = scopeFactory;
  }

  public void EnqueueUser(Guid userId, string userName, string connectionId)
  {
    if (_userToDuelMap.ContainsKey(userId)) return;
    _pendingConnections[userId] = connectionId;
    _waitingUserIds.Enqueue(userId);
    _ = Task.Run(async () =>
    {
      try { await TryMatchPlayers(); }
      catch (Exception ex) { Console.Error.WriteLine($"TryMatchPlayers error: {ex}"); }
    });
  }

  public void DequeueUser(Guid userId)
  {
    var tempQueue = new ConcurrentQueue<Guid>();
    while (_waitingUserIds.TryDequeue(out var id))
    {
      if (id != userId) tempQueue.Enqueue(id);
    }
    while (tempQueue.TryDequeue(out var id))
    {
      _waitingUserIds.Enqueue(id);
    }
  }

  private async Task TryMatchPlayers()
  {
    if (_waitingUserIds.Count < 2) return;
    if (!_waitingUserIds.TryDequeue(out var player1Id)) return;
    if (!_waitingUserIds.TryDequeue(out var player2Id))
    {
      _waitingUserIds.Enqueue(player1Id);
      return;
    }

    using var scope = _scopeFactory.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var questionService = scope.ServiceProvider.GetRequiredService<DuelQuestionService>();

    var player1 = await dbContext.Users.FindAsync(player1Id);
    var player2 = await dbContext.Users.FindAsync(player2Id);
    if (player1 == null || player2 == null) return;

    var duelId = Guid.NewGuid();
    var questions = questionService.GenerateDuelQuestions();
    var duel = new DuelState
    {
      DuelId = duelId,
      Player1UserId = player1Id,
      Player1Name = player1.DisplayName,
      Player1ConnectionId = _pendingConnections.GetValueOrDefault(player1Id),
      Player2UserId = player2Id,
      Player2Name = player2.DisplayName,
      Player2ConnectionId = _pendingConnections.GetValueOrDefault(player2Id),
      Phase = DuelPhase.Question,
      Questions = questions,
      CurrentQuestionIndex = 0
    };

    _pendingConnections.TryRemove(player1Id, out _);
    _pendingConnections.TryRemove(player2Id, out _);

    _activeDuels[duelId] = duel;
    _userToDuelMap[player1Id] = duelId;
    _userToDuelMap[player2Id] = duelId;

    if (duel.Player1ConnectionId != null)
      await _hubContext.Groups.AddToGroupAsync(duel.Player1ConnectionId, $"duel-{duelId}");
    if (duel.Player2ConnectionId != null)
      await _hubContext.Groups.AddToGroupAsync(duel.Player2ConnectionId, $"duel-{duelId}");

    await _hubContext.Clients.Group($"user-{player1Id}").SendAsync("MatchFound", new { DuelId = duelId, OpponentName = player2.DisplayName, PlayerNumber = 1 });
    await _hubContext.Clients.Group($"user-{player2Id}").SendAsync("MatchFound", new { DuelId = duelId, OpponentName = player1.DisplayName, PlayerNumber = 2 });
  }

  public DuelState? GetDuelByUserId(Guid userId)
  {
    return _userToDuelMap.TryGetValue(userId, out var duelId) && _activeDuels.TryGetValue(duelId, out var duel) ? duel : null;
  }

  public DuelState? GetDuel(Guid duelId)
  {
    return _activeDuels.TryGetValue(duelId, out var duel) ? duel : null;
  }

  public void UpdateConnectionId(Guid userId, string connectionId)
  {
    var duel = GetDuelByUserId(userId);
    if (duel == null) return;
    if (duel.Player1UserId == userId) duel.Player1ConnectionId = connectionId;
    else if (duel.Player2UserId == userId) duel.Player2ConnectionId = connectionId;
  }

  public async Task RemoveDuel(Guid duelId)
  {
    if (!_activeDuels.TryRemove(duelId, out var duel)) return;
    _userToDuelMap.TryRemove(duel.Player1UserId, out _);
    _userToDuelMap.TryRemove(duel.Player2UserId, out _);
    duel.QuestionTimerCts?.Cancel();
    duel.ReviewTimerCts?.Cancel();
    duel.SyncLock.Dispose();
  }

  public async Task StartQuestion(Guid duelId)
  {
    var duel = GetDuel(duelId);
    if (duel == null || duel.Phase == DuelPhase.Completed || duel.Phase == DuelPhase.Forfeited) return;

    duel.Phase = DuelPhase.Question;
    duel.Player1Answer = null;
    duel.Player2Answer = null;
    duel.Player1Ready = false;
    duel.Player2Ready = false;
    duel.QuestionStartedAtUtc = DateTime.UtcNow;

    if (duel.CurrentQuestionIndex >= duel.Questions.Count) return;

    var question = duel.Questions[duel.CurrentQuestionIndex];
    var dto = new DuelQuestionDto(question.QuestionText, question.Options, duel.CurrentQuestionIndex);

    await _hubContext.Clients.Group($"duel-{duelId}").SendAsync("QuestionStarted", dto);

    duel.QuestionTimerCts = new CancellationTokenSource();
    var token = duel.QuestionTimerCts.Token;
    _ = Task.Delay(TimeSpan.FromSeconds(10), token).ContinueWith(async t =>
    {
      if (!t.IsCanceled) await HandleQuestionTimeout(duelId);
    });
  }

  private async Task HandleQuestionTimeout(Guid duelId)
  {
    var duel = GetDuel(duelId);
    if (duel == null || duel.Phase == DuelPhase.Completed || duel.Phase == DuelPhase.Forfeited) return;

    bool lockAcquired = false;
    try
    {
      lockAcquired = await duel.SyncLock.WaitAsync(TimeSpan.FromSeconds(5));
      if (!lockAcquired) return;

      if (duel.Phase != DuelPhase.Question) return;
      await StartReview(duelId);
    }
    catch (ObjectDisposedException)
    {
      // duel was cleaned up, safe to ignore
    }
    finally
    {
      if (lockAcquired) duel.SyncLock.Release();
    }
  }

  public async Task SubmitAnswer(Guid duelId, Guid userId, int answerIndex)
  {
    var duel = GetDuel(duelId);
    if (duel == null || duel.Phase == DuelPhase.Completed || duel.Phase == DuelPhase.Forfeited) return;

    bool lockAcquired = false;
    try
    {
      lockAcquired = await duel.SyncLock.WaitAsync(TimeSpan.FromSeconds(5));
      if (!lockAcquired) return;

      if (duel.Phase != DuelPhase.Question) return;
      if (answerIndex < 0 || answerIndex >= 4) return;

      if (duel.Player1UserId == userId) duel.Player1Answer = answerIndex;
      else if (duel.Player2UserId == userId) duel.Player2Answer = answerIndex;

      if (duel.Player1Answer.HasValue && duel.Player2Answer.HasValue)
      {
        duel.QuestionTimerCts?.Cancel();
        duel.SyncLock.Release();
        lockAcquired = false;
        await StartReview(duelId);
      }
    }
    catch (ObjectDisposedException)
    {
      // duel was cleaned up, safe to ignore
    }
    finally
    {
      if (lockAcquired) duel.SyncLock.Release();
    }
  }

  private async Task StartReview(Guid duelId)
  {
    var duel = GetDuel(duelId);
    if (duel == null || duel.Phase != DuelPhase.Question) return;

    duel.Phase = DuelPhase.Review;
    duel.ReviewStartedAtUtc = DateTime.UtcNow;

    var question = duel.Questions[duel.CurrentQuestionIndex];
    if (duel.Player1Answer == question.CorrectAnswerIndex) duel.Player1Score++;
    if (duel.Player2Answer == question.CorrectAnswerIndex) duel.Player2Score++;

    duel.AnswerHistory.Add((duel.Player1Answer, duel.Player2Answer));

    var dto = new DuelReviewDto(
      question.CorrectAnswerIndex,
      duel.Player1Answer,
      duel.Player2Answer,
      duel.Player1Score,
      duel.Player2Score
    );

    await _hubContext.Clients.Group($"duel-{duelId}").SendAsync("ReviewStarted", dto);

    duel.ReviewTimerCts = new CancellationTokenSource();
    var token = duel.ReviewTimerCts.Token;
    _ = Task.Delay(TimeSpan.FromSeconds(5), token).ContinueWith(async t =>
    {
      if (!t.IsCanceled) await HandleReviewTimeout(duelId);
    });
  }

  private async Task HandleReviewTimeout(Guid duelId)
  {
    var duel = GetDuel(duelId);
    if (duel == null || duel.Phase != DuelPhase.Review) return;
    await AdvanceToNextQuestion(duelId);
  }

  public async Task MarkPlayerReady(Guid duelId, Guid userId)
  {
    var duel = GetDuel(duelId);
    if (duel == null || duel.Phase == DuelPhase.Completed || duel.Phase == DuelPhase.Forfeited) return;

    bool lockAcquired = false;
    try
    {
      lockAcquired = await duel.SyncLock.WaitAsync(TimeSpan.FromSeconds(5));
      if (!lockAcquired) return;

      if (duel.Phase != DuelPhase.Review) return;

      if (duel.Player1UserId == userId) duel.Player1Ready = true;
      else if (duel.Player2UserId == userId) duel.Player2Ready = true;

      if (duel.Player1Ready && duel.Player2Ready)
      {
        duel.ReviewTimerCts?.Cancel();
        duel.SyncLock.Release();
        lockAcquired = false;
        await AdvanceToNextQuestion(duelId);
      }
    }
    catch (ObjectDisposedException)
    {
      // duel was cleaned up, safe to ignore
    }
    finally
    {
      if (lockAcquired) duel.SyncLock.Release();
    }
  }

  public async Task MarkPlayerReadyToPlay(Guid duelId)
  {
    var duel = GetDuel(duelId);
    if (duel == null) return;
    if (duel.PlayersJoined >= 2) return;

    duel.PlayersJoined++;
    if (duel.PlayersJoined == 2)
      await StartQuestion(duelId);
  }

  private async Task AdvanceToNextQuestion(Guid duelId)
  {
    var duel = GetDuel(duelId);
    if (duel == null) return;

    duel.CurrentQuestionIndex++;
    if (duel.CurrentQuestionIndex >= duel.Questions.Count)
    {
      await CompleteDuel(duelId);
    }
    else
    {
      await StartQuestion(duelId);
    }
  }

  private async Task CompleteDuel(Guid duelId)
  {
    var duel = GetDuel(duelId);
    if (duel == null) return;

    duel.Phase = DuelPhase.Completed;

    Guid? winnerId = duel.Player1Score > duel.Player2Score ? duel.Player1UserId :
                     duel.Player2Score > duel.Player1Score ? duel.Player2UserId : null;

    using var scope = _scopeFactory.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var history = new DuelHistory
    {
      Id = Guid.NewGuid(),
      Player1UserId = duel.Player1UserId,
      Player2UserId = duel.Player2UserId,
      WinnerUserId = winnerId,
      CompletedAtUtc = DateTime.UtcNow
    };
    dbContext.DuelHistories.Add(history);

    await UpdateStats(dbContext, duel.Player1UserId, winnerId == duel.Player1UserId, winnerId == null);
    await UpdateStats(dbContext, duel.Player2UserId, winnerId == duel.Player2UserId, winnerId == null);

    await dbContext.SaveChangesAsync();

    var breakdown = duel.Questions.Select((q, i) => new QuestionResultDto(
      i,
      q.QuestionText,
      q.CorrectAnswerIndex,
      i < duel.AnswerHistory.Count ? duel.AnswerHistory[i].Player1Answer : null,
      i < duel.AnswerHistory.Count ? duel.AnswerHistory[i].Player2Answer : null
    )).ToList();

    var result = new DuelResultDto(duel.Player1Score, duel.Player2Score, winnerId, breakdown);
    await _hubContext.Clients.Group($"duel-{duelId}").SendAsync("DuelCompleted", result);

    await RemoveDuel(duelId);
  }

  private async Task UpdateStats(AppDbContext dbContext, Guid userId, bool isWin, bool isTie)
  {
    var stats = await dbContext.DuelStats.FindAsync(userId);
    if (stats == null)
    {
      stats = new DuelStats { UserId = userId };
      dbContext.DuelStats.Add(stats);
    }

    if (isWin) stats.Wins++;
    else if (isTie) stats.Ties++;
    else stats.Losses++;
  }

  public async Task HandleDisconnect(Guid userId)
  {
    DequeueUser(userId);
    var duel = GetDuelByUserId(userId);
    if (duel == null) return;

    if (duel.Phase == DuelPhase.Completed || duel.Phase == DuelPhase.Forfeited) return;

    await HandleDisconnectTimeout(duel.DuelId, userId);
  }

  private async Task HandleDisconnectTimeout(Guid duelId, Guid disconnectedUserId)
  {
    var duel = GetDuel(duelId);
    if (duel == null) return;

    duel.Phase = DuelPhase.Forfeited;

    var winnerId = disconnectedUserId == duel.Player1UserId ? duel.Player2UserId : duel.Player1UserId;

    using var scope = _scopeFactory.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var history = new DuelHistory
    {
      Id = Guid.NewGuid(),
      Player1UserId = duel.Player1UserId,
      Player2UserId = duel.Player2UserId,
      WinnerUserId = winnerId,
      CompletedAtUtc = DateTime.UtcNow
    };
    dbContext.DuelHistories.Add(history);

    await UpdateStats(dbContext, winnerId, true, false);
    await UpdateStats(dbContext, disconnectedUserId, false, false);
    await dbContext.SaveChangesAsync();

    await _hubContext.Clients.Group($"duel-{duelId}").SendAsync("Forfeit", new { ForfeiterUserId = disconnectedUserId });
    await RemoveDuel(duelId);
  }
}
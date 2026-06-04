using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;

namespace Backend.Hubs;

[Authorize]
public class DuelHub : Hub
{
  private readonly DuelManager _duelManager;
  private readonly CurrentUserService _currentUserService;

  public DuelHub(
      DuelManager duelManager,
      CurrentUserService currentUserService)
  {
    _duelManager = duelManager;
    _currentUserService = currentUserService;
  }

  private async Task<User> GetCurrentUserAsync()
  {
    try
    {
      return await _currentUserService.GetRequiredUserAsync();
    }
    catch (UnauthorizedAccessException)
    {
      throw new HubException("User not authenticated");
    }
  }

  public override async Task OnConnectedAsync()
  {
    var user = await GetCurrentUserAsync();

    await Groups.AddToGroupAsync(
        Context.ConnectionId,
        $"user-{user.Id}");
    await base.OnConnectedAsync();
  }

  public async Task JoinMatchmaking()
  {
    var user = await GetCurrentUserAsync();

    _duelManager.EnqueueUser(
        user.Id,
        user.DisplayName,
        Context.ConnectionId);
  }

  public async Task JoinDuelGroup(string duelId)
  {
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      throw new HubException("Invalid duel ID");

    var user = await GetCurrentUserAsync();
    var userId = user.Id;
    var duel = _duelManager.GetDuel(parsedDuelId);
    if (duel == null) throw new HubException("Duel not found");
    if (duel.Player1UserId != userId && duel.Player2UserId != userId) throw new HubException("Not a participant");

    await Groups.AddToGroupAsync(Context.ConnectionId, $"duel-{parsedDuelId}");
    _duelManager.UpdateConnectionId(userId, Context.ConnectionId);
  }

  public async Task LeaveMatchmaking()
  {
    var user = await GetCurrentUserAsync();
    _duelManager.DequeueUser(user.Id);
  }

  public async Task LeaveDuel(string duelId)
  {
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      return;

    var user = await GetCurrentUserAsync();

    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"duel-{parsedDuelId}");

    await _duelManager.HandleDisconnect(user.Id);
  }

  public async Task SubmitAnswer(string duelId, int answerIndex)
  {
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      throw new HubException("Invalid duel ID");

    var user = await GetCurrentUserAsync();
    await _duelManager.SubmitAnswer(parsedDuelId, user.Id, answerIndex);
  }

  public async Task ReadyForNext(string duelId)
  {
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      throw new HubException("Invalid duel ID");

    var user = await GetCurrentUserAsync();
    await _duelManager.MarkPlayerReady(parsedDuelId, user.Id);
  }

  public async Task ReadyToPlay(string duelId)
  {
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      throw new HubException("Invalid duel ID");

    var user = await GetCurrentUserAsync();
    var duel = _duelManager.GetDuel(parsedDuelId);
    if (duel == null) throw new HubException("Duel not found");
    if (duel.Player1UserId != user.Id && duel.Player2UserId != user.Id)
      throw new HubException("Not a participant");

    await _duelManager.MarkPlayerReadyToPlay(parsedDuelId);
  }

  public async Task ReconnectToDuel(string duelId)
  {
    if (!Guid.TryParse(duelId, out var parsedDuelId))
      throw new HubException("Invalid duel ID");

    var user = await GetCurrentUserAsync();
    var userId = user.Id;
    var duel = _duelManager.GetDuel(parsedDuelId);
    if (duel == null) throw new HubException("Duel not found");
    if (duel.Player1UserId != userId && duel.Player2UserId != userId) throw new HubException("Not a participant");

    await Groups.AddToGroupAsync(Context.ConnectionId, $"duel-{parsedDuelId}");
    await _duelManager.HandleReconnect(userId, Context.ConnectionId);

    var isPlayer1 = duel.Player1UserId == userId;
    var myAnswer = isPlayer1 ? duel.Player1Answer : duel.Player2Answer;

    object? questionData = null;
    object? reviewData = null;
    object? resultData = null;

    if (duel.Phase == DuelPhase.Question && duel.CurrentQuestionIndex < duel.Questions.Count)
    {
      var q = duel.Questions[duel.CurrentQuestionIndex];
      questionData = new
      {
        q.QuestionText,
        q.Options,
        QuestionIndex = duel.CurrentQuestionIndex
      };
    }
    else if (duel.Phase == DuelPhase.Review && duel.CurrentQuestionIndex < duel.Questions.Count)
    {
      var q = duel.Questions[duel.CurrentQuestionIndex];
      reviewData = new
      {
        q.CorrectAnswerIndex,
        duel.Player1Answer,
        duel.Player2Answer,
        duel.Player1Score,
        duel.Player2Score,
        q.QuestionText,
        q.Options,
        QuestionIndex = duel.CurrentQuestionIndex
      };
    }
    else if (duel.Phase == DuelPhase.Completed || duel.Phase == DuelPhase.Forfeited)
    {
      var breakdown = duel.Questions.Select((q, i) => new QuestionResultDto(
        i,
        q.QuestionText,
        q.CorrectAnswerIndex,
        i < duel.AnswerHistory.Count ? duel.AnswerHistory[i].Player1Answer : null,
        i < duel.AnswerHistory.Count ? duel.AnswerHistory[i].Player2Answer : null
      )).ToList();

      Guid? winnerId = null;

      if (duel.Player1Score > duel.Player2Score)
      {
        winnerId = duel.Player1UserId;
      }
      else if (duel.Player2Score > duel.Player1Score)
      {
        winnerId = duel.Player2UserId;
      }

      resultData = new DuelResultDto(duel.Player1Score, duel.Player2Score, winnerId, breakdown);
    }

    await Clients.Caller.SendAsync("StateRestored", new
    {
      Phase = duel.Phase.ToString(),
      duel.Player1Score,
      duel.Player2Score,
      duel.CurrentQuestionIndex,
      duel.Player1UserId,
      duel.Player2UserId,
      SubmittedAnswer = myAnswer,
      Question = questionData,
      Review = reviewData,
      Result = resultData
    });
  }

  public override async Task OnDisconnectedAsync(Exception? exception)
  {
    var user = await GetCurrentUserAsync();
    await _duelManager.HandleDisconnect(user.Id);
    await base.OnDisconnectedAsync(exception);
  }
}

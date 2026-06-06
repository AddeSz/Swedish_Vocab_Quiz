namespace Backend.Models;

public class DuelState
{
  public Guid DuelId { get; set; }
  public Guid Player1UserId { get; set; }
  public string Player1Name { get; set; } = string.Empty;
  public string? Player1ConnectionId { get; set; }
  public Guid Player2UserId { get; set; }
  public string Player2Name { get; set; } = string.Empty;
  public string? Player2ConnectionId { get; set; }
  public DuelPhase Phase { get; set; }
  public int CurrentQuestionIndex { get; set; }
  public int Player1Score { get; set; }
  public int Player2Score { get; set; }
  public List<DuelQuestion> Questions { get; set; } = [];
  public int? Player1Answer { get; set; }
  public int? Player2Answer { get; set; }
  public List<(int? Player1Answer, int? Player2Answer)> AnswerHistory { get; set; } = [];
  public bool Player1Ready { get; set; }
  public bool Player2Ready { get; set; }
  public DateTime? QuestionStartedAtUtc { get; set; }
  public DateTime? ReviewStartedAtUtc { get; set; }
  public SemaphoreSlim SyncLock { get; set; } = new(1, 1);
  public CancellationTokenSource? QuestionTimerCts { get; set; }
  public CancellationTokenSource? ReviewTimerCts { get; set; }
  public CancellationTokenSource? DisconnectTimerCts { get; set; }
  public int PlayersJoined = 0;
}

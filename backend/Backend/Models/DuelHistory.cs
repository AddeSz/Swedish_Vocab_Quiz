public class DuelHistory
{
  public Guid Id { get; set; }
  public Guid Player1UserId { get; set; }
  public User Player1 { get; set; } = null!;
  public Guid Player2UserId { get; set; }
  public User Player2 { get; set; } = null!;
  public Guid? WinnerUserId { get; set; }
  public DateTime CompletedAtUtc { get; set; }
}

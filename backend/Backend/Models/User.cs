public class User
{
  public Guid Id { get; set; }
  public string Auth0Subject { get; set; } = string.Empty;
  public string Email { get; set; } = string.Empty;
  public string DisplayName { get; set; } = string.Empty;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  public int TimedQuizBestStreak { get; set; } = 0;
  public int TimedQuizTotalRuns { get; set; } = 0;

  public ICollection<UserWordProgress> UserWordProgresses { get; set; } = [];
}
public class User
{
  public Guid Id { get; set; }
  public string? GoogleSubject { get; set; }
  public string Email { get; set; } = string.Empty;
  public string DisplayName { get; set; } = string.Empty;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  public string? PasswordHash { get; set; }
  public bool IsEmailVerified { get; set; } = false;
  public string? EmailVerificationToken { get; set; }

  public int TimedQuizBestStreak { get; set; } = 0;
  public int TimedQuizTotalRuns { get; set; } = 0;

  public ICollection<UserWordProgress> UserWordProgresses { get; set; } = [];
}

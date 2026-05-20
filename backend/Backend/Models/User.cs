// Supports dual auth: Google OAuth and email/password. A user may have one or both.
// GoogleSubject is null for email-only accounts; PasswordHash is null for Google-only accounts.
public class User
{
  public Guid Id { get; set; }
  public string? GoogleSubject { get; set; }
  public string Email { get; set; } = string.Empty;
  public string DisplayName { get; set; } = string.Empty;
  public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

  public string? PasswordHash { get; set; }
  public bool IsEmailVerified { get; set; } = false;
  // One-time token cleared after verification; null means already verified or Google account
  public string? EmailVerificationToken { get; set; }

  public int TimedQuizBestStreak { get; set; } = 0;
  public int TimedQuizTotalRuns { get; set; } = 0;

  public ICollection<UserWordProgress> UserWordProgresses { get; set; } = [];
}
// Tracks per-user spaced repetition state for each word using a modified SM-2 algorithm.
// EaseFactor and IntervalDays drive the scheduling of NextReviewDate.
public class UserWordProgress
{
  public Guid UserId { get; set; }
  public Guid WordId { get; set; }
  public Word Word { get; set; } = null!;

  public int CorrectCount { get; set; } = 0;
  public int IncorrectCount { get; set; } = 0;
  // SM-2 ease factor; clamped to minimum 1.3 to prevent intervals from shrinking too aggressively
  public float EaseFactor { get; set; } = 2.5f;
  public int IntervalDays { get; set; } = 1;
  public DateTime LastSeen { get; set; }
  public DateTime NextReviewDate { get; set; } = DateTime.UtcNow;
}
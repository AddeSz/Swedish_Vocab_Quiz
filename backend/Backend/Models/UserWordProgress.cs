public class UserWordProgress
{
  public Guid UserId { get; set; }
  public Guid WordId { get; set; }
  public Word Word { get; set; } = null!;

  public int CorrectCount { get; set; } = 0;
  public int IncorrectCount { get; set; } = 0;
  public float EaseFactor { get; set; } = 2.5f;
  public int IntervalDays { get; set; } = 1;
  public DateTime LastSeen { get; set; }
  public DateTime NextReviewDate { get; set; } = DateTime.UtcNow;
}
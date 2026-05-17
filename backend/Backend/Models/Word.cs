public class Word
{
  public Guid Id { get; set; }
  public string Text { get; set; } = string.Empty;
  public string Definition { get; set; } = string.Empty;
  public string Source { get; set; } = string.Empty;
  public bool IsReviewed { get; set; } = false;
  public string PartOfSpeech { get; set; } = string.Empty;
  public CefrLevel DifficultyLevel { get; set; }
  public double FrequencyRank { get; set; }

  public ICollection<UserWordProgress> UserWordProgresses { get; set; } = [];
}

public enum CefrLevel { B1, B2, C1, C2 }
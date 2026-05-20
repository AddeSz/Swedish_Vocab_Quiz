public class Word
{
  public Guid Id { get; set; }
  public string Text { get; set; } = string.Empty;
  public string Definition { get; set; } = string.Empty;
  // Source dataset the word was imported from (e.g. Kelly list subcorpus)
  public string Source { get; set; } = string.Empty;
  // AI-generated definitions are unreviewed by default; manual curation sets this to true
  public bool IsReviewed { get; set; } = false;
  public string PartOfSpeech { get; set; } = string.Empty;
  public CefrLevel DifficultyLevel { get; set; }
  // Words-per-million from the source corpus; used for ordering (lower = less common)
  public double FrequencyRank { get; set; }

  public ICollection<UserWordProgress> UserWordProgresses { get; set; } = [];
}

// CEFR levels B1-C2; A1/A2 excluded as they are too easy
public enum CefrLevel { B1, B2, C1, C2 }
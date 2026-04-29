public class Word
{
  public Guid Id { get; set; }
  public string Text { get; set; } = string.Empty;
  public string Definition { get; set; } = string.Empty;
  public DefinitionSource DefinitionSource { get; set; }
  public bool IsReviewed { get; set; } = false;
  public string PartOfSpeech { get; set; } = string.Empty;
  public CefrLevel DifficultyLevel { get; set; }
  public int FrequencyRank { get; set; }

  public ICollection<WordSentence> WordSentences { get; set; } = [];
  public ICollection<UserWordProgress> UserWordProgresses { get; set; } = [];
}

public enum DefinitionSource { AI, SAOL, Manual }
public enum CefrLevel { B1, B2, C1, C2 }
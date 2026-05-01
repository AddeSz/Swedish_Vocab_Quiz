public class WordDto
{
  public Guid Id { get; set; }
  public string Text { get; set; } = string.Empty;
  public string Definition { get; set; } = string.Empty;
  public string PartOfSpeech { get; set; } = string.Empty;
  public string DifficultyLevel { get; set; } = string.Empty;
  public double FrequencyRank { get; set; }
}
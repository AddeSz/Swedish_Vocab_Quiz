public class Sentence
{
  public Guid Id { get; set; }
  public string Text { get; set; } = string.Empty;
  public string Source { get; set; } = string.Empty;
  public CefrLevel DifficultyLevel { get; set; }

  public ICollection<WordSentence> WordSentences { get; set; } = [];
}
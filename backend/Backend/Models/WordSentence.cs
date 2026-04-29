public class WordSentence
{
  public Guid WordId { get; set; }
  public Word Word { get; set; } = null!;

  public Guid SentenceId { get; set; }
  public Sentence Sentence { get; set; } = null!;
}
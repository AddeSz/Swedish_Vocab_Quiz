public class QuizQuestionDto
{
  public Guid WordId { get; set; }
  public string Word { get; set; } = string.Empty;
  public List<string> Options { get; set; } = [];
  public int CorrectIndex { get; set; }
}
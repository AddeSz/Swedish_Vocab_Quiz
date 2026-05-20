public class QuizAnswerDto
{
  public Guid WordId { get; set; }
  public int SelectedIndex { get; set; }
  // Client evaluates correctness locally (has CorrectIndex); server trusts this for progress tracking
  public bool IsCorrect { get; set; }
  public QuizMode Mode { get; set; } = QuizMode.WordToDefinition;
}
public class QuizAnswerDto
{
  public Guid WordId { get; set; }
  public int SelectedIndex { get; set; }
  public bool IsCorrect { get; set; }
}
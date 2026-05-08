public class QuizResultDto
{
  public bool IsCorrect { get; set; }
  public string CorrectDefinition { get; set; } = string.Empty;
  public string CorrectWord { get; set; } = string.Empty;
  public DateTime NextReviewDate { get; set; }
}
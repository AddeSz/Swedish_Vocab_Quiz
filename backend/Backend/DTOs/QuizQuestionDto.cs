public class QuizQuestionDto
{
  public Guid WordId { get; set; }
  public string Word { get; set; } = string.Empty;
  public List<string> Options { get; set; } = [];
  // Sent to client so the frontend can evaluate answers locally without a round-trip
  public int CorrectIndex { get; set; }
}
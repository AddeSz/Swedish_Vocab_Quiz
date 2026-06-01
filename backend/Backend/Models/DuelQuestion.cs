namespace Backend.Models;

public class DuelQuestion
{
  public string QuestionText { get; set; } = string.Empty;
  public List<string> Options { get; set; } = [];
  public int CorrectAnswerIndex { get; set; }
}

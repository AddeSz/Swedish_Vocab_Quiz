public class QuizAnswerDto
{
    public Guid WordFormId { get; set; }
    public int SelectedIndex { get; set; }
    public bool IsCorrect { get; set; }
    public QuizMode Mode { get; set; } = QuizMode.WordToDefinition;
}
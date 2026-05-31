public enum QuizMode { WordToDefinition, DefinitionToWord }

public class QuizQuestionDto
{
    public Guid WordFormId { get; set; }
    public string Word { get; set; } = string.Empty;
    public List<string> Options { get; set; } = [];
    public int CorrectIndex { get; set; }
}

public class QuizAnswerDto
{
    public Guid WordFormId { get; set; }
    public int SelectedIndex { get; set; }
    public bool IsCorrect { get; set; }
    public QuizMode Mode { get; set; } = QuizMode.WordToDefinition;
}

public class QuizResultDto
{
    public bool IsCorrect { get; set; }
    public string CorrectDefinition { get; set; } = string.Empty;
    public string CorrectWord { get; set; } = string.Empty;
    public DateTime NextReviewDate { get; set; }
    public List<string> Examples { get; set; } = [];
}

public class Word
{
    public Guid Id { get; set; }
    public string SourceId { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string WordType { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public bool IsReviewed { get; set; } = false;
    public int WordFormCount { get; set; }

    public ICollection<WordForm> WordForms { get; set; } = [];
    public ICollection<UserWordProgress> UserWordProgresses { get; set; } = [];
}
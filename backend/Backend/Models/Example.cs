public class Example
{
    public Guid Id { get; set; }
    public Guid WordFormId { get; set; }
    public WordForm WordForm { get; set; } = null!;
    public string Text { get; set; } = string.Empty;
    public bool IsReviewed { get; set; } = false;
}
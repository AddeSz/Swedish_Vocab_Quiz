public class WordDto
{
    public Guid Id { get; set; }
    public string Value { get; set; } = string.Empty;
    public string WordType { get; set; } = string.Empty;
    public int WordFormCount { get; set; }
    public List<WordFormDto> Meanings { get; set; } = [];
}
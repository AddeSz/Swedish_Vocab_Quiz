public class WordDto
{
    public Guid Id { get; set; }
    public string Value { get; set; } = string.Empty;
    public string WordType { get; set; } = string.Empty;
    public int WordFormCount { get; set; }
    public List<WordFormDto> Meanings { get; set; } = [];
}

public class WordFormDto
{
    public Guid Id { get; set; }
    public int FormNo { get; set; }
    public string? Graminfo { get; set; }
    public List<string> Definitions { get; set; } = [];
    public List<string> Examples { get; set; } = [];
}

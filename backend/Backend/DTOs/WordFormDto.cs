public class WordFormDto
{
    public Guid Id { get; set; }
    public int FormNo { get; set; }
    public string? Graminfo { get; set; }
    public List<string> Definitions { get; set; } = [];
    public List<string> Examples { get; set; } = [];
}

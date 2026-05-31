public class WordForm
{
    public Guid Id { get; set; }
    public Guid WordId { get; set; }
    public Word Word { get; set; } = null!;
    public int FormNo { get; set; }
    public string? Graminfo { get; set; }

    public ICollection<Definition> Definitions { get; set; } = [];
    public ICollection<Example> Examples { get; set; } = [];
}

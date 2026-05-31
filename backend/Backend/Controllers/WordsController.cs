using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class WordsController : ControllerBase
{
    private readonly AppDbContext _db;

    public WordsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetWords([FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var words = await _db.Words
            .OrderBy(w => w.Value)
            .Skip(skip)
            .Take(take)
            .Include(w => w.WordForms).ThenInclude(m => m.Definitions)
            .Include(w => w.WordForms).ThenInclude(m => m.Examples)
            .Select(w => new WordDto
            {
                Id = w.Id,
                Value = w.Value,
                WordType = w.WordType,
                WordFormCount = w.WordFormCount,
                Meanings = w.WordForms.OrderBy(m => m.FormNo).Select(m => new WordFormDto
                {
                    Id = m.Id,
                    FormNo = m.FormNo,
                    Graminfo = m.Graminfo,
                    Definitions = m.Definitions.Select(d => d.Text).ToList(),
                    Examples = m.Examples.Select(e => e.Text).ToList(),
                }).ToList(),
            })
            .ToListAsync();

        return Ok(words);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetWord(Guid id)
    {
        var word = await _db.Words
            .Include(w => w.WordForms).ThenInclude(m => m.Definitions)
            .Include(w => w.WordForms).ThenInclude(m => m.Examples)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (word is null) return NotFound();

        return Ok(new WordDto
        {
            Id = word.Id,
            Value = word.Value,
            WordType = word.WordType,
            WordFormCount = word.WordFormCount,
            Meanings = word.WordForms.OrderBy(m => m.FormNo).Select(m => new WordFormDto
            {
                Id = m.Id,
                FormNo = m.FormNo,
                Graminfo = m.Graminfo,
                Definitions = m.Definitions.Select(d => d.Text).ToList(),
                Examples = m.Examples.Select(e => e.Text).ToList(),
            }).ToList(),
        });
    }
}
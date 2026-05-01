using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class WordsController : ControllerBase
{
  private readonly AppDbContext _db;

  public WordsController(AppDbContext db)
  {
    _db = db;
  }

  [HttpGet]
  public async Task<IActionResult> GetWords([FromQuery] string? difficulty)
  {
    var query = _db.Words.AsQueryable();

    if (!string.IsNullOrEmpty(difficulty) && Enum.TryParse<CefrLevel>(difficulty, out var level))
      query = query.Where(w => w.DifficultyLevel == level);

    var words = await query
        .OrderBy(w => w.FrequencyRank)
        .Take(50)
        .Select(w => new WordDto
        {
          Id = w.Id,
          Text = w.Text,
          Definition = w.Definition,
          PartOfSpeech = w.PartOfSpeech,
          DifficultyLevel = w.DifficultyLevel.ToString(),
          FrequencyRank = w.FrequencyRank,
        })
        .ToListAsync();

    return Ok(words);
  }

  [HttpGet("{id:guid}")]
  public async Task<IActionResult> GetWord(Guid id)
  {
    var word = await _db.Words.FindAsync(id);
    if (word is null) return NotFound();

    return Ok(new WordDto
    {
      Id = word.Id,
      Text = word.Text,
      Definition = word.Definition,
      PartOfSpeech = word.PartOfSpeech,
      DifficultyLevel = word.DifficultyLevel.ToString(),
      FrequencyRank = word.FrequencyRank,
    });
  }
}
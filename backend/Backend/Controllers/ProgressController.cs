using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class ProgressController : ControllerBase
{
  private readonly AppDbContext _db;
  private static readonly Guid UserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

  public ProgressController(AppDbContext db)
  {
    _db = db;
  }

  [HttpGet]
  public async Task<IActionResult> GetProgress()
  {
    var progresses = await _db.UserWordProgresses
        .Where(p => p.UserId == UserId)
        .ToListAsync();

    return Ok(new ProgressDto
    {
      TotalWordsSeen = progresses.Count,
      TotalCorrect = progresses.Sum(p => p.CorrectCount),
      TotalIncorrect = progresses.Sum(p => p.IncorrectCount),
      WordsDueForReview = progresses.Count(p => p.NextReviewDate <= DateTime.UtcNow),
    });
  }

  [HttpGet("weak-words")]
  public async Task<IActionResult> GetWeakWords()
  {
    var weakWords = await _db.UserWordProgresses
        .Where(p => p.UserId == UserId)
        .OrderBy(p => p.EaseFactor)
        .Take(20)
        .Join(_db.Words,
            p => p.WordId,
            w => w.Id,
            (p, w) => new WordDto
            {
              Id = w.Id,
              Text = w.Text,
              Definition = w.Definition,
              PartOfSpeech = w.PartOfSpeech,
              DifficultyLevel = w.DifficultyLevel.ToString(),
              FrequencyRank = w.FrequencyRank,
            })
        .ToListAsync();

    return Ok(weakWords);
  }
}
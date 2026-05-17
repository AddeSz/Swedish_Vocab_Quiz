using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProgressController : ControllerBase
{
  private readonly AppDbContext _db;
  private readonly CurrentUserService _currentUserService;

  public ProgressController(AppDbContext db, CurrentUserService currentUserService)
  {
    _db = db;
    _currentUserService = currentUserService;
  }

  [HttpGet]
  public async Task<IActionResult> GetProgress()
  {
    var user = await _currentUserService.GetRequiredUserAsync();

    var progresses = await _db.UserWordProgresses
        .Where(p => p.UserId == user.Id)
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
    var user = await _currentUserService.GetRequiredUserAsync();

    var weakWords = await _db.UserWordProgresses
        .Where(p => p.UserId == user.Id)
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
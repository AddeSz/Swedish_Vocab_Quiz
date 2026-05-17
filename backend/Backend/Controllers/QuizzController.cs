using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
  private readonly AppDbContext _db;
  private readonly CurrentUserService _currentUserService;

  public QuizController(AppDbContext db, CurrentUserService currentUserService)
  {
    _db = db;
    _currentUserService = currentUserService;
  }

  [HttpGet]
  public async Task<IActionResult> GetQuestion()
  {
    var now = DateTime.UtcNow;
    Guid? userId = null;

    if (User.Identity?.IsAuthenticated == true)
    {
      var user = await _currentUserService.GetRequiredUserAsync();
      userId = user.Id;
    }

    var word = await _db.Words
        .Where(w => userId == null || !_db.UserWordProgresses.Any(p => p.UserId == userId && p.WordId == w.Id && p.NextReviewDate > now))
        .OrderBy(_ => EF.Functions.Random())
        .FirstOrDefaultAsync();

    if (word is null) return NotFound("No words available for review.");

    var distractors = await _db.Words
        .Where(w => w.Id != word.Id && w.DifficultyLevel == word.DifficultyLevel)
        .OrderBy(_ => EF.Functions.Random())
        .Take(3)
        .Select(w => w.Definition)
        .ToListAsync();

    if (distractors.Count < 3)
      return Problem("Not enough words in database to generate quiz.");

    var options = distractors.Append(word.Definition).OrderBy(_ => Guid.NewGuid()).ToList();
    var correctIndex = options.IndexOf(word.Definition);

    return Ok(new QuizQuestionDto
    {
      WordId = word.Id,
      Word = word.Text,
      Options = options,
      CorrectIndex = correctIndex,
    });
  }

  [HttpPost("answer")]
  public async Task<IActionResult> SubmitAnswer([FromBody] QuizAnswerDto answer)
  {
    var word = await _db.Words.FindAsync(answer.WordId);
    if (word is null) return NotFound();

    UserWordProgress? progress = null;
    if (User.Identity?.IsAuthenticated == true)
    {
      var user = await _currentUserService.GetRequiredUserAsync();
      progress = await UpdateProgress(user.Id, answer.WordId, answer.IsCorrect);
    }

    return Ok(new QuizResultDto
    {
      IsCorrect = answer.IsCorrect,
      CorrectDefinition = word.Definition,
      CorrectWord = word.Text,
      NextReviewDate = progress?.NextReviewDate ?? DateTime.UtcNow,
    });
  }

  [HttpGet("reverse")]
  public async Task<IActionResult> GetReverseQuestion()
  {
    var now = DateTime.UtcNow;
    Guid? userId = null;

    if (User.Identity?.IsAuthenticated == true)
    {
      var user = await _currentUserService.GetRequiredUserAsync();
      userId = user.Id;
    }

    var word = await _db.Words
        .Where(w => userId == null || !_db.UserWordProgresses.Any(p => p.UserId == userId && p.WordId == w.Id && p.NextReviewDate > now))
        .OrderBy(_ => EF.Functions.Random())
        .FirstOrDefaultAsync();

    if (word is null) return NotFound("No words available for review.");

    var distractors = await _db.Words
        .Where(w => w.Id != word.Id && w.DifficultyLevel == word.DifficultyLevel)
        .OrderBy(_ => EF.Functions.Random())
        .Take(3)
        .Select(w => w.Text)
        .ToListAsync();

    if (distractors.Count < 3)
      return Problem("Not enough words in database to generate quiz.");

    var options = distractors.Append(word.Text).OrderBy(_ => Guid.NewGuid()).ToList();
    var correctIndex = options.IndexOf(word.Text);

    return Ok(new QuizQuestionDto
    {
      WordId = word.Id,
      Word = word.Definition,
      Options = options,
      CorrectIndex = correctIndex,
    });
  }

  [HttpPost("reverse/answer")]
  public async Task<IActionResult> SubmitReverseAnswer([FromBody] QuizAnswerDto answer)
  {
    var word = await _db.Words.FindAsync(answer.WordId);
    if (word is null) return NotFound();

    UserWordProgress? progress = null;
    if (User.Identity?.IsAuthenticated == true)
    {
      var user = await _currentUserService.GetRequiredUserAsync();
      progress = await UpdateProgress(user.Id, answer.WordId, answer.IsCorrect);
    }

    return Ok(new QuizResultDto
    {
      IsCorrect = answer.IsCorrect,
      CorrectDefinition = word.Definition,
      CorrectWord = word.Text,
      NextReviewDate = progress?.NextReviewDate ?? DateTime.UtcNow,
    });
  }

  private async Task<UserWordProgress> UpdateProgress(Guid userId, Guid wordId, bool isCorrect)
  {
    var progress = await _db.UserWordProgresses
        .FirstOrDefaultAsync(p => p.UserId == userId && p.WordId == wordId);

    if (progress is null)
    {
      progress = new UserWordProgress
      {
        UserId = userId,
        WordId = wordId,
        EaseFactor = 2.5f,
        IntervalDays = 1,
        LastSeen = DateTime.UtcNow,
        NextReviewDate = DateTime.UtcNow,
      };
      _db.UserWordProgresses.Add(progress);
    }

    int quality = isCorrect ? 5 : 1;
    progress.EaseFactor = Math.Max(1.3f,
        progress.EaseFactor + 0.1f - (5 - quality) * (0.08f + (5 - quality) * 0.02f));

    progress.IntervalDays = !isCorrect
        ? 1
        : progress.IntervalDays == 1
            ? 6
            : (int)Math.Round(progress.IntervalDays * progress.EaseFactor);

    progress.LastSeen = DateTime.UtcNow;
    progress.NextReviewDate = DateTime.UtcNow.AddDays(progress.IntervalDays);

    if (isCorrect) progress.CorrectCount++;
    else progress.IncorrectCount++;

    await _db.SaveChangesAsync();
    return progress;
  }
}
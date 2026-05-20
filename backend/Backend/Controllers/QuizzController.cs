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

  // Quiz works for both anonymous and authenticated users.
  // Anonymous users get random words; authenticated users get spaced-repetition-filtered words.
  // Recognition: Swedish word → pick definition. Recall: definition → pick Swedish word.
  [HttpGet]
  public async Task<IActionResult> GetQuestion([FromQuery] QuizMode mode = QuizMode.WordToDefinition)
  {
    var now = DateTime.UtcNow;
    Guid? userId = null;

    if (User.Identity?.IsAuthenticated == true)
    {
      var user = await _currentUserService.GetRequiredUserAsync();
      userId = user.Id;
    }

    // For authenticated users, exclude words not yet due for review (NextReviewDate in the future)
    var word = await _db.Words
        .Where(w => userId == null || !_db.UserWordProgresses.Any(p => p.UserId == userId && p.WordId == w.Id && p.NextReviewDate > now))
        .OrderBy(_ => EF.Functions.Random())
        .FirstOrDefaultAsync();

    if (word is null) return NotFound("No words available for review.");

    // Distractors are pulled from the same CEFR level to keep difficulty consistent
    // Recognition uses definitions as options; Recall uses word text as options
    var isRecall = mode == QuizMode.DefinitionToWord;

    var distractors = await _db.Words
        .Where(w => w.Id != word.Id && w.DifficultyLevel == word.DifficultyLevel)
        .OrderBy(_ => EF.Functions.Random())
        .Take(3)
        .Select(w => isRecall ? w.Text : w.Definition)
        .ToListAsync();

    if (distractors.Count < 3)
      return Problem("Not enough words in database to generate quiz.");

    var correctOption = isRecall ? word.Text : word.Definition;
    var options = distractors.Append(correctOption).OrderBy(_ => Guid.NewGuid()).ToList();
    var correctIndex = options.IndexOf(correctOption);

    return Ok(new QuizQuestionDto
    {
      WordId = word.Id,
      Word = isRecall ? word.Definition : word.Text,
      Options = options,
      CorrectIndex = correctIndex,
    });
  }

  [HttpPost("answer")]
  public async Task<IActionResult> SubmitAnswer([FromBody] QuizAnswerDto answer)
  {
    var word = await _db.Words.FindAsync(answer.WordId);
    if (word is null) return NotFound();

    // Only update spaced repetition progress for authenticated users
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

  // Modified SM-2 spaced repetition algorithm.
  // Quality is binary (correct=5, incorrect=1) rather than the original 0-5 scale.
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

    // SM-2 ease factor formula; quality mapped to binary (5 or 1)
    int quality = isCorrect ? 5 : 1;
    progress.EaseFactor = Math.Max(1.3f,
        progress.EaseFactor + 0.1f - (5 - quality) * (0.08f + (5 - quality) * 0.02f));

    // Interval progression: 1 day → 6 days → previous * ease factor
    // Incorrect answer resets to 1 day
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
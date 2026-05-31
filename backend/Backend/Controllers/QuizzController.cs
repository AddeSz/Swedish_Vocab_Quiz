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
    public async Task<IActionResult> GetQuestion([FromQuery] QuizMode mode = QuizMode.WordToDefinition)
    {
        var now = DateTime.UtcNow;
        Guid? userId = null;

        if (User.Identity?.IsAuthenticated == true)
        {
            var user = await _currentUserService.GetRequiredUserAsync();
            userId = user.Id;
        }

        // Pick a random WordForm that has at least one Definition
        // For authenticated users, exclude forms whose parent Word has a future NextReviewDate
        var meaning = await _db.WordForms
            .Include(m => m.Word)
            .Include(m => m.Definitions)
            .Include(m => m.Examples)
            .Where(m => m.Definitions.Any())
            .Where(m => userId == null || !_db.UserWordProgresses.Any(p =>
                p.UserId == userId && p.WordId == m.WordId && p.NextReviewDate > now))
            .OrderBy(_ => EF.Functions.Random())
            .FirstOrDefaultAsync();

        if (meaning is null) return NotFound("No words available for review.");

        var isRecall = mode == QuizMode.DefinitionToWord;
        var correctDefinition = meaning.Definitions.First().Text;

        List<string> distractors;
        string correctOption;

        if (isRecall)
        {
            // Distractors are random Word.Value from other words
            distractors = await _db.Words
                .Where(w => w.Id != meaning.WordId)
                .OrderBy(_ => EF.Functions.Random())
                .Take(3)
                .Select(w => w.Value)
                .ToListAsync();
            correctOption = meaning.Word.Value;
        }
        else
        {
            // Distractors are random definitions from other WordForms
            distractors = await _db.Definitions
                .Where(d => d.WordFormId != meaning.Id)
                .OrderBy(_ => EF.Functions.Random())
                .Take(3)
                .Select(d => d.Text)
                .ToListAsync();
            correctOption = correctDefinition;
        }

        if (distractors.Count < 3)
            return Problem("Not enough words in database to generate quiz.");

        var options = distractors.Append(correctOption).OrderBy(_ => Guid.NewGuid()).ToList();

        return Ok(new QuizQuestionDto
        {
            WordFormId = meaning.Id,
            Word = isRecall ? correctDefinition : meaning.Word.Value,
            Options = options,
            CorrectIndex = options.IndexOf(correctOption),
        });
    }

    [HttpPost("answer")]
    public async Task<IActionResult> SubmitAnswer([FromBody] QuizAnswerDto answer)
    {
        var meaning = await _db.WordForms
            .Include(m => m.Word)
            .Include(m => m.Definitions)
            .Include(m => m.Examples)
            .FirstOrDefaultAsync(m => m.Id == answer.WordFormId);

        if (meaning is null) return NotFound();

        UserWordProgress? progress = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            var user = await _currentUserService.GetRequiredUserAsync();
            progress = await UpdateProgress(user.Id, meaning.WordId, answer.IsCorrect);
        }

        return Ok(new QuizResultDto
        {
            IsCorrect = answer.IsCorrect,
            CorrectDefinition = meaning.Definitions.First().Text,
            CorrectWord = meaning.Word.Value,
            NextReviewDate = progress?.NextReviewDate ?? DateTime.UtcNow,
            Examples = meaning.Examples.Select(e => e.Text).ToList(),
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
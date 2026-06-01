using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class DuelQuestionService
{
  private readonly AppDbContext _dbContext;
  private readonly Random _random = new();

  public DuelQuestionService(AppDbContext dbContext)
  {
    _dbContext = dbContext;
  }

  public List<DuelQuestion> GenerateDuelQuestions()
  {
    var wordForms = _dbContext.WordForms
      .Include(wf => wf.Word)
      .Include(wf => wf.Definitions)
      .Where(wf => wf.Definitions.Any())
      .OrderBy(_ => EF.Functions.Random())
      .Take(10)
      .ToList();

    var questions = new List<DuelQuestion>();
    foreach (var wf in wordForms)
    {
      var definition = wf.Definitions.First().Text;
      var isWordToDefinition = _random.Next(2) == 0;

      var correctAnswer = isWordToDefinition ? definition : wf.Word.Value;
      var questionText = isWordToDefinition ? wf.Word.Value : definition;

      var distractors = GetDistractors(isWordToDefinition, correctAnswer, 3);
      var options = new List<string> { correctAnswer };
      options.AddRange(distractors);
      options = options.OrderBy(_ => _random.Next()).ToList();

      questions.Add(new DuelQuestion
      {
        QuestionText = questionText,
        Options = options,
        CorrectAnswerIndex = options.IndexOf(correctAnswer)
      });
    }

    return questions;
  }

  private List<string> GetDistractors(bool isWordToDefinition, string correctAnswer, int count)
  {
    var distractors = isWordToDefinition
      ? _dbContext.Definitions
          .Where(d => d.Text != correctAnswer)
          .OrderBy(_ => EF.Functions.Random())
          .Take(count)
          .Select(d => d.Text)
          .ToList()
      : _dbContext.Words
          .Where(w => w.Value != correctAnswer)
          .OrderBy(_ => EF.Functions.Random())
          .Take(count)
          .Select(w => w.Value)
          .ToList();

    while (distractors.Count < count)
    {
      distractors.Add($"Option {distractors.Count + 1}");
    }

    return distractors;
  }
}

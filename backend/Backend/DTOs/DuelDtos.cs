namespace Backend.DTOs;

public record DuelQuestionDto(
  string QuestionText,
  List<string> Options,
  int QuestionIndex
);

public record DuelReviewDto(
  int CorrectAnswerIndex,
  int? Player1Answer,
  int? Player2Answer,
  int Player1Score,
  int Player2Score
);

public record QuestionResultDto(
  int QuestionIndex,
  string QuestionText,
  int CorrectAnswerIndex,
  int? Player1Answer,
  int? Player2Answer
);

public record DuelResultDto(
  int Player1Score,
  int Player2Score,
  Guid? WinnerUserId,
  List<QuestionResultDto> QuestionBreakdown
);

public record DuelStatsDto(
  int Wins,
  int Ties,
  int Losses,
  double WinRate
);

public record DuelHistoryDto(
  Guid Id,
  string OpponentName,
  bool IsWin,
  bool IsTie,
  DateTime CompletedAtUtc
);

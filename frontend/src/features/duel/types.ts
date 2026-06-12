export type DuelPhase =
  | "pregame"
  | "question"
  | "review"
  | "completed"
  | "forfeited";

export interface DuelQuestion {
  questionText: string;
  options: string[];
  questionIndex: number;
}

export interface DuelReview {
  correctAnswerIndex: number;
  player1Answer: number | null;
  player2Answer: number | null;
  player1Score: number;
  player2Score: number;
}

export interface QuestionResult {
  questionIndex: number;
  questionText: string;
  correctAnswerIndex: number;
  player1Answer: number | null;
  player2Answer: number | null;
}

export interface DuelResult {
  player1Score: number;
  player2Score: number;
  winnerUserId: string | null;
  questionBreakdown: QuestionResult[];
}

export interface RejoinState {
  phase: string;
  player1Score: number;
  player2Score: number;
  phaseData: any;
}

export interface PersistedDuelState {
  phase: DuelPhase;
  result: DuelResult | null;
}

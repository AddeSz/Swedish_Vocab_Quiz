import type { DuelPhase, DuelQuestion, DuelResult, DuelReview } from "./types";

export interface DuelGameState {
  phase: DuelPhase;

  question: DuelQuestion | null;
  review: DuelReview | null;
  result: DuelResult | null;

  selectedAnswer: number | null;

  timeLeft: number;

  myScore: number;
  opponentScore: number;

  isReady: boolean;

  reconnecting: boolean;

  opponentDisconnected: boolean;
  opponentDisconnectSecondsLeft: number;
}

export const initialDuelGameState: DuelGameState = {
  phase: "pregame",

  question: null,
  review: null,
  result: null,

  selectedAnswer: null,

  timeLeft: 10,

  myScore: 0,
  opponentScore: 0,

  isReady: false,

  reconnecting: false,

  opponentDisconnected: false,
  opponentDisconnectSecondsLeft: 5
};

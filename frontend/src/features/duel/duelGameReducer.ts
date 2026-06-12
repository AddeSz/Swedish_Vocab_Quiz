import type { DuelGameState } from "./duelGameState";
import type { DuelQuestion, DuelResult, DuelReview } from "./types";

export type DuelGameAction =
  | { type: "QUESTION_STARTED"; payload: DuelQuestion }
  | {
      type: "REVIEW_STARTED";
      payload: { review: DuelReview; myScore: number; opponentScore: number };
    }
  | { type: "DUEL_COMPLETED"; payload: DuelResult }
  | { type: "FORFEIT" }
  | { type: "ANSWER_SELECTED"; payload: number }
  | { type: "READY" }
  | { type: "SET_TIME_LEFT"; payload: number }
  | { type: "RECONNECTED_STATE"; payload: Partial<DuelGameState> }
  | { type: "SET_RECONNECTING"; payload: boolean }
  | { type: "OPPONENT_DISCONNECTED"; payload: number }
  | { type: "OPPONENT_RECONNECTED" };

export function duelGameReducer(
  state: DuelGameState,
  action: DuelGameAction
): DuelGameState {
  switch (action.type) {
    case "QUESTION_STARTED":
      return {
        ...state,
        phase: "question",
        question: action.payload,
        selectedAnswer: null,
        isReady: false,
        timeLeft: 10
      };

    case "ANSWER_SELECTED":
      return { ...state, selectedAnswer: action.payload };

    case "READY":
      return { ...state, isReady: true };

    case "REVIEW_STARTED":
      return {
        ...state,
        phase: "review",
        review: action.payload.review,
        myScore: action.payload.myScore,
        opponentScore: action.payload.opponentScore,
        timeLeft: 5
      };

    case "DUEL_COMPLETED":
      return { ...state, phase: "completed", result: action.payload };

    case "FORFEIT":
      return { ...state, phase: "forfeited" };

    case "SET_TIME_LEFT":
      return { ...state, timeLeft: action.payload };

    case "SET_RECONNECTING":
      return { ...state, reconnecting: action.payload };

    case "OPPONENT_DISCONNECTED":
      return {
        ...state,
        opponentDisconnected: true,
        opponentDisconnectSecondsLeft: action.payload
      };

    case "OPPONENT_RECONNECTED":
      return { ...state, opponentDisconnected: false };

    // NOTE: The partial must be self-consistent — callers (rejoinMapper) are
    // responsible for ensuring required fields like selectedAnswer are reset.
    case "RECONNECTED_STATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

import type { DuelGameState } from "./duelGameState";
import type { RejoinState } from "./types";

export function mapRejoinState(
  state: RejoinState,
  isPlayer1: boolean
): Partial<DuelGameState> {
  const myScore = isPlayer1 ? state.player1Score : state.player2Score;
  const opponentScore = isPlayer1 ? state.player2Score : state.player1Score;

  if (state.phase === "Question") {
    return {
      phase: "question",
      myScore,
      opponentScore,
      selectedAnswer: null,
      timeLeft: Math.max(
        0,
        Math.ceil(
          (new Date(state.phaseData.questionEndsAtUtc).getTime() - Date.now()) /
            1000
        )
      ),
      question: {
        questionText: state.phaseData.questionText,
        options: state.phaseData.options,
        questionIndex: state.phaseData.questionIndex
      }
    };
  }

  if (state.phase === "Review") {
    return {
      phase: "review",
      myScore,
      opponentScore,
      timeLeft: Math.max(
        0,
        Math.ceil(
          (new Date(state.phaseData.reviewEndsAtUtc).getTime() - Date.now()) /
            1000
        )
      ),
      review: {
        correctAnswerIndex: state.phaseData.correctAnswerIndex,
        player1Answer: state.phaseData.player1Answer,
        player2Answer: state.phaseData.player2Answer,
        player1Score: state.phaseData.player1Score,
        player2Score: state.phaseData.player2Score
      }
    };
  }

  return {};
}

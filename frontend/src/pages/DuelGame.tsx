import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDuel } from "../context/DuelContext";

type DuelPhase = "question" | "review" | "completed" | "forfeited";

interface DuelQuestion {
  questionText: string;
  options: string[];
  questionIndex: number;
}

interface DuelReview {
  correctAnswerIndex: number;
  player1Answer: number | null;
  player2Answer: number | null;
  player1Score: number;
  player2Score: number;
}

interface QuestionResult {
  questionIndex: number;
  questionText: string;
  correctAnswerIndex: number;
  player1Answer: number | null;
  player2Answer: number | null;
}

interface DuelResult {
  player1Score: number;
  player2Score: number;
  winnerUserId: string | null;
  questionBreakdown: QuestionResult[];
}

interface PersistedDuelState {
  phase: DuelPhase;
  result: DuelResult | null;
}

function getPersistedState(duelId: string): PersistedDuelState | null {
  try {
    const raw = sessionStorage.getItem(`duel-result-${duelId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistState(duelId: string, state: PersistedDuelState) {
  try {
    sessionStorage.setItem(`duel-result-${duelId}`, JSON.stringify(state));
  } catch {
    // ignore for now
  }
}

function clearPersistedState(duelId: string) {
  sessionStorage.removeItem(`duel-result-${duelId}`);
}

export default function DuelGame() {
  const [searchParams] = useSearchParams();
  const duelId = searchParams.get("id");
  const opponentName = searchParams.get("opponent");
  const playerNumber = parseInt(searchParams.get("player") ?? "1");
  const isPlayer1 = playerNumber === 1;
  const navigate = useNavigate();
  const { connection, connect, disconnect } = useDuel();

  const persisted = duelId ? getPersistedState(duelId) : null;
  console.log("[DuelGame] persisted state:", persisted);

  const [phase, setPhase] = useState<DuelPhase>(persisted?.phase ?? "question");
  const [question, setQuestion] = useState<DuelQuestion | null>(null);
  const [review, setReview] = useState<DuelReview | null>(null);
  const [result, setResult] = useState<DuelResult | null>(
    persisted?.result ?? null
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phase === "completed" || phase === "forfeited") {
      disconnect();
    }
  }, [phase]);

  const duelSetupDoneRef = useRef<string | null>(null);

  useEffect(() => {
    if (!duelId) {
      navigate("/duel");
      return;
    }

    if (persisted) {
      console.log("[DuelGame] persisted game found, skipping hub setup");
      return;
    }

    if (duelSetupDoneRef.current === duelId) {
      console.log("[DuelGame] setup already done for this duel, skipping");
      return;
    }

    duelSetupDoneRef.current = duelId;
    console.log("[DuelGame] running initial setup for duel:", duelId);

    let questionHandler: ((data: DuelQuestion) => void) | undefined;
    let reviewHandler: ((data: DuelReview) => void) | undefined;
    let completedHandler: ((data: DuelResult) => void) | undefined;
    let forfeitHandler: (() => void) | undefined;
    let stateRestoredHandler: ((state: any) => void) | undefined;

    const setupDuel = async () => {
      try {
        const hub = await connect();
        if (!hub) {
          console.log(
            "[DuelGame] connection is null after connect(), aborting"
          );
          return;
        }

        hub.onreconnecting(() => setReconnecting(true));

        hub.onreconnected(async () => {
          console.log("[DuelGame] onreconnected fired");
          setReconnecting(false);
          try {
            await hub.invoke("ReconnectToDuel", duelId);
          } catch (err) {
            console.error("Reconnection failed:", err);
            setError("Failed to reconnect. Returning to menu...");
            setTimeout(() => navigate("/duel"), 3000);
          }
        });

        questionHandler = (data) => {
          setPhase("question");
          setQuestion(data);
          setSelectedAnswer(null);
          setIsReady(false);
          setTimeLeft(10);
        };
        hub.on("QuestionStarted", questionHandler);

        reviewHandler = (data) => {
          setPhase("review");
          setReview(data);
          setMyScore(isPlayer1 ? data.player1Score : data.player2Score);
          setOpponentScore(isPlayer1 ? data.player2Score : data.player1Score);
          setTimeLeft(5);
        };
        hub.on("ReviewStarted", reviewHandler);

        completedHandler = (data) => {
          setPhase("completed");
          setResult(data);
          persistState(duelId, { phase: "completed", result: data });
        };
        hub.on("DuelCompleted", completedHandler);

        forfeitHandler = () => {
          setPhase("forfeited");
          persistState(duelId, { phase: "forfeited", result: null });
        };
        hub.on("Forfeit", forfeitHandler);

        stateRestoredHandler = (state) => {
          const newPhase = state.phase.toLowerCase() as DuelPhase;
          setPhase(newPhase);
          setMyScore(isPlayer1 ? state.player1Score : state.player2Score);
          setOpponentScore(isPlayer1 ? state.player2Score : state.player1Score);

          if (state.question) {
            setQuestion({
              questionText: state.question.questionText,
              options: state.question.options,
              questionIndex: state.question.questionIndex
            });
            setSelectedAnswer(state.submittedAnswer ?? null);
            setIsReady(false);
            setTimeLeft(10);
          }

          if (state.review) {
            setReview({
              correctAnswerIndex: state.review.correctAnswerIndex,
              player1Answer: state.review.player1Answer,
              player2Answer: state.review.player2Answer,
              player1Score: state.review.player1Score,
              player2Score: state.review.player2Score
            });
            setQuestion({
              questionText: state.review.questionText,
              options: state.review.options,
              questionIndex: state.review.questionIndex
            });
            setTimeLeft(5);
          }

          if (state.result) {
            setResult(state.result);
            persistState(duelId, { phase: newPhase, result: state.result });
          }
        };
        hub.on("StateRestored", stateRestoredHandler);

        await hub.invoke("JoinDuelGroup", duelId);
        await hub.invoke("ReadyToPlay", duelId);
      } catch (error) {
        console.error("Failed to setup duel:", error);
        navigate("/duel");
      }
    };

    setupDuel();

    return () => {
      duelSetupDoneRef.current = null;
    };
  }, [duelId]);

  useEffect(() => {
    if (phase === "question" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "review" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, phase]);

  useEffect(() => {
    return () => {
      if (!connection || !duelId) return;
      connection.invoke("LeaveDuel", duelId).catch(() => {});
    };
  }, [connection, duelId]);

  const handleAnswerSelect = async (index: number) => {
    if (phase !== "question" || !connection || !duelId) return;
    setSelectedAnswer(index);
    try {
      await connection.invoke("SubmitAnswer", duelId, index);
    } catch (err) {
      console.error("Failed to submit answer:", err);
    }
  };

  const handleReady = async () => {
    if (!connection || !duelId || isReady) return;
    setIsReady(true);
    try {
      await connection.invoke("ReadyForNext", duelId);
    } catch (err) {
      console.error("Failed to mark ready:", err);
      setIsReady(false);
    }
  };

  const handleLeave = (to: string) => {
    if (duelId) clearPersistedState(duelId);
    navigate(to);
  };

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center animate-in">
        <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 max-w-md w-full text-center bg-(--bg-elevated)">
          <h1 className="text-xl font-semibold text-red-500 dark:text-red-400 mb-4">
            Fel
          </h1>
          <p className="text-(--text) mb-6">{error}</p>
          <button
            onClick={() => handleLeave("/duel")}
            className="px-5 py-2 text-sm rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
          >
            Tillbaka till matchmaking
          </button>
        </div>
      </main>
    );
  }

  if (reconnecting) {
    return (
      <main className="flex-1 flex items-center justify-center animate-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-(--accent) mx-auto mb-4"></div>
          <p className="text-(--text)">Återansluter...</p>
        </div>
      </main>
    );
  }

  if (phase === "forfeited") {
    return (
      <main className="flex-1 flex items-center justify-center animate-in">
        <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 max-w-md w-full text-center bg-(--bg-elevated)">
          <h1 className="text-2xl font-semibold text-(--text-h) mb-4">
            Motståndaren kopplade från
          </h1>
          <p className="text-(--text) mb-6">Du vinner genom walkover!</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleLeave("/duel")}
              className="px-5 py-2 text-sm rounded-lg bg-(--accent) hover:opacity-90 text-white font-medium transition-opacity cursor-pointer border-none"
            >
              Spela igen
            </button>
            <button
              onClick={() => handleLeave("/")}
              className="px-5 py-2 text-sm rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
            >
              Tillbaka till menyn
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "completed" && result) {
    const myFinalScore = isPlayer1 ? result.player1Score : result.player2Score;
    const theirFinalScore = isPlayer1
      ? result.player2Score
      : result.player1Score;
    const isTie = result.winnerUserId === null;
    const isWinner =
      !isTie &&
      ((isPlayer1 && result.player1Score > result.player2Score) ||
        (!isPlayer1 && result.player2Score > result.player1Score));

    return (
      <main className="flex-1 flex items-center justify-center p-4 animate-in">
        <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 max-w-2xl w-full bg-(--bg-elevated)">
          <h1 className="text-3xl font-semibold text-center mb-6 text-(--text-h)">
            {isTie ? "Oavgjort!" : isWinner ? "Du vinner!" : "Du förlorar"}
          </h1>

          <div className="flex justify-around mb-8 text-center">
            <div>
              <p className="text-xs tracking-wide text-(--text)">Du</p>
              <p className="text-3xl font-medium tracking-tight text-(--text-h)">
                {myFinalScore}
              </p>
            </div>
            <div>
              <p className="text-xs tracking-wide text-(--text)">
                {opponentName}
              </p>
              <p className="text-3xl font-medium tracking-tight text-(--text-h)">
                {theirFinalScore}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => handleLeave("/duel")}
              className="px-5 py-2 text-sm rounded-lg bg-(--accent) hover:opacity-90 text-white font-medium transition-opacity cursor-pointer border-none"
            >
              Spela igen
            </button>
            <button
              onClick={() => handleLeave("/")}
              className="px-5 py-2 text-sm rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
            >
              Tillbaka till menyn
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "review" && review && question) {
    return (
      <main className="flex-1 p-4 animate-in">
        <div className="max-w-4xl mx-auto">
          <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 bg-(--bg-elevated)">
            <div className="flex justify-between items-center mb-6">
              <div className="text-center">
                <p className="text-xs tracking-wide text-(--text)">Du</p>
                <p className="text-2xl font-medium text-(--text-h)">
                  {myScore}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-(--text-h)">
                  Fråga {question.questionIndex + 1}/10
                </p>
                <p className="text-xs text-(--text)">
                  Granskning ({timeLeft}s)
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs tracking-wide text-(--text)">
                  {opponentName}
                </p>
                <p className="text-2xl font-medium text-(--text-h)">
                  {opponentScore}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-(--text-h) mb-6 text-center">
              {question.questionText}
            </h2>

            <div className="space-y-3 mb-6">
              {question.options.map((option, index) => {
                const isCorrect = index === review.correctAnswerIndex;
                const myAnswer = isPlayer1
                  ? review.player1Answer
                  : review.player2Answer;
                const theirAnswer = isPlayer1
                  ? review.player2Answer
                  : review.player1Answer;
                const isMyAnswer = index === myAnswer;
                const isTheirAnswer = index === theirAnswer;

                let bgColor = "bg-(--bg)";
                if (isCorrect)
                  bgColor =
                    "bg-green-50 dark:bg-green-950 border-2 border-green-500";
                else if (isMyAnswer || isTheirAnswer)
                  bgColor = "bg-red-50 dark:bg-red-950";

                return (
                  <div key={index} className={`p-4 rounded-xl ${bgColor}`}>
                    <p className="text-(--text-h) font-medium text-sm">
                      {option}
                    </p>
                    {(isMyAnswer || isTheirAnswer) && (
                      <p className="text-xs text-(--text) mt-1">
                        {isMyAnswer && isTheirAnswer
                          ? "Båda valde"
                          : isMyAnswer
                            ? "Du valde"
                            : `${opponentName} valde`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              {isReady ? (
                <p className="text-(--text) text-sm">
                  Väntar på motståndare...
                </p>
              ) : (
                <button
                  onClick={handleReady}
                  className="px-6 py-2.5 text-sm rounded-lg bg-(--accent) hover:opacity-90 text-white font-medium transition-opacity cursor-pointer border-none"
                >
                  Klar
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "question" && question) {
    return (
      <main className="flex-1 p-4 animate-in">
        <div className="max-w-4xl mx-auto">
          <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 bg-(--bg-elevated)">
            <div className="flex justify-between items-center mb-6">
              <div className="text-center">
                <p className="text-xs tracking-wide text-(--text)">Du</p>
                <p className="text-2xl font-medium text-(--text-h)">
                  {myScore}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-(--text-h)">
                  Fråga {question.questionIndex + 1}/10
                </p>
                <p className="text-3xl font-semibold text-(--accent)">
                  {timeLeft}s
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs tracking-wide text-(--text)">
                  {opponentName}
                </p>
                <p className="text-2xl font-medium text-(--text-h)">
                  {opponentScore}
                </p>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-(--text-h) mb-6 text-center">
              {question.questionText}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-xl text-left font-medium text-sm transition-colors border cursor-pointer ${
                    selectedAnswer === index
                      ? "bg-(--accent) text-white border-(--accent)"
                      : "border-(--border) bg-(--bg) text-(--text-h) hover:border-(--accent-border) hover:bg-(--accent-bg)"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {selectedAnswer !== null && (
              <p className="text-center text-(--text) text-sm mt-4">
                Svar valt. Du kan fortfarande ändra det.
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center animate-in">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-(--accent) mx-auto mb-4"></div>
        <p className="text-(--text)">Laddar...</p>
      </div>
    </main>
  );
}

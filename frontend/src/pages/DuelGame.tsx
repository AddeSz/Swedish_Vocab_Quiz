import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
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

export default function DuelGame() {
  const [searchParams] = useSearchParams();
  const duelId = searchParams.get("id");
  const opponentName = searchParams.get("opponent");
  const playerNumber = parseInt(searchParams.get("player") ?? "1");
  const isPlayer1 = playerNumber === 1;
  const navigate = useNavigate();
  const { user } = useAuth0();
  const { connection, connect } = useDuel();

  const [phase, setPhase] = useState<DuelPhase>("question");
  const [question, setQuestion] = useState<DuelQuestion | null>(null);
  const [review, setReview] = useState<DuelReview | null>(null);
  const [result, setResult] = useState<DuelResult | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!duelId) {
      navigate("/duel");
      return;
    }

    const setupDuel = async () => {
      try {
        await connect();
        if (!connection) return;

        connection.onreconnecting(() => setReconnecting(true));
        connection.onreconnected(async () => {
          setReconnecting(false);
          try {
            await connection.invoke("ReconnectToDuel", duelId);
          } catch (err) {
            console.error("Reconnection failed:", err);
            setError("Failed to reconnect. Returning to menu...");
            setTimeout(() => navigate("/duel"), 3000);
          }
        });

        connection.on("QuestionStarted", (data: DuelQuestion) => {
          setPhase("question");
          setQuestion(data);
          setSelectedAnswer(null);
          setIsReady(false);
          setTimeLeft(10);
        });

        connection.on("ReviewStarted", (data: DuelReview) => {
          setPhase("review");
          setReview(data);
          setMyScore(isPlayer1 ? data.player1Score : data.player2Score);
          setOpponentScore(isPlayer1 ? data.player2Score : data.player1Score);
          setTimeLeft(5);
        });

        connection.on("DuelCompleted", (data: DuelResult) => {
          setPhase("completed");
          setResult(data);
        });

        connection.on("Forfeit", () => {
          setPhase("forfeited");
        });

        connection.on("StateRestored", (state: any) => {
          setPhase(state.phase.toLowerCase());
          setMyScore(isPlayer1 ? state.player1Score : state.player2Score);
          setOpponentScore(isPlayer1 ? state.player2Score : state.player1Score);
        });

        await connection.invoke("JoinDuelGroup", duelId);
        await connection.invoke("ReadyToPlay", duelId);
      } catch (error) {
        console.error("Failed to setup duel:", error);
        navigate("/duel");
      }
    };

    setupDuel();
  }, [duelId, connection, connect]);

  useEffect(() => {
    if (phase === "question" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "review" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, phase]);

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Error
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate("/duel")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
          >
            Back to Matchmaking
          </button>
        </div>
      </div>
    );
  }

  if (reconnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Reconnecting...
          </p>
        </div>
      </div>
    );
  }

  if (phase === "forfeited") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Opponent Disconnected
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            You win by forfeit!
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (phase === "completed" && result) {
    const myFinalScore = isPlayer1 ? result.player1Score : result.player2Score;
    const theirFinalScore = isPlayer1
      ? result.player2Score
      : result.player1Score;
    const myUserId = user?.sub;
    const isWinner = result.winnerUserId === myUserId;
    const isTie = result.winnerUserId === null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-center mb-6">
            {isTie ? (
              <span className="text-yellow-600">It's a Tie!</span>
            ) : isWinner ? (
              <span className="text-green-600">You Win!</span>
            ) : (
              <span className="text-red-600">You Lose</span>
            )}
          </h1>

          <div className="flex justify-around mb-8 text-center">
            <div>
              <p className="text-gray-600 dark:text-gray-400">You</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {myFinalScore}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">{opponentName}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {theirFinalScore}
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/duel")}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
            >
              Play Again
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "review" && review && question) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">You</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {myScore}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Question {question.questionIndex + 1}/10
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review ({timeLeft}s)
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {opponentName}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {opponentScore}
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
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

                let bgColor = "bg-gray-100 dark:bg-gray-700";
                if (isCorrect)
                  bgColor =
                    "bg-green-100 dark:bg-green-900 border-2 border-green-500";
                else if (isMyAnswer || isTheirAnswer)
                  bgColor = "bg-red-100 dark:bg-red-900";

                return (
                  <div key={index} className={`p-4 rounded-lg ${bgColor}`}>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {option}
                    </p>
                    {(isMyAnswer || isTheirAnswer) && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {isMyAnswer && isTheirAnswer
                          ? "Both selected"
                          : isMyAnswer
                            ? "You selected"
                            : `${opponentName} selected`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              {isReady ? (
                <p className="text-gray-600 dark:text-gray-400">
                  Waiting for opponent...
                </p>
              ) : (
                <button
                  onClick={handleReady}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-lg"
                >
                  Ready
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "question" && question) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">You</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {myScore}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Question {question.questionIndex + 1}/10
                </p>
                <p className="text-3xl font-bold text-indigo-600">
                  {timeLeft}s
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {opponentName}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {opponentScore}
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              {question.questionText}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full p-4 rounded-lg text-left font-medium transition-colors ${
                    selectedAnswer === index
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {selectedAnswer !== null && (
              <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
                Answer submitted. You can change your answer until time runs
                out.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-xl text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}

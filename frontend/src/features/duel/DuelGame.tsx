import { useSearchParams } from "react-router-dom";
import { useDuelGame } from "./useDuelGame";

export default function DuelGame() {
  const [searchParams] = useSearchParams();
  const duelId = searchParams.get("id");
  const opponentName = searchParams.get("opponent");
  const playerNumber = parseInt(searchParams.get("player") ?? "1");
  const isPlayer1 = playerNumber === 1;

  // Redirect handled inside the hook if duelId is missing
  const duel = useDuelGame({ duelId: duelId ?? "", isPlayer1 });
  const { state, showLeaveConfirm, confirmLeave, cancelLeave } = duel;

  // ─── Overlays (shared across active phases) ──────────────────────────────────
  const leaveConfirmOverlay = showLeaveConfirm && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 max-w-sm w-full text-center bg-(--bg-elevated) mx-4">
        <h2 className="text-xl font-semibold text-(--text-h) mb-3">
          Lämna duellen?
        </h2>
        <p className="text-(--text) text-sm mb-6">
          Om du lämnar räknas det som en förlust. Är du säker?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={confirmLeave}
            className="px-5 py-2 text-sm rounded-lg bg-red-500 hover:opacity-90 text-white font-medium transition-opacity cursor-pointer border-none"
          >
            Lämna
          </button>
          <button
            onClick={cancelLeave}
            className="px-5 py-2 text-sm rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
          >
            Stanna kvar
          </button>
        </div>
      </div>
    </div>
  );

  const reconnectingOverlay = state.reconnecting && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 max-w-sm w-full text-center bg-(--bg-elevated) mx-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-(--accent) mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-(--text-h) mb-2">
          Återansluter...
        </h2>
        <p className="text-sm text-(--text)">
          Försöker återansluta till duellen.
        </p>
      </div>
    </div>
  );

  const opponentDisconnectedBanner = state.opponentDisconnected && (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-xl border border-(--border) bg-(--bg-elevated) shadow-(--shadow) text-center">
      <p className="text-sm font-medium text-(--text-h)">
        Motståndaren kopplade från
      </p>
      <p className="text-xs text-(--text) mt-0.5">
        Spelet avslutas om {state.opponentDisconnectSecondsLeft}s
      </p>
    </div>
  );

  // ─── Forfeited ───────────────────────────────────────────────────────────────
  if (state.phase === "forfeited") {
    return (
      <main className="flex-1 flex items-center justify-center animate-in">
        <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 max-w-md w-full text-center bg-(--bg-elevated)">
          <h1 className="text-2xl font-semibold text-(--text-h) mb-4">
            Motståndaren kopplade från
          </h1>
          <p className="text-(--text) mb-6">Du vinner genom walkover!</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => duel.leave("/duel")}
              className="px-5 py-2 text-sm rounded-lg bg-(--accent) hover:opacity-90 text-white font-medium transition-opacity cursor-pointer border-none"
            >
              Spela igen
            </button>
            <button
              onClick={() => duel.leave("/")}
              className="px-5 py-2 text-sm rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
            >
              Tillbaka till menyn
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Completed ───────────────────────────────────────────────────────────────
  if (state.phase === "completed" && state.result) {
    const { result } = state;
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
              onClick={() => duel.leave("/duel")}
              className="px-5 py-2 text-sm rounded-lg bg-(--accent) hover:opacity-90 text-white font-medium transition-opacity cursor-pointer border-none"
            >
              Spela igen
            </button>
            <button
              onClick={() => duel.leave("/")}
              className="px-5 py-2 text-sm rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
            >
              Tillbaka till menyn
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Review ──────────────────────────────────────────────────────────────────
  if (state.phase === "review" && state.review && state.question) {
    const { review, question } = state;

    return (
      <>
        {leaveConfirmOverlay}
        {reconnectingOverlay}
        {opponentDisconnectedBanner}
        <main className="flex-1 p-4 animate-in">
          <div className="max-w-4xl mx-auto">
            <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 bg-(--bg-elevated)">
              <div className="flex justify-between items-center mb-6">
                <div className="text-center">
                  <p className="text-xs tracking-wide text-(--text)">Du</p>
                  <p className="text-2xl font-medium text-(--text-h)">
                    {state.myScore}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-(--text-h)">
                    Fråga {question.questionIndex + 1}/10
                  </p>
                  <p className="text-xs text-(--text)">
                    Granskning ({state.timeLeft}s)
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs tracking-wide text-(--text)">
                    {opponentName}
                  </p>
                  <p className="text-2xl font-medium text-(--text-h)">
                    {state.opponentScore}
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
                {state.isReady ? (
                  <p className="text-(--text) text-sm">
                    Väntar på motståndare...
                  </p>
                ) : (
                  <button
                    onClick={duel.ready}
                    className="px-6 py-2.5 text-sm rounded-lg bg-(--accent) hover:opacity-90 text-white font-medium transition-opacity cursor-pointer border-none"
                  >
                    Klar
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ─── Question ────────────────────────────────────────────────────────────────
  if (state.phase === "question" && state.question) {
    const { question } = state;

    return (
      <>
        {leaveConfirmOverlay}
        {reconnectingOverlay}
        {opponentDisconnectedBanner}
        <main className="flex-1 p-4 animate-in">
          <div className="max-w-4xl mx-auto">
            <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 bg-(--bg-elevated)">
              <div className="flex justify-between items-center mb-6">
                <div className="text-center">
                  <p className="text-xs tracking-wide text-(--text)">Du</p>
                  <p className="text-2xl font-medium text-(--text-h)">
                    {state.myScore}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-(--text-h)">
                    Fråga {question.questionIndex + 1}/10
                  </p>
                  <p className="text-3xl font-semibold text-(--accent)">
                    {state.timeLeft}s
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs tracking-wide text-(--text)">
                    {opponentName}
                  </p>
                  <p className="text-2xl font-medium text-(--text-h)">
                    {state.opponentScore}
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
                    onClick={() => duel.answer(index)}
                    className={`w-full p-4 rounded-xl text-left font-medium text-sm transition-colors border cursor-pointer ${
                      state.selectedAnswer === index
                        ? "bg-(--accent) text-white border-(--accent)"
                        : "border-(--border) bg-(--bg) text-(--text-h) hover:border-(--accent-border) hover:bg-(--accent-bg)"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {state.selectedAnswer !== null && (
                <p className="text-center text-(--text) text-sm mt-4">
                  Svar valt. Du kan fortfarande ändra det.
                </p>
              )}
            </div>
          </div>
        </main>
      </>
    );
  }

  // ─── Loading / pregame ───────────────────────────────────────────────────────
  return (
    <>
      {leaveConfirmOverlay}
      {reconnectingOverlay}
      <main className="flex-1 flex items-center justify-center animate-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-(--accent) mx-auto mb-4"></div>
          <p className="text-(--text)">Laddar...</p>
        </div>
      </main>
    </>
  );
}

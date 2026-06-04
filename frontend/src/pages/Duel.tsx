import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDuel } from "../context/DuelContext";

export default function Duel() {
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { connection, connect } = useDuel();
  const { user, loading: authLoading, login } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    let matchFoundHandler:
      | ((data: {
          duelId: string;
          opponentName: string;
          playerNumber: number;
        }) => void)
      | undefined;

    const setupMatchmaking = async () => {
      try {
        await connect();

        if (!connection) return;

        matchFoundHandler = (data) => {
          console.log("MatchFound data:", data);
          navigate(
            `/duel/game?id=${data.duelId}&opponent=${encodeURIComponent(
              data.opponentName
            )}&player=${data.playerNumber}`
          );
        };

        connection.on("MatchFound", matchFoundHandler);

        connection.onclose(() => {
          setSearching(false);
          setError("Connection lost. Please try again.");
        });

        await connection.invoke("JoinMatchmaking");
        setSearching(true);
      } catch (err) {
        console.error("Failed to connect to hub:", err);
        setError(
          "Failed to connect to matchmaking. Please check your connection and try again."
        );
      }
    };

    setupMatchmaking();

    return () => {
      if (connection && matchFoundHandler) {
        connection.off("MatchFound", matchFoundHandler);
      }
      connection?.invoke("LeaveMatchmaking").catch(console.error);
    };
  }, [connection, connect, authLoading, user]);

  const handleCancel = async () => {
    try {
      await connection?.invoke("LeaveMatchmaking");
    } catch (err) {
      console.error("Failed to leave matchmaking:", err);
    }
    navigate("/");
  };

  if (authLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-(--text)">Laddar...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 flex items-center justify-center animate-in">
        <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 max-w-md w-full text-center bg-(--bg-elevated)">
          <h1 className="text-2xl font-semibold text-(--text-h) mb-4">
            PvP Duell
          </h1>
          <p className="text-(--text) mb-6">Logga in för att spela dueller.</p>
          <button
            onClick={() => login()}
            className="px-5 py-2 text-sm rounded-lg bg-(--accent) hover:opacity-90 text-white font-medium transition-opacity cursor-pointer border-none"
          >
            Logga in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center animate-in">
      <div className="border border-(--border) rounded-2xl shadow-(--shadow) p-8 max-w-md w-full text-center bg-(--bg-elevated)">
        <h1 className="text-2xl font-semibold text-(--text-h) mb-6">
          PvP Duell
        </h1>

        {error ? (
          <>
            <p className="text-sm text-red-500 dark:text-red-400 mb-6">
              {error}
            </p>

            <button
              onClick={() => navigate("/")}
              className="px-5 py-2 text-sm rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
            >
              Tillbaka till menyn
            </button>
          </>
        ) : searching ? (
          <>
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-(--accent) mx-auto"></div>
            </div>

            <p className="text-(--text) mb-8">Söker motståndare...</p>

            <button
              onClick={handleCancel}
              className="px-5 py-2 text-sm rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
            >
              Avbryt
            </button>
          </>
        ) : (
          <p className="text-(--text) mb-8">Ansluter...</p>
        )}
      </div>
    </main>
  );
}

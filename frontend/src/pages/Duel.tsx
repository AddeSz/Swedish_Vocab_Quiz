import type { HubConnection } from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDuel } from "../context/DuelContext";

export default function Duel() {
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { connect, disconnect } = useDuel();
  const { user, loading: authLoading, login } = useAuth();
  const hubRef = useRef<HubConnection | null>(null);
  const matchedRef = useRef(false);

  useEffect(() => {
    if (authLoading || !user) return;

    let matchFoundHandler:
      | ((data: {
          duelId: string;
          opponentName: string;
          playerNumber: number;
        }) => void)
      | undefined;

    const setupMatchmaking = async () => {
      try {
        const hub = await connect();
        hubRef.current = hub;

        matchFoundHandler = (data) => {
          matchedRef.current = true;
          navigate(
            `/duel/game?id=${data.duelId}&opponent=${encodeURIComponent(
              data.opponentName
            )}&player=${data.playerNumber}`
          );
        };

        hub.on("MatchFound", matchFoundHandler);
        hub.onclose(() => {
          if (!matchedRef.current) {
            setSearching(false);
            setError("Connection lost. Please try again.");
          }
        });

        await hub.invoke("JoinMatchmaking");
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
      if (matchFoundHandler)
        hubRef.current?.off("MatchFound", matchFoundHandler);
      const cleanup = async () => {
        await hubRef.current?.invoke("LeaveMatchmaking").catch(console.error);
        if (!matchedRef.current) await disconnect();
      };
      cleanup();
    };
  }, [authLoading, user]);

  const handleCancel = async () => {
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

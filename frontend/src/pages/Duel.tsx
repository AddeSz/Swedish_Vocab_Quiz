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

    const setupMatchmaking = async () => {
      try {
        await connect();

        if (!connection) return;

        connection.on(
          "MatchFound",
          async (data: {
            duelId: string;
            opponentName: string;
            playerNumber: number;
          }) => {
            console.log("MatchFound data:", data);
            navigate(
              `/duel/game?id=${data.duelId}&opponent=${encodeURIComponent(
                data.opponentName
              )}&player=${data.playerNumber}`
            );
          }
        );

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
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <p className="text-lg text-gray-700 dark:text-gray-300">Laddar...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            PvP Duell
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Logga in för att spela dueller.
          </p>
          <button
            onClick={() => login()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Logga in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          PvP Duell
        </h1>

        {error ? (
          <>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>

            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Tillbaka till menyn
            </button>
          </>
        ) : searching ? (
          <>
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            </div>

            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              Söker motståndare...
            </p>

            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Avbryt
            </button>
          </>
        ) : (
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            Ansluter...
          </p>
        )}
      </div>
    </div>
  );
}

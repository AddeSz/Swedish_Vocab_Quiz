import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDuel } from "../context/DuelContext";

export default function Duel() {
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { connection, connect } = useDuel();

  useEffect(() => {
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
            try {
              console.log("Invoking JoinDuelGroup with:", data.duelId);
              await connection.invoke("JoinDuelGroup", data.duelId);

              navigate(
                `/duel/game?id=${data.duelId}&opponent=${encodeURIComponent(
                  data.opponentName
                )}&player=${data.playerNumber}`
              );
            } catch (err) {
              console.error("Failed to join duel group:", err);
              setError("Failed to join match. Please try again.");
            }
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
  }, [connection, connect]);

  const handleCancel = async () => {
    try {
      await connection?.invoke("LeaveMatchmaking");
    } catch (err) {
      console.error("Failed to leave matchmaking:", err);
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          PvP Duel
        </h1>

        {error ? (
          <>
            <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>

            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Back to Menu
            </button>
          </>
        ) : searching ? (
          <>
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            </div>

            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              Searching for opponent...
            </p>

            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            Connecting...
          </p>
        )}
      </div>
    </div>
  );
}

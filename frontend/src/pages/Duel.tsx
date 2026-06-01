import { useAuth0 } from "@auth0/auth0-react";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Duel() {
  const connectionRef = useRef<HubConnection | null>(null);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const connectHub = async () => {
      try {
        const token = await getAccessTokenSilently();
        const hubConnection = new HubConnectionBuilder()
          .withUrl(`${import.meta.env.VITE_API_URL}/duelHub`, {
            accessTokenFactory: () => token
          })
          .withAutomaticReconnect()
          .build();

        hubConnection.on(
          "MatchFound",
          async (data: {
            DuelId: string;
            OpponentName: string;
            PlayerNumber: number;
          }) => {
            try {
              await hubConnection.invoke("JoinDuelGroup", data.DuelId);
              navigate(
                `/duel/game?id=${data.DuelId}&opponent=${encodeURIComponent(data.OpponentName)}&player=${data.PlayerNumber}`
              );
            } catch (err) {
              console.error("Failed to join duel group:", err);
              setError("Failed to join match. Please try again.");
            }
          }
        );

        hubConnection.onclose(() => {
          if (searching) {
            setError("Connection lost. Please try again.");
            setSearching(false);
          }
        });

        await hubConnection.start();
        connectionRef.current = hubConnection;
        setConnection(hubConnection);
        await hubConnection.invoke("JoinMatchmaking");
        setSearching(true);
      } catch (error) {
        console.error("Failed to connect to hub:", error);
        setError(
          "Failed to connect to matchmaking. Please check your connection and try again."
        );
      }
    };

    connectHub();

    return () => {
      connectionRef.current?.invoke("LeaveMatchmaking").catch(console.error);
      connectionRef.current?.stop();
    };
  }, []);

  const handleCancel = async () => {
    if (connectionRef.current) {
      await connectionRef.current.invoke("LeaveMatchmaking");
      await connectionRef.current.stop();
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

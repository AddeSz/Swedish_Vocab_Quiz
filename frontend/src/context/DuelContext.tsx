import { useAuth0 } from "@auth0/auth0-react";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { createContext, useCallback, useContext, useRef } from "react";

interface DuelContextType {
  connect: () => Promise<HubConnection>;
  disconnect: () => Promise<void>;
}

const DuelContext = createContext<DuelContextType | null>(null);

export const DuelProvider = ({ children }: { children: React.ReactNode }) => {
  const { getAccessTokenSilently } = useAuth0();
  const connectionRef = useRef<HubConnection | null>(null);

  const connect = useCallback(async (): Promise<HubConnection> => {
    if (connectionRef.current?.state === "Connected") {
      console.log("Reusing existing connection");
      return connectionRef.current;
    }
    console.log("Creating new connection");

    const hub = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/duelHub`, {
        accessTokenFactory: () => getAccessTokenSilently()
      })
      .withAutomaticReconnect([0, 2, 5])
      .build();

    await hub.start();
    connectionRef.current = hub;
    return hub;
  }, [getAccessTokenSilently]);

  const disconnect = useCallback(async () => {
    await connectionRef.current?.stop();
    connectionRef.current = null;
  }, []);

  return (
    <DuelContext.Provider value={{ connect, disconnect }}>
      {children}
    </DuelContext.Provider>
  );
};

export const useDuel = () => {
  const ctx = useContext(DuelContext);
  if (!ctx) throw new Error("useDuel must be used within DuelProvider");
  return ctx;
};

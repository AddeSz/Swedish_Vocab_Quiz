import { useAuth0 } from "@auth0/auth0-react";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { createContext, useContext, useState } from "react";

interface DuelContextType {
  connection: HubConnection | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const DuelContext = createContext<DuelContextType | null>(null);

export const DuelProvider = ({ children }: { children: React.ReactNode }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const { getAccessTokenSilently } = useAuth0();

  const connect = async () => {
    if (connection?.state === "Connected") return;
    const token = await getAccessTokenSilently();
    const hub = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/duelHub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect({ nextRetryDelayInMilliseconds: () => 2000 })
      .build();
    await hub.start();
    setConnection(hub);
  };

  const disconnect = async () => {
    await connection?.stop();
    setConnection(null);
  };

  return (
    <DuelContext.Provider value={{ connection, connect, disconnect }}>
      {children}
    </DuelContext.Provider>
  );
};

export const useDuel = () => {
  const ctx = useContext(DuelContext);
  if (!ctx) throw new Error("useDuel must be used within DuelProvider");
  return ctx;
};

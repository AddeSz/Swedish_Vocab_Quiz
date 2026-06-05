import { useAuth0 } from "@auth0/auth0-react";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState
} from "react";

interface DuelContextType {
  connection: HubConnection | null;
  connect: () => Promise<HubConnection | undefined>;
  disconnect: () => Promise<void>;
}

const DuelContext = createContext<DuelContextType | null>(null);

export const DuelProvider = ({ children }: { children: React.ReactNode }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const { getAccessTokenSilently } = useAuth0();

  const connectionRef = useRef<HubConnection | null>(null);

  const connect = useCallback(async () => {
    if (connectionRef.current?.state === "Connected")
      return connectionRef.current;
    const token = await getAccessTokenSilently();
    const hub = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/duelHub`, {
        accessTokenFactory: () => token
      })
      .build();
    await hub.start();
    connectionRef.current = hub;
    setConnection(hub);
    return hub;
  }, [getAccessTokenSilently]);

  const disconnect = useCallback(async () => {
    await connectionRef.current?.stop();
    connectionRef.current = null;
    setConnection(null);
  }, []);

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

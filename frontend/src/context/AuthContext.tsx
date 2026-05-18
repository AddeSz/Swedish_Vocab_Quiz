import { createContext, useContext, useEffect, useState } from "react";
import api from "../Api";

interface User {
  id: string;
  email: string;
  displayName: string;
  timedQuizBestStreak: number;
  timedQuizTotalRuns: number;
}

interface AuthResult {
  ok: boolean;
  error: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => void;
  register: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    const res = await api.post("/api/auth/login", { email, password });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      return { ok: true, error: "" };
    }
    const text = await res.text();
    return { ok: false, error: res.status === 403 ? "E-post ej verifierad." : text || "Felaktiga uppgifter." };
  };

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/login?returnUrl=${window.location.origin}`;
  };

  const register = async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    const res = await api.post("/api/auth/register", { email, password, displayName });
    if (res.ok) return { ok: true, error: "" };
    const text = await res.text();
    return { ok: false, error: res.status === 409 ? "E-postadressen är redan registrerad." : text || "Registrering misslyckades." };
  };

  const logout = () => {
    api.get("/api/auth/logout").then(() => setUser(null));
  };

  const refreshUser = async () => {
    const r = await api.get("/api/auth/me");
    if (r.ok) setUser(await r.json());
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, loginWithGoogle, register, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

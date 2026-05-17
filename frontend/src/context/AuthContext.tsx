import { createContext, useContext, useEffect, useState } from "react";
import api from "../Api";

interface User {
  id: string;
  email: string;
  displayName: string;
  timedQuizBestStreak: number;
  timedQuizTotalRuns: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
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

  const login = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/login?returnUrl=${window.location.origin}`;
  };

  const logout = () => {
    api.get("/api/auth/logout").then(() => setUser(null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

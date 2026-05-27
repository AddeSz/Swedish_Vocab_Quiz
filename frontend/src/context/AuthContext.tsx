import { useAuth0 } from "@auth0/auth0-react";
import { createContext, useContext, useEffect, useState } from "react";
import api, { setTokenGetter } from "../Api";

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
  login: (screenHint?: string) => void;
  logout: () => void;
  getToken: () => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently
  } = useAuth0();
  const [user, setUser] = useState<User | null>(null);
  const [profileResolved, setProfileResolved] = useState(false);

  const getToken = () => getAccessTokenSilently();

  useEffect(() => {
    setTokenGetter(getToken);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/auth/me");
      if (res.ok) setUser(await res.json());
    } catch {
    } finally {
      setProfileResolved(true);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      fetchUser();
    } else {
      setProfileResolved(true);
    }
  }, [isAuthenticated, isLoading]);

  const login = (screenHint?: string) =>
    loginWithRedirect({
      authorizationParams: { screen_hint: screenHint }
    });

  const logout = () => {
    setUser(null);
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isLoading || !profileResolved,
        login,
        logout,
        getToken,
        refreshUser: fetchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

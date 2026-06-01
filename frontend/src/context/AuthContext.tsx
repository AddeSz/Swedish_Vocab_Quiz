import { useAuth0 } from "@auth0/auth0-react";
import { createContext, useContext, useEffect, useState } from "react";
import api, { setTokenGetter } from "../apiClient";

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

const CACHE_KEY = "user_profile";

const getCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently
  } = useAuth0();

  const cached = getCachedUser();
  const [user, setUser] = useState<User | null>(cached);
  const [profileResolved, setProfileResolved] = useState(!!cached);

  const getToken = () => getAccessTokenSilently();

  useEffect(() => {
    setTokenGetter(getToken);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.auth.getMe();
      if (res.ok) {
        const profile: User = await res.json();
        setUser(profile);
        localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
      }
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
      setUser(null);
      localStorage.removeItem(CACHE_KEY);
      setProfileResolved(true);
    }
  }, [isAuthenticated, isLoading]);

  const login = (screenHint?: string) =>
    loginWithRedirect({
      authorizationParams: { screen_hint: screenHint }
    });

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CACHE_KEY);
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: !user && (isLoading || !profileResolved),
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

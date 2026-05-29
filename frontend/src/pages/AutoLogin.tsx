import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AutoLogin = () => {
  const { user, loading } = useAuth();
  const { loginWithRedirect } = useAuth0();
  const connection = new URLSearchParams(window.location.search).get(
    "connection"
  );

  useEffect(() => {
    if (!loading && !user) {
      loginWithRedirect({
        authorizationParams: { connection: connection ?? undefined }
      });
    }
  }, [loading, user]);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return null;
};

export default AutoLogin;

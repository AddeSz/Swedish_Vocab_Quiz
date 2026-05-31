import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const location = useLocation();
  const screenHint = (location.state as { screen_hint?: string } | null)
    ?.screen_hint;

  useEffect(() => {
    login(screenHint);
  }, []);

  return null;
};

export default Login;

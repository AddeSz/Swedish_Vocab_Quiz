import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();

  useEffect(() => {
    login();
  }, []);

  return null;
};

export default Login;

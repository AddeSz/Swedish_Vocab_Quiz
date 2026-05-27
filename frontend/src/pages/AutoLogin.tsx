import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

const AutoLogin = () => {
  const { loginWithRedirect } = useAuth0();
  const connection = new URLSearchParams(window.location.search).get(
    "connection"
  );

  useEffect(() => {
    loginWithRedirect({
      authorizationParams: { connection: connection ?? undefined }
    });
  }, []);

  return null;
};

export default AutoLogin;

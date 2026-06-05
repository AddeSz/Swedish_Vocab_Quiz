import { Auth0Provider } from "@auth0/auth0-react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { App } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <Auth0Provider
    domain={import.meta.env.VITE_AUTH0_DOMAIN}
    clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: window.location.origin,
      audience: import.meta.env.VITE_AUTH0_AUDIENCE
    }}
  >
    <RouterProvider router={App} />
  </Auth0Provider>
);

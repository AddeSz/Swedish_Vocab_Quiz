import { createBrowserRouter, Outlet } from "react-router-dom";

import NavBar from "./components/NavBar";
import ThemeToggle from "./components/ThemeToggle";
import { AuthProvider } from "./context/AuthContext";

import { DuelProvider } from "./context/DuelContext";
import Duel from "./features/duel/Duel";
import DuelGame from "./features/duel/DuelGame";
import AutoLogin from "./pages/AutoLogin";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Progress from "./pages/Progress";
import Quiz from "./pages/Quiz";
import QuizPicker from "./pages/QuizPicker";
import Settings from "./pages/Settings";
import VerifyEmail from "./pages/VerifyEmail";

function RootLayout() {
  return (
    <AuthProvider>
      <NavBar />
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
      <ThemeToggle />
    </AuthProvider>
  );
}

export const App = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/quiz", element: <QuizPicker /> },
      { path: "/quiz/:mode", element: <Quiz /> },

      {
        element: (
          <DuelProvider>
            <Outlet />
          </DuelProvider>
        ),
        children: [
          { path: "/duel", element: <Duel /> },
          { path: "/duel/game", element: <DuelGame /> }
        ]
      },

      { path: "/progress", element: <Progress /> },
      { path: "/settings", element: <Settings /> },
      { path: "/login", element: <Login /> },
      { path: "/auto-login", element: <AutoLogin /> },
      { path: "/verify-email", element: <VerifyEmail /> }
    ]
  }
]);

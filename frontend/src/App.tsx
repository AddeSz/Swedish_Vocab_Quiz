import { BrowserRouter, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import ThemeToggle from "./components/ThemeToggle";
import { AuthProvider } from "./context/AuthContext";
import AutoLogin from "./pages/AutoLogin";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Progress from "./pages/Progress";
import Quiz from "./pages/Quiz";
import QuizPicker from "./pages/QuizPicker";
import Settings from "./pages/Settings";
import VerifyEmail from "./pages/VerifyEmail";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz" element={<QuizPicker />} />
          <Route path="/quiz/:mode" element={<Quiz />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auto-login" element={<AutoLogin />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
        <ThemeToggle />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

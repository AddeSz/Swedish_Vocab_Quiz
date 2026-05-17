import { BrowserRouter, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Progress from "./pages/Progress";
import Quiz from "./pages/Quiz";
import QuizPicker from "./pages/QuizPicker";

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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

import { Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await loginWithEmail(email, password);
    if (result.ok) {
      navigate(from);
    } else {
      setError(result.error);
    }
  };

  return (
    <main className="flex justify-center px-6 py-14 animate-in">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <h1>Logga in</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-(--border) bg-(--bg-elevated) focus-within:border-(--accent-border) transition-colors">
            <Mail size={16} className="text-(--text) shrink-0" />
            <input
              type="email"
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-(--text-h) placeholder:text-(--text)"
              required
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-(--border) bg-(--bg-elevated) focus-within:border-(--accent-border) transition-colors">
            <Lock size={16} className="text-(--text) shrink-0" />
            <input
              type="password"
              placeholder="Lösenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-(--text-h) placeholder:text-(--text)"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-medium cursor-pointer border-none"
          >
            <LogIn size={16} /> Logga in
          </button>
        </form>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-(--border)" />
          <span className="text-xs text-(--text)">eller</span>
          <hr className="flex-1 border-(--border)" />
        </div>

        <button
          onClick={() => loginWithGoogle(from)}
          className="px-4 py-2.5 rounded-xl border border-(--border) text-(--text-h) text-sm font-medium hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
        >
          Logga in med Google
        </button>

        <p className="text-sm text-(--text)">
          Inget konto?{" "}
          <Link to="/register" className="text-(--accent) font-medium">
            Registrera dig
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Login;

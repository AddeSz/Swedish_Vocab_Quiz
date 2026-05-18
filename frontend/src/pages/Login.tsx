import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await loginWithEmail(email, password);
    if (result.ok) {
      navigate("/");
    } else {
      setError(result.error);
    }
  };

  return (
    <main className="flex justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-4xl font-medium tracking-tight text-(--text-h)">
          Logga in
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm"
            required
          />
          <input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm"
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-(--accent) text-white text-sm font-medium"
          >
            Logga in
          </button>
        </form>

        <div className="flex items-center gap-3">
          <hr className="flex-1 border-(--border)" />
          <span className="text-xs text-(--text)">eller</span>
          <hr className="flex-1 border-(--border)" />
        </div>

        <button
          onClick={loginWithGoogle}
          className="px-4 py-2 rounded-lg border border-(--border) text-(--text-h) text-sm font-medium hover:bg-(--accent-bg) transition-colors"
        >
          Logga in med Google
        </button>

        <p className="text-sm text-(--text)">
          Inget konto?{" "}
          <Link to="/register" className="text-(--accent)">
            Registrera dig
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Login;

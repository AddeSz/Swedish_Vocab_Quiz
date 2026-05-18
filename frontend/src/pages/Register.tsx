import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte.");
      return;
    }

    const result = await register(email, password, displayName);
    if (result.ok) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
  };

  if (success) {
    return (
      <main className="flex justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <h1 className="text-4xl font-medium tracking-tight text-(--text-h)">
            Konto skapat!
          </h1>
          <p className="text-sm text-(--text)">
            Kolla konsolen för verifieringslänk.
          </p>
          <Link to="/login" className="text-sm text-(--accent)">
            Gå till inloggning →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-4xl font-medium tracking-tight text-(--text-h)">
          Registrera
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
            type="text"
            placeholder="Visningsnamn"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="px-4 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm"
            required
          />
          <input
            type="password"
            placeholder="Lösenord (minst 8 tecken)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm"
            required
          />
          <input
            type="password"
            placeholder="Bekräfta lösenord"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="px-4 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm"
            required
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-(--accent) text-white text-sm font-medium"
          >
            Registrera
          </button>
        </form>

        <p className="text-sm text-(--text)">
          Har redan ett konto?{" "}
          <Link to="/login" className="text-(--accent)">
            Logga in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Register;

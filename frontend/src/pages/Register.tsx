import { ArrowRight, Lock, Mail, User, UserPlus } from "lucide-react";
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
      <main className="flex justify-center px-6 py-14 animate-in">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <h1>Konto skapat!</h1>
          <p className="text-sm text-(--text)">
            Kolla konsolen för verifieringslänk.
          </p>
          <Link
            to="/login"
            className="flex items-center gap-1 text-sm text-(--accent) font-medium"
          >
            Gå till inloggning <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex justify-center px-6 py-14 animate-in">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <h1>Registrera</h1>

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
            <User size={16} className="text-(--text) shrink-0" />
            <input
              type="text"
              placeholder="Visningsnamn"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-(--text-h) placeholder:text-(--text)"
              required
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-(--border) bg-(--bg-elevated) focus-within:border-(--accent-border) transition-colors">
            <Lock size={16} className="text-(--text) shrink-0" />
            <input
              type="password"
              placeholder="Lösenord (minst 8 tecken)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-(--text-h) placeholder:text-(--text)"
              required
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-(--border) bg-(--bg-elevated) focus-within:border-(--accent-border) transition-colors">
            <Lock size={16} className="text-(--text) shrink-0" />
            <input
              type="password"
              placeholder="Bekräfta lösenord"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-(--text-h) placeholder:text-(--text)"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-medium cursor-pointer border-none"
          >
            <UserPlus size={16} /> Registrera
          </button>
        </form>

        <p className="text-sm text-(--text)">
          Har redan ett konto?{" "}
          <Link to="/login" className="text-(--accent) font-medium">
            Logga in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Register;

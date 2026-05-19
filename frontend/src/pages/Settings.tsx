import { CheckCircle2, Mail, Save, User } from "lucide-react";
import { useState } from "react";
import api from "../Api";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { user, loading, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (loading)
    return (
      <main className="px-6 py-14">
        <p className="text-(--text)">Laddar...</p>
      </main>
    );
  if (!user)
    return (
      <main className="px-6 py-14">
        <p className="text-(--text)">Logga in för att se inställningar.</p>
      </main>
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError("");

    const res = await api.patch("/api/auth/settings", { displayName });
    if (res.ok) {
      await refreshUser();
      setSaved(true);
    } else {
      setError("Kunde inte spara.");
    }
  };

  return (
    <main className="flex justify-center px-6 py-14 animate-in">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <h1>Inställningar</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-(--text)">
              Visningsnamn
            </span>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-(--border) bg-(--bg-elevated) focus-within:border-(--accent-border) transition-colors">
              <User size={16} className="text-(--text) shrink-0" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-(--text-h)"
                required
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-(--text)">E-post</span>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-(--border) bg-(--bg-elevated) opacity-50">
              <Mail size={16} className="text-(--text) shrink-0" />
              <input
                type="email"
                value={user.email}
                disabled
                className="flex-1 bg-transparent border-none outline-none text-sm text-(--text)"
              />
            </div>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && (
            <p className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 size={14} /> Sparat!
            </p>
          )}

          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-(--accent) text-white text-sm font-medium cursor-pointer border-none"
          >
            <Save size={16} /> Spara
          </button>
        </form>
      </div>
    </main>
  );
};

export default Settings;

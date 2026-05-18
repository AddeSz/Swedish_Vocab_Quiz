import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../Api";

const Settings = () => {
  const { user, loading, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <main className="px-6 py-12"><p className="text-(--text)">Laddar...</p></main>;
  if (!user) return <main className="px-6 py-12"><p className="text-(--text)">Logga in för att se inställningar.</p></main>;

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
    <main className="flex justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <h1 className="text-4xl font-medium tracking-tight text-(--text-h)">
          Inställningar
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-(--text)">Visningsnamn</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="px-4 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-(--text)">E-post</span>
            <input
              type="email"
              value={user.email}
              disabled
              className="px-4 py-2 rounded-lg border border-(--border) bg-(--bg) text-(--text) text-sm opacity-50"
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {saved && <p className="text-sm text-green-600">Sparat!</p>}

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-(--accent) text-white text-sm font-medium"
          >
            Spara
          </button>
        </form>
      </div>
    </main>
  );
};

export default Settings;

import {
  CalendarClock,
  CheckCircle2,
  Eye,
  LogIn,
  Swords,
  Target,
  Trophy,
  UserPlus,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../apiClient";
import { useAuth } from "../context/AuthContext";

interface ProgressData {
  totalWordsSeen: number;
  totalCorrect: number;
  totalIncorrect: number;
  wordsDueForReview: number;
}

interface DuelStats {
  wins: number;
  ties: number;
  losses: number;
  winRate: number;
}

const Progress = () => {
  const { user, loading: authLoading, login } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [duelStats, setDuelStats] = useState<DuelStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      api.progress.get().then((r) => r.json()),
      api.duel.getStats().then((r) => r.json())
    ]).then(([progressData, duelData]) => {
      setData(progressData);
      setDuelStats(duelData);
      setLoading(false);
    });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="py-14">
        <p className="text-(--text)">Laddar...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="py-14 flex flex-col gap-4 animate-in">
        <h1 className="mb-2">Dina framsteg</h1>
        <p className="text-(--text) text-sm">
          Logga in för att se dina framsteg.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => login()}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors bg-transparent border-none cursor-pointer"
          >
            <LogIn size={14} /> Logga in
          </button>
          <button
            onClick={() => login("signup")}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors bg-transparent cursor-pointer"
          >
            <UserPlus size={14} /> Registrera
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="py-14">
        <p className="text-(--text)">Något gick fel.</p>
      </main>
    );
  }

  const accuracy =
    data.totalCorrect + data.totalIncorrect === 0
      ? 0
      : Math.round(
          (data.totalCorrect / (data.totalCorrect + data.totalIncorrect)) * 100
        );

  const stats = [
    { value: data.totalWordsSeen, label: "Ord sedda", icon: Eye },
    { value: data.totalCorrect, label: "Rätta svar", icon: CheckCircle2 },
    { value: data.totalIncorrect, label: "Felaktiga svar", icon: XCircle },
    { value: `${accuracy}%`, label: "Träffsäkerhet", icon: Target }
  ];

  return (
    <main className="py-14 animate-in">
      <h1 className="mb-2!">Dina framsteg</h1>

      <div className="grid grid-cols-2 gap-3 max-w-3xl mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex flex-col gap-3 p-6 border border-(--border) rounded-2xl bg-(--bg-elevated)"
            >
              <Icon size={18} className="text-(--accent)" />
              <span className="text-3xl font-medium tracking-tight text-(--text-h)">
                {s.value}
              </span>
              <span className="text-xs tracking-wide text-(--text)">
                {s.label}
              </span>
            </div>
          );
        })}

        <div className="col-span-2 flex flex-col gap-3 p-6 border border-(--border) rounded-2xl bg-(--bg-elevated)">
          <CalendarClock size={18} className="text-(--accent)" />
          <span className="text-3xl font-medium tracking-tight text-(--text-h)">
            {data.wordsDueForReview}
          </span>
          <span className="text-xs tracking-wide text-(--text)">
            Ord att repetera idag
          </span>
        </div>
      </div>

      {duelStats && duelStats.wins + duelStats.ties + duelStats.losses > 0 && (
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold mb-4 text-(--text-h) flex items-center gap-2">
            <Swords size={20} className="text-(--accent)" />
            PvP Duel Statistik
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-3 p-6 border border-(--border) rounded-2xl bg-(--bg-elevated)">
              <Trophy size={18} className="text-(--accent)" />
              <span className="text-3xl font-medium tracking-tight text-(--text-h)">
                {duelStats.wins}
              </span>
              <span className="text-xs tracking-wide text-(--text)">
                Vinster
              </span>
            </div>
            <div className="flex flex-col gap-3 p-6 border border-(--border) rounded-2xl bg-(--bg-elevated)">
              <Target size={18} className="text-(--accent)" />
              <span className="text-3xl font-medium tracking-tight text-(--text-h)">
                {duelStats.winRate}%
              </span>
              <span className="text-xs tracking-wide text-(--text)">
                Vinstprocent
              </span>
            </div>
            <div className="flex flex-col gap-3 p-6 border border-(--border) rounded-2xl bg-(--bg-elevated)">
              <CheckCircle2 size={18} className="text-(--accent)" />
              <span className="text-3xl font-medium tracking-tight text-(--text-h)">
                {duelStats.ties}
              </span>
              <span className="text-xs tracking-wide text-(--text)">
                Oavgjorda
              </span>
            </div>
            <div className="flex flex-col gap-3 p-6 border border-(--border) rounded-2xl bg-(--bg-elevated)">
              <XCircle size={18} className="text-(--accent)" />
              <span className="text-3xl font-medium tracking-tight text-(--text-h)">
                {duelStats.losses}
              </span>
              <span className="text-xs tracking-wide text-(--text)">
                Förluster
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Progress;

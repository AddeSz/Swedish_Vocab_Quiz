import {
  CalendarClock,
  CheckCircle2,
  Eye,
  LogIn,
  Target,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../Api";
import { useAuth } from "../context/AuthContext";

interface ProgressData {
  totalWordsSeen: number;
  totalCorrect: number;
  totalIncorrect: number;
  wordsDueForReview: number;
}

const Progress = () => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get("/api/progress")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="px-6 py-14">
        <p className="text-(--text)">Laddar...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-6 py-14 flex flex-col gap-4 animate-in">
        <h1>Dina framsteg</h1>
        <p className="text-(--text) text-sm">
          Logga in för att se dina framsteg.
        </p>
        <Link
          to="/login"
          state={{ from: "/progress" }}
          className="flex items-center gap-1.5 w-fit text-sm px-4 py-2 rounded-xl border border-(--border) text-(--text-h) hover:bg-(--accent-bg) transition-colors no-underline"
        >
          <LogIn size={14} /> Logga in
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="px-6 py-14">
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
    <main className="px-6 py-14 animate-in">
      <h1 className="mb-10">Dina framsteg</h1>

      <div className="grid grid-cols-2 gap-3 max-w-xl">
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
    </main>
  );
};

export default Progress;

import { useEffect, useState } from "react";
import api from "../Api";
import { useAuth } from "../context/AuthContext";

interface ProgressData {
  totalWordsSeen: number;
  totalCorrect: number;
  totalIncorrect: number;
  wordsDueForReview: number;
}

const Progress = () => {
  const { user, loading: authLoading, login } = useAuth();
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
      <main className="px-6 py-12">
        <p className="text-(--text)">Laddar...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-6 py-12 flex flex-col gap-4">
        <h1 className="text-4xl font-medium tracking-tight text-(--text-h)">
          Dina framsteg
        </h1>
        <p className="text-(--text) text-sm">
          Logga in för att se dina framsteg.
        </p>
        <button
          onClick={login}
          className="w-fit text-sm px-4 py-2 rounded-md border border-(--border) text-(--text-h) hover:bg-(--accent-bg) transition-colors"
        >
          Logga in med Google
        </button>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="px-6 py-12">
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
    { value: data.totalWordsSeen, label: "Ord sedda" },
    { value: data.totalCorrect, label: "Rätta svar" },
    { value: data.totalIncorrect, label: "Felaktiga svar" },
    { value: `${accuracy}%`, label: "Träffsäkerhet" }
  ];

  return (
    <main className="px-6 py-12">
      <h1 className="text-4xl font-medium tracking-tight text-(--text-h) mb-8">
        Dina framsteg
      </h1>

      <div className="grid grid-cols-2 gap-3 max-w-xl">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-1.5 p-6 border border-(--border) rounded-xl"
          >
            <span className="text-4xl font-medium tracking-tight text-(--text-h)">
              {s.value}
            </span>
            <span className="text-xs tracking-wide text-(--text)">
              {s.label}
            </span>
          </div>
        ))}

        <div className="col-span-2 flex flex-col gap-1.5 p-6 border border-(--border) rounded-xl">
          <span className="text-4xl font-medium tracking-tight text-(--text-h)">
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

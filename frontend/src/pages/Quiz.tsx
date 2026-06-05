import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../apiClient";

interface QuizQuestion {
  wordFormId: string;
  word: string;
  options: string[];
  correctIndex: number;
}

interface QuizResult {
  isCorrect: boolean;
  correctDefinition: string;
  correctWord: string;
  nextReviewDate: string;
  examples: string[];
}

type Phase = "loading" | "question" | "result" | "error";

const modeConfig = {
  "ord-definition": {
    title: "Ord → Definition",
    prompt: "Vad betyder",
    mode: "wordtodefinition" as const,
    correctAnswer: (r: QuizResult) => r.correctDefinition
  },
  "definition-ord": {
    title: "Definition → Ord",
    prompt: "Vilket ord betyder",
    mode: "definitiontoword" as const,
    correctAnswer: (r: QuizResult) => r.correctWord
  }
};

const Quiz = () => {
  console.log("Quiz");
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const config = modeConfig[mode as keyof typeof modeConfig];

  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const prefetchedRef = useRef<Promise<QuizQuestion> | null>(null);

  const fetchFromApi = async (): Promise<QuizQuestion> => {
    const res = await api.quiz.getQuestion(config.mode);
    if (!res.ok) throw new Error();
    return res.json();
  };

  const prefetchNext = () => {
    prefetchedRef.current = fetchFromApi();
  };

  const fetchQuestion = async () => {
    setPhase("loading");
    setSelected(null);
    setResult(null);
    try {
      const data = prefetchedRef.current
        ? await prefetchedRef.current
        : await fetchFromApi();
      prefetchedRef.current = null;
      setQuestion(data);
      setPhase("question");
    } catch {
      prefetchedRef.current = null;
      setPhase("error");
    }
  };

  useEffect(() => {
    if (!config) {
      navigate("/quiz");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setPhase("loading");
      setSelected(null);
      setResult(null);
      try {
        const data = prefetchedRef.current
          ? await prefetchedRef.current
          : await fetchFromApi();
        prefetchedRef.current = null;
        if (!cancelled) {
          setQuestion(data);
          setPhase("question");
        }
      } catch {
        prefetchedRef.current = null;
        if (!cancelled) {
          setPhase("error");
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [mode]);

  const handleAnswer = async (index: number) => {
    if (phase !== "question" || !question) return;
    setSelected(index);
    const isCorrect = index === question.correctIndex;
    try {
      const res = await api.quiz.submitAnswer(question.wordFormId, isCorrect);
      const data = await res.json();
      setResult(data);
      setPhase("result");
      prefetchNext();
    } catch {
      setPhase("error");
    }
  };

  const optionLabel = (i: number) => ["A", "B", "C", "D"][i];

  const getOptionClass = (i: number) => {
    const base =
      "flex items-start gap-3 p-4 border rounded-2xl text-left transition-all text-sm leading-relaxed cursor-pointer disabled:cursor-default";
    if (phase !== "result") {
      return `${base} border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)]`;
    }
    if (i === question!.correctIndex) {
      return `${base} border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400`;
    }
    if (i === selected) {
      return `${base} border-red-500 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400`;
    }
    return `${base} border-[var(--border)] text-[var(--text)] opacity-40`;
  };

  if (phase === "loading") {
    return (
      <main className="flex justify-center items-center py-20">
        <Loader2 size={24} className="animate-spin text-(--accent)" />
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="flex flex-col items-center gap-4 py-14 animate-in">
        <XCircle size={32} className="text-(--text)" />
        <p className="text-(--text)">Något gick fel.</p>
        <div className="flex gap-3">
          <button
            onClick={fetchQuestion}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-(--border) rounded-xl text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent"
          >
            <RefreshCw size={14} /> Försök igen
          </button>
          <Link
            to="/quiz"
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-(--border) rounded-xl text-(--text-h) hover:bg-(--accent-bg) transition-colors no-underline"
          >
            <ArrowLeft size={14} /> Byt övning
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex justify-center py-14 animate-in">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-widest uppercase text-(--text)">
            {config.title}
          </p>
          <Link
            to="/quiz"
            className="flex items-center gap-1 text-xs text-(--text) hover:text-(--text-h) transition-colors no-underline"
          >
            <ArrowLeft size={12} /> Byt övning
          </Link>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-widest uppercase text-(--text)">
            {config.prompt}
          </p>
          <h1>{question!.word}</h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {question!.options.map((option, i) => (
            <button
              key={i}
              className={getOptionClass(i)}
              onClick={() => handleAnswer(i)}
              disabled={phase === "result"}
            >
              <span className="text-xs font-bold tracking-wide text-(--accent) min-w-4 pt-0.5">
                {optionLabel(i)}
              </span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        {phase === "result" && result && (
          <div
            className={`flex items-center justify-between px-5 py-4 rounded-2xl text-sm font-medium ${
              result.isCorrect
                ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            <span className="flex items-center gap-2">
              {result.isCorrect ? (
                <CheckCircle2 size={16} />
              ) : (
                <XCircle size={16} />
              )}
              {result.isCorrect
                ? "Rätt!"
                : `Fel. Rätt svar: ${config.correctAnswer(result)}`}
            </span>
            <button
              onClick={fetchQuestion}
              className="flex items-center gap-1 font-medium cursor-pointer bg-transparent border-none text-inherit shrink-0 ml-4"
            >
              Nästa <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Quiz;

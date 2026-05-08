import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../Api";

interface QuizQuestion {
  wordId: string;
  word: string;
  options: string[];
  correctIndex: number;
}

interface QuizResult {
  isCorrect: boolean;
  correctDefinition: string;
  correctWord: string;
  nextReviewDate: string;
}

type Phase = "loading" | "question" | "result" | "error";

const modeConfig = {
  "ord-definition": {
    title: "Ord → Definition",
    prompt: "Vad betyder",
    endpoint: "/api/quiz",
    answerEndpoint: "/api/quiz/answer",
    correctAnswer: (r: QuizResult) => r.correctDefinition
  },
  "definition-ord": {
    title: "Definition → Ord",
    prompt: "Vilket ord betyder",
    endpoint: "/api/quiz/reverse",
    answerEndpoint: "/api/quiz/reverse/answer",
    correctAnswer: (r: QuizResult) => r.correctWord
  }
};

const Quiz = () => {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const config = modeConfig[mode as keyof typeof modeConfig];

  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  const fetchQuestion = async () => {
    setPhase("loading");
    setSelected(null);
    setResult(null);
    try {
      const res = await api.get(config.endpoint);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuestion(data);
      setPhase("question");
    } catch {
      setPhase("error");
    }
  };

  useEffect(() => {
    if (!config) {
      navigate("/quiz");
      return;
    }
    fetchQuestion();
  }, [mode]);

  const handleAnswer = async (index: number) => {
    if (phase !== "question" || !question) return;
    setSelected(index);
    const isCorrect = index === question.correctIndex;
    try {
      const res = await api.post(config.answerEndpoint, {
        wordId: question.wordId,
        isCorrect
      });
      const data = await res.json();
      setResult(data);
      setPhase("result");
    } catch {
      setPhase("error");
    }
  };

  const optionLabel = (i: number) => ["A", "B", "C", "D"][i];

  const getOptionClass = (i: number) => {
    const base =
      "flex items-start gap-3 p-4 border rounded-xl text-left transition-all text-sm leading-relaxed cursor-pointer disabled:cursor-default";
    if (phase !== "result") {
      return `${base} border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)]`;
    }
    if (i === question!.correctIndex) {
      return `${base} border-green-600 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400`;
    }
    if (i === selected) {
      return `${base} border-red-500 bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400`;
    }
    return `${base} border-[var(--border)] text-[var(--text)] opacity-50`;
  };

  if (phase === "loading") {
    return (
      <main className="flex justify-center px-6 py-12">
        <p className="text-(--text)">Laddar ord...</p>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="flex flex-col items-center gap-4 px-6 py-12">
        <p className="text-(--text)">Något gick fel.</p>
        <div className="flex gap-3">
          <button
            onClick={fetchQuestion}
            className="px-4 py-2 text-sm border border-(--border) rounded-lg text-(--text-h) hover:bg-(--accent-bg) transition-colors"
          >
            Försök igen
          </button>
          <Link
            to="/quiz"
            className="px-4 py-2 text-sm border border-(--border) rounded-lg text-(--text-h) hover:bg-(--accent-bg) transition-colors no-underline"
          >
            Byt övning
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex justify-center px-6 py-12">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-widest uppercase text-(--text)">
            {config.title}
          </p>
          <Link
            to="/quiz"
            className="text-xs text-(--text) hover:text-(--text-h) transition-colors no-underline"
          >
            ← Byt övning
          </Link>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium tracking-widest uppercase text-(--text)">
            {config.prompt}
          </p>
          <h1 className="text-5xl font-medium tracking-tight text-(--text-h) m-0">
            {question!.word}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
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
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
              result.isCorrect
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
            }`}
          >
            <span>
              {result.isCorrect
                ? "Rätt!"
                : `Fel. Rätt svar: ${config.correctAnswer(result)}`}
            </span>
            <button
              onClick={fetchQuestion}
              className="font-medium cursor-pointer bg-transparent border-none text-inherit shrink-0 ml-4"
            >
              Nästa ord →
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Quiz;

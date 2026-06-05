import { ArrowRight, BookText, Shuffle } from "lucide-react";
import { Link } from "react-router-dom";

const modes = [
  {
    path: "/quiz/ord-definition",
    title: "Ord → Definition",
    description:
      "Se ett svenskt ord och välj rätt definition bland fyra alternativ.",
    icon: BookText
  },
  {
    path: "/quiz/definition-ord",
    title: "Definition → Ord",
    description: "Se en definition och hitta vilket ord den beskriver.",
    icon: Shuffle
  }
];

const QuizPicker = () => {
  console.log("QuizPicker");
  return (
    <main className="flex flex-col gap-10 py-14 animate-in">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-widest uppercase text-(--accent)">
          Välj övning
        </p>
        <h1>Quiz</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.path}
              to={m.path}
              className="group flex flex-col gap-4 p-5 border border-(--border) rounded-2xl bg-(--bg-elevated) transition-all hover:border-(--accent-border) hover:shadow-(--shadow) no-underline cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-(--accent-bg) flex items-center justify-center text-(--accent)">
                <Icon size={18} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold text-(--text-h)">
                  {m.title}
                </h3>
                <p className="text-sm leading-relaxed text-(--text)">
                  {m.description}
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-(--accent) mt-auto group-hover:gap-2 transition-all">
                Starta <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
};

export default QuizPicker;

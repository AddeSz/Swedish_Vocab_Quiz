import { Link } from "react-router-dom";

const modes = [
  {
    path: "/quiz/ord-definition",
    title: "Ord → Definition",
    description:
      "Se ett svenskt ord och välj rätt definition bland fyra alternativ."
  },
  {
    path: "/quiz/definition-ord",
    title: "Definition → Ord",
    description: "Se en definition och hitta vilket ord den beskriver."
  }
];

const QuizPicker = () => {
  return (
    <main className="flex flex-col gap-10 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-widest uppercase text-(--accent)">
          Välj övning
        </p>
        <h1 className="text-4xl font-medium tracking-tight text-(--text-h) m-0">
          Quiz
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        {modes.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className="flex flex-col gap-3 p-5 border border-(--border) rounded-xl text-left transition-all hover:border-(--accent-border) hover:shadow-(--shadow) no-underline"
          >
            <h2 className="text-sm font-semibold text-(--text-h) m-0">
              {m.title}
            </h2>
            <p className="text-sm leading-relaxed text-(--text)">
              {m.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default QuizPicker;

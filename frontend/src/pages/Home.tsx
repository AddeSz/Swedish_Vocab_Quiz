import { ArrowRight, BookText, PenLine, Shuffle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const quizModes = [
  {
    id: "ord-definition",
    title: "Ord → Definition",
    description:
      "Se ett svenskt ord och välj rätt definition bland fyra alternativ.",
    icon: BookText,
    available: true,
    path: "/quiz/ord-definition"
  },
  {
    id: "definition-ord",
    title: "Definition → Ord",
    description: "Se en definition och hitta vilket ord den beskriver.",
    icon: Shuffle,
    available: true,
    path: "/quiz/definition-ord"
  },
  {
    id: "blank",
    title: "Fyll i luckan",
    description: "Komplettera meningen med rätt ord i rätt form.",
    icon: PenLine,
    available: false
  }
];

const Home = () => {
  return (
    <main className="flex flex-col gap-16 px-6 py-14 animate-in">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-(--accent)">
          <Sparkles size={14} />
          Svenska · B1–C2
        </div>
        <h1>Ordförråd</h1>
        <p className="text-base leading-relaxed text-(--text) max-w-lg">
          Fördjupa ditt svenska ordförråd med definitionsbaserade quiz anpassade
          för avancerade inlärare och flytande talare.
        </p>
      </section>

      <section>
        <h2 className="text-xs font-medium tracking-widest uppercase text-(--text) mb-5">
          Välj övning
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quizModes.map((mode) => {
            const Icon = mode.icon;
            const Wrapper = mode.available ? Link : "div";
            const wrapperProps = mode.available ? { to: mode.path! } : {};
            return (
              <Wrapper
                key={mode.id}
                {...(wrapperProps as any)}
                className={`group flex flex-col gap-4 p-5 border border-(--border) rounded-2xl transition-all bg-(--bg-elevated) no-underline ${
                  mode.available
                    ? "hover:border-(--accent-border) hover:shadow-(--shadow) cursor-pointer"
                    : "opacity-50"
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-(--accent-bg) flex items-center justify-center text-(--accent)">
                  <Icon size={18} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-semibold text-(--text-h)">
                    {mode.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-(--text)">
                    {mode.description}
                  </p>
                </div>
                {mode.available ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-(--accent) mt-auto group-hover:gap-2 transition-all">
                    Starta <ArrowRight size={14} />
                  </span>
                ) : (
                  <span className="text-xs tracking-wide text-(--text)">
                    Kommer snart
                  </span>
                )}
              </Wrapper>
            );
          })}
        </div>
      </section>

      <section className="pb-8">
        <h2 className="text-xs font-medium tracking-widest uppercase text-(--text) mb-4">
          Om appen
        </h2>
        <p className="text-sm leading-loose text-(--text) max-w-xl">
          Baserad på Kelly-listan, en frekvenslista med 8 425 svenska lemman —
          fokuserar den här appen på ord på nivå B1 till C2. Definitionerna är
          på svenska, utan översättningar, för att träna genuint ordförståelse.
        </p>
      </section>
    </main>
  );
};

export default Home;

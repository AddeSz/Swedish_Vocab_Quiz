import { Link } from "react-router-dom";

const quizModes = [
  {
    id: "definition",
    title: "Ord → Definition",
    description:
      "Se ett svenskt ord och välj rätt definition bland fyra alternativ.",
    available: true,
    path: "/quiz"
  },
  {
    id: "reverse",
    title: "Definition → Ord",
    description: "Se en definition och hitta vilket ord den beskriver.",
    available: false
  },
  {
    id: "blank",
    title: "Fyll i luckan",
    description: "Komplettera meningen med rätt ord i rätt form.",
    available: false
  }
];

const Home = () => {
  return (
    <main className="flex flex-col gap-16 px-6 py-12">
      <section className="flex flex-col gap-3">
        <p className="text-xs font-medium tracking-widest uppercase text-(--accent)">
          Svenska · B1–C2
        </p>
        <h1 className="text-5xl font-medium tracking-tight text-(--text-h) m-0">
          Ordförråd
        </h1>
        <p className="text-base leading-relaxed text-(--text) max-w-lg">
          Fördjupa ditt svenska ordförråd med definitionsbaserade quiz anpassade
          för avancerade inlärare och flytande talare.
        </p>
      </section>

      <section>
        <h2 className="text-xs font-medium tracking-widest uppercase text-(--text) mb-4">
          Välj övning
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quizModes.map((mode) => (
            <div
              key={mode.id}
              className={`flex flex-col gap-4 p-5 border border-(--border) rounded-xl transition-all ${
                mode.available
                  ? "hover:border-(--accent-border) hover:shadow-(--shadow)"
                  : "opacity-50"
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold text-(--text-h) m-0">
                  {mode.title}
                </h3>
                <p className="text-sm leading-relaxed text-(--text)">
                  {mode.description}
                </p>
              </div>
              {mode.available ? (
                <Link
                  to={mode.path!}
                  className="text-sm font-medium text-(--accent) no-underline mt-auto"
                >
                  Starta →
                </Link>
              ) : (
                <span className="text-xs tracking-wide text-(--text)">
                  Kommer snart
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
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

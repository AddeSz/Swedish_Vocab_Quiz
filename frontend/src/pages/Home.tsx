import { ArrowRight, BookText, Shuffle, Sparkles, Swords } from "lucide-react";
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
    id: "pvp-duel",
    title: "PvP Duel",
    description:
      "Utmana en annan spelare i realtid. 10 frågor, bäst av alla vinner!",
    icon: Swords,
    available: true,
    path: "/duel"
  }
];

const Home = () => {
  return (
    <main className="flex flex-col gap-16 py-14 animate-in">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-(--accent)">
          <Sparkles size={14} />
          Svenska
        </div>
        <h1>Ordivo</h1>
        <p className="text-base leading-relaxed text-(--text) max-w-2xl">
          Träna ditt ordförråd varje dag med quiz och utmaningar.
        </p>
      </section>

      <section>
        <h2 className="text-xs font-medium tracking-widest uppercase text-(--text) mb-5">
          Välj övning
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quizModes.map((mode) => {
            const Icon = mode.icon;
            const className = `group flex flex-col gap-4 p-5 border border-(--border) rounded-2xl transition-all bg-(--bg-elevated) no-underline ${
              mode.available
                ? "hover:border-(--accent-border) hover:shadow-(--shadow) cursor-pointer"
                : "opacity-50"
            }`;
            const content = (
              <>
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
              </>
            );
            return mode.available ? (
              <Link key={mode.id} to={mode.path!} className={className}>
                {content}
              </Link>
            ) : (
              <div key={mode.id} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-8">
        <h2 className="text-xs font-medium tracking-widest uppercase text-(--text) mb-4">
          Om appen
        </h2>
        <p className="text-sm leading-loose text-(--text) max-w-3xl">
          Ordivo är appen för dig som vill stärka ditt svenska ordförråd. Testa
          dina kunskaper med quiz, upptäck nya ord och utmana dig själv på olika
          nivåer. Oavsett om du studerar, förbereder dig inför prov eller bara
          vill bli bättre på svenska hjälper Ordivo dig att lära dig mer varje
          dag.
        </p>
      </section>
    </main>
  );
};

export default Home;

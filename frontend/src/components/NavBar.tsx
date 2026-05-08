import { Link, useLocation } from "react-router-dom";
import useTheme from "../hooks/useTheme";

const NavBar = () => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const links = [
    { to: "/", label: "Hem" },
    { to: "/quiz", label: "Quiz" },
    { to: "/progress", label: "Framsteg" }
  ];

  return (
    <header className="sticky top-0 z-10 flex items-center gap-6 px-6 py-4 border-b border-(--border) bg-(--bg)">
      <Link key={"home"} to={"/"}>
        <span className="text-sm font-semibold tracking-widest uppercase text-(--text-h)">
          Ordförråd
        </span>
      </Link>

      <nav className="flex gap-1 flex-1">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              location.pathname === l.to
                ? "text-(--accent) font-medium"
                : "text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg)"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <select
        value={theme}
        onChange={(e) =>
          setTheme(e.target.value as "light" | "dark" | "system")
        }
        className="text-xs px-2 py-1 rounded-md border border-(--border) bg-(--bg) text-(--text) cursor-pointer"
      >
        <option value="system">System</option>
        <option value="light">Ljust</option>
        <option value="dark">Mörkt</option>
      </select>
    </header>
  );
};

export default NavBar;

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useTheme from "../hooks/useTheme";

const NavBar = () => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { user, loading, logout } = useAuth();

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

      <div className="flex items-center gap-3">
        {!loading &&
          (user ? (
            <>
              <Link
                to="/settings"
                className="text-sm text-(--text) hover:text-(--text-h) transition-colors no-underline"
              >
                {user.displayName}
              </Link>
              <button
                onClick={logout}
                className="text-xs px-3 py-1.5 rounded-md border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors"
              >
                Logga ut
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-xs px-3 py-1.5 rounded-md border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors no-underline"
            >
              Logga in
            </Link>
          ))}

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
      </div>
    </header>
  );
};

export default NavBar;

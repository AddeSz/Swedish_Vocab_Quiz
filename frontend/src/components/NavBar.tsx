import {
  BarChart3,
  BookOpen,
  ChevronDown,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  UserPlus
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useTheme from "../hooks/useTheme";

const NavBar = () => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const { user, loading, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const links = [
    { to: "/", label: "Hem", icon: BookOpen },
    { to: "/quiz", label: "Quiz", icon: BookOpen },
    { to: "/progress", label: "Framsteg", icon: BarChart3 }
  ];

  const themeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const themeLabel =
    theme === "dark" ? "Mörkt" : theme === "light" ? "Ljust" : "System";
  const nextTheme =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  const initials =
    user?.displayName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "";

  return (
    <header className="sticky top-0 z-10 flex items-center gap-6 px-6 h-14 border-b border-(--border) bg-(--bg)/80 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2 no-underline">
        <span className="text-base font-semibold tracking-widest uppercase text-(--text-h)">
          Ordförråd
        </span>
      </Link>

      <nav className="flex gap-0.5 flex-1">
        {links.map((l) => {
          const Icon = l.icon;
          const active = location.pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm no-underline transition-all ${
                active
                  ? "text-(--accent) bg-(--accent-bg) font-medium"
                  : "text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg)"
              }`}
            >
              <Icon size={14} strokeWidth={active ? 2.5 : 2} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      {loading ? (
        <div className="w-24 h-4 rounded bg-(--border) animate-pulse" />
      ) : user ? (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent border-none"
          >
            <div className="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials}
            </div>
            <span className="text-sm font-medium text-(--text-h) max-w-30 truncate">
              {user.displayName}
            </span>
            <ChevronDown
              size={14}
              className={`text-(--text) transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-(--border) bg-(--bg-elevated) shadow-(--shadow) py-1.5 animate-in">
              <button
                onClick={() => {
                  setTheme(nextTheme);
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors cursor-pointer bg-transparent border-none text-left"
              >
                {(() => {
                  const Icon = themeIcon;
                  return <Icon size={15} />;
                })()}
                <span>Tema: {themeLabel}</span>
              </button>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors no-underline"
              >
                <Settings size={15} />
                <span>Inställningar</span>
              </Link>
              <div className="my-1.5 border-t border-(--border)" />
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-(--text) hover:text-red-500 hover:bg-red-500/8 transition-colors cursor-pointer bg-transparent border-none text-left"
              >
                <LogOut size={15} />
                <span>Logga ut</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => login()}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors bg-transparent border-none cursor-pointer"
            >
              <LogIn size={14} /> Logga in
            </button>
            <button
              onClick={() => login("signup")}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors bg-transparent cursor-pointer"
            >
              <UserPlus size={14} /> Registrera
            </button>
          </div>
        )
      )}
    </header>
  );
};

export default NavBar;

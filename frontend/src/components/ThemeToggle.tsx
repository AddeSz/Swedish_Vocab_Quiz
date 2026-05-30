import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import useTheme from "../hooks/useTheme";
// Needs normal css instead of tailwind otherwise the animations dont properly work
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 50,
        display: "inline-flex",
        alignItems: "center",
        width: 72,
        height: 32,
        borderRadius: 9999,
        border: "1px solid var(--border)",
        cursor: "pointer",
        background: hovered ? "var(--accent-bg)" : "var(--bg-elevated)",
        transition: "background 0.3s, border-color 0.3s",
        padding: 0
      }}
      aria-label={isDark ? "Byt till ljust tema" : "Byt till mörkt tema"}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--accent-border)",
          color: "white",
          boxShadow: "var(--shadow)",
          transform: isDark ? "translateX(40px)" : "translateX(0)",
          transition: "transform 0.3s ease, background 0.3s, color 0.3s"
        }}
      >
        {isDark ? <Moon size={13} /> : <Sun size={13} />}
      </span>
      <span
        style={{
          position: "absolute",
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          right: 10,
          color: "var(--text)",
          transform: isDark ? "translateX(-21px)" : "translateX(0)",
          opacity: 1,
          transition: "transform 0.3s ease, color 0.3s, opacity 0.15s"
        }}
      >
        {isDark ? "Natt" : "Dag"}
      </span>
    </button>
  );
};

export default ThemeToggle;

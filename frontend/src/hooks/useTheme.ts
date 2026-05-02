import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) ?? "system"
  );

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = (systemDark: boolean) => {
      const isDark = theme === "dark" || (theme === "system" && systemDark);
      root.classList.toggle("dark", isDark);
      root.classList.toggle("light", theme === "light");
    };

    apply(mq.matches);
    localStorage.setItem("theme", theme);

    if (theme === "system") {
      const listener = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [theme]);

  return { theme, setTheme };
};

export default useTheme;

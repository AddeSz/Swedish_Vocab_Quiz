import { Link } from "react-router-dom";
import useTheme from "../hooks/useTheme";

const NavBar = () => {
  const { theme, setTheme } = useTheme();

  return (
    <nav
      style={{
        display: "flex",
        gap: "16px",
        padding: "12px",
        alignItems: "center"
      }}
    >
      <Link to="/">Home</Link>
      <Link to="/quiz">Quiz</Link>
      <Link to="/progress">Progress</Link>

      <select
        value={theme}
        onChange={(e) =>
          setTheme(e.target.value as "light" | "dark" | "system")
        }
        style={{ marginLeft: "auto" }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </nav>
  );
};

export default NavBar;

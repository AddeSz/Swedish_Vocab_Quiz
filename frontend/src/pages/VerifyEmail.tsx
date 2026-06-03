import { ArrowRight, Mail } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const VerifyEmail = () => {
  const { user, loading, logout } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <main className="flex justify-center py-14 animate-in">
      <div className="w-full max-w-sm flex flex-col gap-4 items-center text-center">
        <Mail size={40} className="text-(--accent)" />
        <h1>Kolla din e-post</h1>
        <p className="text-sm text-(--text)">
          Vi har skickat en verifieringslänk till din e-post. Klicka på länken
          för att aktivera ditt konto.
        </p>
        <a
          href="/"
          className="flex items-center gap-1 text-sm text-(--accent) font-medium"
        >
          Fortsätt till sidan <ArrowRight size={14} />
        </a>
        <button
          onClick={() => logout()}
          className="text-sm px-4 py-2 rounded-lg border border-(--border) text-(--text) hover:text-(--text-h) hover:bg-(--accent-bg) transition-colors bg-transparent cursor-pointer"
        >
          Använd ett annat konto
        </button>
      </div>
    </main>
  );
};

export default VerifyEmail;

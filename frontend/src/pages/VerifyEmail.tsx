import { ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const VerifyEmail = () => {
  return (
    <main className="flex justify-center px-6 py-14 animate-in">
      <div className="w-full max-w-sm flex flex-col gap-4 items-center text-center">
        <Mail size={40} className="text-(--accent)" />
        <h1>Kolla din e-post</h1>
        <p className="text-sm text-(--text)">
          Vi har skickat en verifieringslänk till din e-post. Klicka på länken
          för att aktivera ditt konto.
        </p>
        <Link
          to="/login"
          className="flex items-center gap-1 text-sm text-(--accent) font-medium"
        >
          Gå till inloggning <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
};

export default VerifyEmail;

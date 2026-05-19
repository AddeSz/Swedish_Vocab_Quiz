import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../Api";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    api.get(`/api/auth/verify-email?token=${token}`).then((r) => {
      setStatus(r.ok ? "success" : "error");
    });
  }, [searchParams]);

  return (
    <main className="flex justify-center px-6 py-14 animate-in">
      <div className="w-full max-w-sm flex flex-col gap-4 items-center text-center">
        {status === "loading" && (
          <Loader2 size={32} className="animate-spin text-(--accent)" />
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={40} className="text-green-600" />
            <h1>Verifierad!</h1>
            <p className="text-sm text-(--text)">Din e-post har verifierats.</p>
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm text-(--accent) font-medium"
            >
              Gå till inloggning <ArrowRight size={14} />
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={40} className="text-red-500" />
            <h1>Misslyckades</h1>
            <p className="text-sm text-(--text)">
              Ogiltig eller redan använd token.
            </p>
          </>
        )}
      </div>
    </main>
  );
};

export default VerifyEmail;

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
    <main className="flex justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {status === "loading" && <p className="text-(--text)">Verifierar...</p>}
        {status === "success" && (
          <>
            <h1 className="text-4xl font-medium tracking-tight text-(--text-h)">
              Email verifierad!
            </h1>
            <Link to="/login" className="text-sm text-(--accent)">
              Gå till inloggning →
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-4xl font-medium tracking-tight text-(--text-h)">
              Verifiering misslyckades
            </h1>
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

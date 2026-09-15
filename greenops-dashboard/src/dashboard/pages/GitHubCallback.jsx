import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiLoader, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

export default function GitHubCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = params.get("code");
    if (!code) { setError("No authorization code"); return; }

    fetch("http://localhost:8000/api/auth/github/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          login(d.token, d.user);
          navigate("/");
        } else {
          setError(d.error || "GitHub login failed");
        }
      })
      .catch(e => setError("Network error"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgPrimary">
      <div className="text-center">
        {error ? (
          <>
            <FiAlertCircle className="text-redAccent text-5xl mx-auto mb-4" />
            <p className="text-white mb-4">{error}</p>
            <button onClick={() => navigate("/login")} className="text-blueAccent">Back to Login</button>
          </>
        ) : (
          <>
            <FiLoader className="text-greenAccent text-5xl mx-auto mb-4 animate-spin" />
            <p className="text-white">Signing you in with GitHub...</p>
          </>
        )}
      </div>
    </div>
  );
}

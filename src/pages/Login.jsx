import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage("❌ " + error.message);
        setLoading(false);
        return;
      }

      navigate("/admin-partners");
    } catch (err) {
      setMessage("❌ Erreur inattendue. Réessaie.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setMessage("⚠️ Entre ton email d'abord."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setMessage(error ? "❌ " + error.message : "📧 Lien envoyé à " + email);
  };

  return (
    <div className="min-h-screen bg-[#FAF4EC] flex flex-col items-center justify-center px-8 text-[#2C1A0E]">

      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-[#2C1A0E] rounded-[2rem] flex items-center justify-center text-[#C9963A] text-4xl mb-6 mx-auto shadow-xl">
          A
        </div>
        <h1 className="text-3xl font-serif mb-2">Espace Admin</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9963A] opacity-80">
          AfroTresse Management
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-5 bg-white rounded-2xl border border-black/5 outline-none text-sm shadow-sm"
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-5 bg-white rounded-2xl border border-black/5 outline-none text-sm shadow-sm"
          required
          autoComplete="current-password"
        />

        {message && (
          <p className={`text-[11px] font-bold text-center ${message.startsWith("📧") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 rounded-2xl font-black uppercase text-sm shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ background: loading ? "rgba(44,26,14,0.3)" : "#2C1A0E", color: "#FAF4EC" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Connexion en cours...
            </span>
          ) : "Se connecter"}
        </button>
      </form>

      <button
        onClick={handleForgotPassword}
        className="mt-10 text-[10px] font-black uppercase tracking-widest opacity-30 hover:opacity-60 transition-all"
      >
        Mot de passe oublié ?
      </button>

      <button
        onClick={() => navigate("/")}
        className="mt-4 text-[10px] font-black uppercase tracking-widest opacity-20 hover:opacity-40 transition-all"
      >
        Retour au site public
      </button>
    </div>
  );
}

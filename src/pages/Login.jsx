import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // 1. Connexion standard
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage("❌ " + error.message);
      setLoading(false);
    } else {
      // Succès : on redirige vers la liste des partenaires
      navigate("/partners");
    }
  };

  // 2. Gestion de l'oubli de mot de passe
  const handleForgotPassword = async () => {
    if (!email) {
      setMessage("⚠️ Entre ton email pour recevoir un lien.");
      return;
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) {
      setMessage("❌ " + error.message);
    } else {
      setMessage("📧 Lien de récupération envoyé à ton email.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4EC] flex flex-col items-center justify-center px-8 text-[#2C1A0E]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      {/* Logo / Titre */}
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-[#2C1A0E] rounded-[2rem] flex items-center justify-center text-[#C9963A] text-4xl font-serif mb-6 mx-auto shadow-xl">
          A
        </div>
        <h1 className="text-3xl font-serif mb-2">Espace Admin</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9963A] opacity-80">
          AfroTresse Management
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email professionnel"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-5 bg-white rounded-2xl border border-black/5 outline-none text-sm shadow-sm focus:border-[#C9963A]/30 transition-all"
            required
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-5 bg-white rounded-2xl border border-black/5 outline-none text-sm shadow-sm focus:border-[#C9963A]/30 transition-all"
            required
          />
        </div>

        {message && (
          <p className="text-[11px] font-bold text-center animate-pulse">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95 ${
            loading ? "bg-black/20 text-black/40" : "bg-[#2C1A0E] text-[#FAF4EC]"
          }`}
        >
          {loading ? "Vérification..." : "Se connecter"}
        </button>
      </form>

      {/* Options de secours */}
      <button
        onClick={handleForgotPassword}
        className="mt-10 text-[10px] font-black uppercase tracking-widest text-[#2C1A0E]/30 hover:text-[#C9963A] transition-colors"
      >
        Mot de passe oublié ?
      </button>

      {/* Retour au site */}
      <button
        onClick={() => navigate("/partners")}
        className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#2C1A0E]/20"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}

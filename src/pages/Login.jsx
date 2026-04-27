import { useState } from "react";
import { supabase } from "../services/supabase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

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
      // MODIFICATION : On redirige vers l'ADMIN et non le public
      navigate("/admin-partners");
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setMessage("⚠️ Entre ton email.");
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setMessage("📧 Lien envoyé.");
  };

  return (
    <div className="min-h-screen bg-[#FAF4EC] flex flex-col items-center justify-center px-8 text-[#2C1A0E]">
      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-[#2C1A0E] rounded-[2rem] flex items-center justify-center text-[#C9963A] text-4xl mb-6 mx-auto shadow-xl">A</div>
        <h1 className="text-3xl font-serif mb-2">Espace Admin</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9963A] opacity-80">AfroTresse Management</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full p-5 bg-white rounded-2xl border border-black/5 outline-none text-sm shadow-sm" required />
        <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full p-5 bg-white rounded-2xl border border-black/5 outline-none text-sm shadow-sm" required />
        
        {message && <p className="text-[11px] font-bold text-center text-red-500">{message}</p>}

        <button type="submit" disabled={loading} className={`w-full py-5 rounded-2xl font-black uppercase text-sm shadow-2xl transition-all ${loading ? "bg-black/20" : "bg-[#2C1A0E] text-[#FAF4EC]"}`}>
          {loading ? "Vérification..." : "Se connecter"}
        </button>
      </form>

      <button onClick={handleForgotPassword} className="mt-10 text-[10px] font-black uppercase tracking-widest opacity-30">Mot de passe oublié ?</button>
      <button onClick={() => navigate("/partners")} className="mt-4 text-[10px] font-black uppercase tracking-widest opacity-20">Retour au site public</button>
    </div>
  );
}

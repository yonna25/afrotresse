import { useState, useEffect } from "react";
import { supabase } from "../services/supabase.js";
import { Navigate } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";

const QUICK_AMOUNTS = [3, 10, 50];

const AuthLoader = () => (
  <div className="min-h-screen bg-[#0F0500] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin w-6 h-6 text-[#C9963A]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-[#C9963A] text-[10px] font-black uppercase tracking-widest">
        Vérification...
      </span>
    </div>
  </div>
);

export default function AdminCredits() {
  const [session, setSession] = useState(undefined);
  const [email, setEmail]     = useState("");
  const [amount, setAmount]   = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadHistory();
    });
  }, []);

  const loadHistory = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("admin_credits_history") || "[]");
      setHistory(saved);
    } catch { setHistory([]); }
  };

  const saveHistory = (entry) => {
    try {
      const saved = JSON.parse(localStorage.getItem("admin_credits_history") || "[]");
      const updated = [entry, ...saved].slice(0, 20);
      localStorage.setItem("admin_credits_history", JSON.stringify(updated));
      setHistory(updated);
    } catch {}
  };

  const handleCredit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !amount || parseInt(amount) <= 0) {
      setMsg({ text: "⚠️ Email et montant requis.", type: "error" });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const creditsToAdd = parseInt(amount);

      const { data, error } = await supabase.rpc("add_credits_by_email", {
        target_email: cleanEmail,
        credits_to_add: creditsToAdd,
      });

      if (error) throw error;

      if (data === "USER_NOT_FOUND") {
        setMsg({ text: `❌ Aucun compte trouvé pour ${cleanEmail}. L'utilisatrice doit s'être connectée au moins une fois.`, type: "error" });
        setLoading(false);
        return;
      }

      const newBalance = parseInt(data);

      const entry = {
        email: cleanEmail,
        amount: creditsToAdd,
        newBalance,
        date: new Date().toLocaleString("fr-FR"),
      };

      saveHistory(entry);
      setMsg({ text: `✅ +${creditsToAdd} crédits ajoutés. Nouveau solde : ${newBalance}`, type: "success" });
      setEmail("");
      setAmount("");

    } catch (err) {
      setMsg({ text: `❌ Erreur : ${err.message}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (session === undefined) return <AuthLoader />;
  if (session === null) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#0F0500] text-white pb-20">
      <AdminNav />

      <div className="mt-24 px-4 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Crédits</h1>
          <p className="text-white/30 text-[9px] uppercase tracking-widest mt-1">
            Gestion administrative des comptes
          </p>
        </div>

        <div className="rounded-[2rem] p-6 space-y-4 mb-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,150,58,0.2)" }}>

          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Rechercher par email</p>
            <input
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none text-sm text-white focus:border-[#C9963A]/50 transition-all"
            />
          </div>

          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Montant à ajouter</p>
            <div className="flex gap-2 mb-2">
              {QUICK_AMOUNTS.map(q => (
                <button key={q} onClick={() => setAmount(String(q))}
                  className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
                  style={{
                    background: amount === String(q) ? "#C9963A" : "rgba(255,255,255,0.05)",
                    color: amount === String(q) ? "#1A0A00" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${amount === String(q) ? "#C9963A" : "rgba(255,255,255,0.08)"}`,
                  }}>
                  +{q}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Montant personnalisé"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none text-sm text-white focus:border-[#C9963A]/50 transition-all"
            />
          </div>

          {msg && (
            <div className="rounded-xl px-4 py-3 text-sm font-bold"
              style={{
                background: msg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                border: `1px solid ${msg.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                color: msg.type === "success" ? "#22c55e" : "#ef4444",
              }}>
              {msg.text}
            </div>
          )}

          <button
            onClick={handleCredit}
            disabled={loading || !email || !amount}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#1A0A00" }}
          >
            {loading ? "Mise à jour..." : `Valider +${amount || 0} crédits`}
          </button>
        </div>

        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Dernières attributions</p>
              <button onClick={() => { localStorage.removeItem("admin_credits_history"); setHistory([]); }}
                className="text-[9px] text-red-400/60 font-bold">Effacer</button>
            </div>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{h.email}</p>
                    <p className="text-[9px] text-white/40">{h.date}</p>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="text-sm font-black text-[#C9963A]">+{h.amount}</p>
                    <p className="text-[9px] text-white/40">Total: {h.newBalance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

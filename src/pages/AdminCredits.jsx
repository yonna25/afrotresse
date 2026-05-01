import { useState, useEffect } from "react";
import { supabase } from "../services/supabase.js";
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
  const [authState, setAuthState] = useState("checking");
  const [email, setEmail]         = useState("");
  const [amount, setAmount]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState(null);
  const [history, setHistory]     = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      setAuthState("ok");
      loadHistory();
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
    if (!email.trim() || !amount || parseInt(amount) <= 0) {
      setMsg({ text: "⚠️ Email et montant requis.", type: "error" });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      // Chercher directement dans usage_credits par email
      const { data: profile, error: profileError } = await supabase
        .from("usage_credits")
        .select("user_id, credits")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        setMsg({ text: `❌ Aucun compte trouvé pour : ${email}`, type: "error" });
        setLoading(false);
        return;
      }

      const userId = profile.user_id;
      const credits = parseInt(amount);
      const currentBalance = profile.credits || 0;
      const newBalance = currentBalance + credits;

      const { error: updateError } = await supabase
        .from("usage_credits")
        .upsert(
          { user_id: userId, credits: newBalance, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );

      if (updateError) throw updateError;

      const entry = {
        email: email.trim(),
        amount: credits,
        newBalance,
        date: new Date().toLocaleString("fr-FR"),
      };

      saveHistory(entry);
      setMsg({ text: `✅ +${credits} crédits ajoutés à ${email}. Nouveau solde : ${newBalance}`, type: "success" });
      setEmail("");
      setAmount("");

    } catch (err) {
      setMsg({ text: `❌ Erreur : ${err.message}`, type: "error" });
    }

    setLoading(false);
  };

  if (authState === "checking") return <AuthLoader />;

  return (
    <div className="min-h-screen bg-[#0F0500] text-white pb-20">
      <AdminNav />

      <div className="mt-24 px-4 max-w-md mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Crédits</h1>
          <p className="text-white/30 text-[9px] uppercase tracking-widest mt-1">
            Attribuer des crédits à une utilisatrice
          </p>
        </div>

        {/* Formulaire */}
        <div className="rounded-[2rem] p-6 space-y-4 mb-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,150,58,0.2)" }}>

          {/* Email */}
          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">
              Email de l'utilisatrice
            </p>
            <input
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none text-sm text-white placeholder-white/20 focus:border-[#C9963A]/50 transition-all"
            />
          </div>

          {/* Montant */}
          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">
              Nombre de crédits
            </p>
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
              placeholder="Ou saisir un montant personnalisé"
              value={amount}
              min="1"
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none text-sm text-white placeholder-white/20 focus:border-[#C9963A]/50 transition-all"
            />
          </div>

          {/* Message */}
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

          {/* Bouton */}
          <button
            onClick={handleCredit}
            disabled={loading || !email || !amount}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-40 active:scale-95"
            style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#1A0A00" }}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Traitement...
                </span>
              : `Attribuer ${amount ? `+${amount}` : ""} crédits`
            }
          </button>
        </div>

        {/* Historique */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Historique récent</p>
              <button
                onClick={() => { localStorage.removeItem("admin_credits_history"); setHistory([]); }}
                className="text-[9px] text-red-400/60 font-bold hover:text-red-400 transition-all"
              >
                Effacer
              </button>
            </div>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[180px]">{h.email}</p>
                    <p className="text-[9px] text-white/30">{h.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black" style={{ color: "#C9963A" }}>+{h.amount}</p>
                    <p className="text-[9px] text-white/30">Solde : {h.newBalance}</p>
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

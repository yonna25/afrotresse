import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabase.js";
import { Navigate } from "react-router-dom";
import AdminNav from "../components/AdminNav.jsx";

const AuthLoader = () => (
  <div className="min-h-screen bg-[#0F0500] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin w-6 h-6 text-[#C9963A]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-[#C9963A] text-[10px] font-black uppercase tracking-widest">Vérification...</span>
    </div>
  </div>
);

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
};

const formatDateShort = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });
};

const getBadge = (consumed) => {
  if (consumed >= 20) return { label: "👑 VIP",     color: "#C9963A" };
  if (consumed >= 10) return { label: "⭐ Active",  color: "#60a5fa" };
  if (consumed >= 3)  return { label: "🌱 Engagée", color: "#22c55e" };
  return null;
};

// ─── Vue détaillée ────────────────────────────────────────────────────────────
function UserDetail({ user, onBack }) {
  const [movements, setMovements]       = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const consumed = movements.filter(m => m.amount < 0).reduce((s, m) => s + Math.abs(m.amount), 0);
  const earned   = movements.filter(m => m.amount > 0).reduce((s, m) => s + m.amount, 0);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoadingDetails(true);
      const { data } = await supabase
        .from("credit_movements")
        .select("*")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false })
        .limit(30);
      setMovements(data || []);
      setLoadingDetails(false);
    };
    fetchDetails();
  }, [user.user_id]);

  const movTypeLabel = (type) => {
    if (type === "free")     return { label: "Offert", color: "#22c55e" };
    if (type === "admin")    return { label: "Admin",  color: "#C9963A" };
    if (type === "purchase") return { label: "Achat",  color: "#60a5fa" };
    if (type === "use")      return { label: "Analyse", color: "#f87171" };
    return { label: type, color: "#ffffff" };
  };

  const badge = getBadge(consumed);

  return (
    <div className="min-h-screen bg-[#0F0500] text-white pb-20">
      <AdminNav />
      <div className="mt-32 px-4 max-w-md mx-auto">

        <button onClick={onBack}
          className="flex items-center gap-2 text-[#C9963A] text-xs font-black uppercase tracking-widest mb-6 py-3 w-full active:opacity-60">
          ← Retour à la liste
        </button>

        {/* Carte identité */}
        <div className="rounded-[2rem] p-6 mb-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,150,58,0.3)" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#1A0A00" }}>
              {user.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-white font-black text-sm truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-white/30 text-[9px] uppercase tracking-widest">Utilisatrice</p>
                {badge && (
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: `${badge.color}20`, color: badge.color }}>
                    {badge.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-black/30">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Solde actuel</p>
              <p className="text-[#C9963A] text-xl font-black">{user.credits ?? 0}</p>
              <p className="text-white/20 text-[9px]">crédits restants</p>
            </div>
            <div className="rounded-xl p-3 bg-black/30">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Consommés</p>
              <p className="text-red-400 text-xl font-black">{consumed}</p>
              <p className="text-white/20 text-[9px]">crédits utilisés</p>
            </div>
            <div className="rounded-xl p-3 bg-black/30">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Total reçus</p>
              <p className="text-green-400 text-xl font-black">{earned}</p>
              <p className="text-white/20 text-[9px]">crédits gagnés</p>
            </div>
            <div className="rounded-xl p-3 bg-black/30">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Analyses</p>
              <p className="text-white text-xl font-black">
                {movements.filter(m => m.type === "use").length}
              </p>
              <p className="text-white/20 text-[9px]">effectuées</p>
            </div>
            <div className="rounded-xl p-3 bg-black/30">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Inscrite le</p>
              <p className="text-white text-xs font-bold">{formatDateShort(user.created_at)}</p>
            </div>
            <div className="rounded-xl p-3 bg-black/30">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Dernière activité</p>
              <p className="text-white text-xs font-bold">{formatDateShort(user.last_seen)}</p>
            </div>
          </div>
        </div>

        {/* Historique */}
        <div className="mb-4">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3 px-1">
            Historique des crédits ({movements.length})
          </p>
          {loadingDetails ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin w-5 h-5 text-[#C9963A]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : movements.length === 0 ? (
            <div className="rounded-2xl p-6 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-white/20 text-xs">Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => {
                const { label, color } = movTypeLabel(m.type);
                const isNeg = m.amount < 0;
                return (
                  <div key={m.id}
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div>
                      <p className="text-xs font-bold text-white">{m.description || "—"}</p>
                      <p className="text-[9px] text-white/30">{formatDate(m.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black" style={{ color: isNeg ? "#f87171" : "#22c55e" }}>
                        {isNeg ? "" : "+"}{m.amount}
                      </p>
                      <p className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${color}20`, color }}>
                        {label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Liste principale ─────────────────────────────────────────────────────────
const SORTS = [
  { key: "consumed", label: "🔥 Consommation" },
  { key: "credits",  label: "💰 Solde"        },
  { key: "last_seen",label: "🕐 Activité"     },
  { key: "created_at",label: "📅 Inscription" },
];

export default function AdminUsers() {
  const [session, setSession]           = useState(undefined);
  const [users, setUsers]               = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [consumed, setConsumed]         = useState({});  // user_id → crédits consommés
  const [search, setSearch]             = useState("");
  const [sortKey, setSortKey]           = useState("consumed");
  const [loading, setLoading]           = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUsers();
    });
  }, []);

  const fetchUsers = async () => {
    setLoading(true);

    const [usersRes, movRes] = await Promise.all([
      supabase.rpc("get_all_users_with_credits"),
      supabase.from("credit_movements").select("user_id, amount").lt("amount", 0),
    ]);

    const usersData = usersRes.data || [];

    // Calculer crédits consommés par user
    const consumedMap = {};
    (movRes.data || []).forEach(m => {
      consumedMap[m.user_id] = (consumedMap[m.user_id] || 0) + Math.abs(m.amount);
    });

    setConsumed(consumedMap);
    setUsers(usersData);
    setLoading(false);
  };

  // Filtrage + tri — consumed en ref pour éviter boucle infinie
  useEffect(() => {
    const q = search.trim().toLowerCase();

    // Filtrage strict sur email uniquement
    let res = q
      ? users.filter(u => (u.email || '').toLowerCase().includes(q))
      : [...users];

    // Tri
    res.sort((a, b) => {
      if (sortKey === "consumed")    return (consumed[b.user_id] || 0) - (consumed[a.user_id] || 0);
      if (sortKey === "credits")     return (b.credits || 0) - (a.credits || 0);
      if (sortKey === "last_seen")   return new Date(b.last_seen || 0) - new Date(a.last_seen || 0);
      if (sortKey === "created_at")  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return 0;
    });

    setFiltered(res);
  }, [search, users, sortKey]); // consumed retiré des deps — stable après fetchUsers

  const openDetail = (u) => {
    scrollRef.current = window.scrollY;
    setSelectedUser(u);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setTimeout(() => window.scrollTo({ top: scrollRef.current }), 50);
  };

  const totalConsumed = Object.values(consumed).reduce((s, v) => s + v, 0);
  const activeThisWeek = users.filter(u =>
    u.last_seen && new Date(u.last_seen) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  if (session === undefined) return <AuthLoader />;
  if (session === null)      return <Navigate to="/login" replace />;
  if (selectedUser)          return <UserDetail user={selectedUser} onBack={handleBack} />;

  return (
    <div className="min-h-screen bg-[#0F0500] text-white pb-20">
      <AdminNav />
      <div className="mt-32 px-4 max-w-md mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[#C9963A] text-2xl font-black uppercase tracking-tighter">Utilisatrices</h1>
          <p className="text-white/30 text-[9px] uppercase tracking-widest mt-1">
            {users.length} compte{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="rounded-2xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,150,58,0.15)" }}>
            <p className="text-[#C9963A] text-lg font-black">{users.length}</p>
            <p className="text-white/30 text-[8px] uppercase tracking-widest">Total</p>
          </div>
          <div className="rounded-2xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,150,58,0.15)" }}>
            <p className="text-[#C9963A] text-lg font-black">{activeThisWeek}</p>
            <p className="text-white/30 text-[8px] uppercase tracking-widest">7 jours</p>
          </div>
          <div className="rounded-2xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,150,58,0.15)" }}>
            <p className="text-red-400 text-lg font-black">{totalConsumed}</p>
            <p className="text-white/30 text-[8px] uppercase tracking-widest">Consommés</p>
          </div>
        </div>

        {/* Recherche */}
        <div className="mb-3">
          <input type="text" placeholder="Rechercher par email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/40 p-4 rounded-xl border border-white/10 outline-none text-sm text-white focus:border-[#C9963A]/50 transition-all"
          />
        </div>

        {/* Tri */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {SORTS.map(s => (
            <button key={s.key} onClick={() => setSortKey(s.key)}
              className="py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all w-full"
              style={{
                background: sortKey === s.key ? "rgba(201,150,58,0.15)" : "transparent",
                borderColor: sortKey === s.key ? "rgba(201,150,58,0.4)" : "rgba(255,255,255,0.08)",
                color: sortKey === s.key ? "#C9963A" : "rgba(255,255,255,0.3)",
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-[#C9963A]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white/20 text-sm">Aucune utilisatrice trouvée</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u, i) => {
              const userConsumed = consumed[u.user_id] || 0;
              const badge = getBadge(userConsumed);
              const isTop3 = sortKey === "consumed" && i < 3 && userConsumed > 0;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <button key={u.user_id} onClick={() => openDetail(u)}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-95 text-left"
                  style={{
                    background: isTop3 ? "rgba(201,150,58,0.07)" : "rgba(255,255,255,0.03)",
                    border: isTop3 ? "1px solid rgba(201,150,58,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Avatar ou médaille */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #C9963A33, #E8B96A33)", color: "#C9963A" }}>
                      {isTop3 ? medals[i] : (u.email?.[0]?.toUpperCase() || "?")}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-xs font-bold truncate">{u.email}</p>
                        {badge && (
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: `${badge.color}20`, color: badge.color }}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-white/30 text-[9px]">
                        {u.last_seen ? `Vu ${formatDateShort(u.last_seen)}` : "Jamais connectée"}
                        {userConsumed > 0 && ` · ${userConsumed} consommés`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-[#C9963A] font-black text-sm">{u.credits ?? 0}</p>
                    <p className="text-white/20 text-[9px]">restants</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Refresh */}
        <button onClick={fetchUsers}
          className="w-full mt-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          style={{ background: "rgba(201,150,58,0.1)", color: "#C9963A", border: "1px solid rgba(201,150,58,0.2)" }}>
          ↻ Actualiser
        </button>
      </div>
    </div>
  );
            }
    

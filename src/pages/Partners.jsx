import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getPartners } from "../services/useSupabasePartners.js";

const CATEGORIES = ["Tous", "Salon", "Produits", "Formation"];

// ── Countdown timer ──────────────────────────────────────────────────────────
function useCountdown(deadline) {
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    if (!deadline) return;
    const calc = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) { setTimeLeft(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [deadline]);
  return timeLeft;
}

// ── Modal détail partenaire ──────────────────────────────────────────────────
function PartnerModal({ partner, onClose }) {
  const [copied, setCopied] = useState(false);
  const timeLeft = useCountdown(partner.promo_deadline);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(partner.promo_code); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContact = () => {
    if (partner.phone) window.open(`tel:${partner.phone}`);
    else if (partner.instagram) window.open(`https://instagram.com/${partner.instagram.replace('@','')}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="w-full max-w-sm rounded-t-[2.5rem] overflow-hidden"
        style={{ background: "linear-gradient(160deg, #2C1A0E, #1a0f0a)", border: "1px solid rgba(201,150,58,0.35)", maxHeight: "88vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="px-6 pb-10 pt-3">

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: "rgba(201,150,58,0.13)", border: "1px solid rgba(201,150,58,0.3)" }}>
                {partner.emoji || "🤝"}
              </div>
              <div>
                <h2 className="font-black text-lg text-white leading-tight">{partner.name}</h2>
                <p className="text-[11px] text-[#C9963A] font-bold mt-0.5">{partner.city}</p>
                <p className="text-[10px] text-white/40 mt-0.5">⭐ {partner.rating} · {partner.reviews} avis</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/8 text-white/50 text-sm">✕</button>
          </div>

          {/* Badge */}
          {partner.badge && (
            <div className="mb-4">
              <span className="text-[10px] font-black px-3 py-1 rounded-full"
                style={{ background: `${partner.badge_color||'#C9963A'}22`, color: partner.badge_color||'#C9963A', border: `1px solid ${partner.badge_color||'#C9963A'}50` }}>
                {partner.badge}
              </span>
            </div>
          )}

          <p className="text-[12px] text-white/65 leading-relaxed mb-4">{partner.description}</p>

          {/* Tags */}
          {partner.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {partner.tags.map((tag, i) => (
                <span key={i} className="text-[10px] text-white/50 bg-white/6 border border-white/10 px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {/* Spécialité */}
          <div className="rounded-2xl px-4 py-3 mb-4 bg-white/4 border border-white/8">
            <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1">Spécialités</p>
            <p className="text-[12px] text-white/80 font-bold">{partner.specialty}</p>
          </div>

          {/* FORMAT PUB 3 — Timer */}
          {partner.promo_deadline && timeLeft && (
            <div className="rounded-2xl p-3 mb-4 flex items-center gap-3"
              style={{ background: "rgba(255,107,53,0.12)", border: "1px solid rgba(255,107,53,0.4)" }}>
              <span className="text-xl">⏱</span>
              <div>
                <p className="text-[10px] text-orange-300 font-black uppercase tracking-wider">Offre limitée</p>
                <p className="text-white font-black text-lg tracking-widest">{timeLeft}</p>
              </div>
            </div>
          )}

          {/* Code promo */}
          {partner.promo && (
            <div className="rounded-2xl p-4 mb-5 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, rgba(201,150,58,0.14), rgba(232,185,106,0.07))", border: "1px solid rgba(201,150,58,0.4)" }}>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-[#C9963A]/60 mb-0.5">Offre exclusive</p>
                <p className="text-sm font-black text-white">{partner.promo}</p>
                {partner.promo_code && <p className="text-[10px] text-[#C9963A] font-bold mt-0.5">Code : {partner.promo_code}</p>}
              </div>
              {partner.promo_code && (
                <button onClick={handleCopy}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
                  style={{ background: "rgba(201,150,58,0.18)" }}>
                  {copied ? "✅" : "📋"}
                </button>
              )}
            </div>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleContact}
            className="w-full py-4 rounded-2xl font-black text-base text-[#1a0f0a] mb-3"
            style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
            {partner.phone ? "📞 Appeler" : "📲 Voir sur Instagram"}
          </motion.button>

          {partner.instagram && (
            <button onClick={() => window.open(`https://instagram.com/${partner.instagram.replace('@','')}`, '_blank')}
              className="w-full py-3 rounded-2xl font-bold text-sm text-white/50 bg-white/5 border border-white/10">
              {partner.instagram}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function Partners() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);

  useEffect(() => {
    getPartners()
      .then(setPartners)
      .catch(() => setError("Impossible de charger les partenaires."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = partners.filter(p => {
    const matchCat = activeCategory === "Tous" || p.category === activeCategory;
    const matchSearch = search === "" ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // FORMAT PUB 1 — Bannière
  const banner = partners.find(p => p.sponsored && p.banner_text && p.active);
  // FORMAT PUB 2 — Boost : sponsorisés en premier
  const sorted = [...filtered].sort((a, b) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0));

  return (
    <div className="min-h-[100dvh] bg-[#1a0f0a] text-white pb-32">

      {/* HEADER */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-18"
          style={{ background: "radial-gradient(ellipse at top right, #C9963A 0%, transparent 65%)" }} />
        <div className="relative px-5 pt-12 pb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#C9963A] text-sm font-bold mb-6">← Retour</button>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#C9963A]/55 font-bold mb-1">AfroTresse</p>
              <h1 className="font-black text-3xl leading-none">Nos<br /><span className="text-[#C9963A]">Partenaires</span></h1>
              <p className="text-[11px] text-white/35 mt-2 leading-relaxed max-w-[200px]">Salons, produits et formations sélectionnés 👑</p>
            </div>
            <div className="text-6xl opacity-10">🤝</div>
          </div>
        </div>
      </div>

      {/* FORMAT PUB 1 — BANNIÈRE SPONSORISÉE */}
      {banner && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-5 mb-4 rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:scale-98 transition-all"
          style={{ background: `linear-gradient(135deg, ${banner.banner_color||'#C9963A'}22, ${banner.banner_color||'#C9963A'}08)`, border: `1px solid ${banner.banner_color||'#C9963A'}50` }}
          onClick={() => setSelectedPartner(banner)}>
          <span className="text-2xl">{banner.emoji || "⭐"}</span>
          <div className="flex-1">
            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: `${banner.banner_color||'#C9963A'}30`, color: banner.banner_color||'#C9963A' }}>
              Sponsorisé
            </span>
            <p className="text-sm font-black text-white mt-0.5">{banner.banner_text}</p>
            <p className="text-[10px] text-white/40">{banner.name} · {banner.city}</p>
          </div>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.div>
      )}

      {/* RECHERCHE */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <span className="text-white/25 text-sm">🔍</span>
          <input type="text" placeholder="Rechercher un salon, ville..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
          {search && <button onClick={() => setSearch("")} className="text-white/30 text-sm">✕</button>}
        </div>
      </div>

      {/* FILTRES */}
      <div className="px-5 mb-6 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <motion.button key={cat} whileTap={{ scale: 0.95 }} onClick={() => setActiveCategory(cat)}
            className="shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
            style={activeCategory === cat
              ? { background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#1a0f0a" }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)" }}>
            {cat}
          </motion.button>
        ))}
      </div>

      {/* BANNIÈRE RECRUTEMENT */}
      <div className="px-5 mb-6">
        <motion.div whileTap={{ scale: 0.98 }}
          className="relative rounded-3xl p-5 overflow-hidden cursor-pointer"
          style={{ background: "linear-gradient(135deg, #2C1A0E, #3D2616)", border: "1px solid rgba(201,150,58,0.4)" }}
          onClick={() => window.open("mailto:partenaires@afrotresse.com", "_blank")}>
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10"
            style={{ background: "radial-gradient(circle, #C9963A, transparent)" }} />
          <p className="text-[9px] uppercase tracking-widest text-[#C9963A]/55 mb-1">Tu es coiffeuse ou marque ?</p>
          <p className="font-black text-base text-white mb-1">Rejoins nos partenaires 🤝</p>
          <p className="text-[10px] text-white/45 leading-relaxed">
            Touche des milliers de clientes qualifiées. <span className="text-[#C9963A] font-bold">Visibilité gratuite le 1er mois.</span>
          </p>
          <p className="text-[11px] font-black text-[#C9963A] mt-3">Nous contacter →</p>
        </motion.div>
      </div>

      {/* LISTE */}
      <div className="px-5 flex flex-col gap-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 rounded-3xl bg-white/5 animate-pulse" />)
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">😕</p>
            <p className="text-white/40 text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-[#C9963A] text-sm font-bold">Réessayer</button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-white/40 text-sm">Aucun partenaire trouvé</p>
          </div>
        ) : sorted.map((p, i) => {
          const hasTimer = p.promo_deadline && new Date(p.promo_deadline) > new Date();
          return (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPartner(p)}
              className="relative rounded-3xl overflow-hidden cursor-pointer"
              style={{
                background: "linear-gradient(160deg, #2a1a10, #1a0f0a)",
                border: p.sponsored ? "1px solid rgba(201,150,58,0.5)" : p.active ? "1px solid rgba(201,150,58,0.2)" : "1px solid rgba(255,255,255,0.05)",
                opacity: p.active ? 1 : 0.55,
              }}>

              {/* FORMAT PUB 2 — Bande dorée boost */}
              {p.sponsored && <div className="h-0.5" style={{ background: "linear-gradient(90deg, #C9963A, #E8B96A, transparent)" }} />}

              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "rgba(201,150,58,0.11)", border: "1px solid rgba(201,150,58,0.24)" }}>
                    {p.emoji || "🤝"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {p.sponsored && <span className="text-[8px] font-black text-[#C9963A] uppercase tracking-widest">⭐ Sponsorisé · </span>}
                        <h3 className="font-black text-base text-white leading-tight">{p.name}</h3>
                        <p className="text-[10px] text-[#C9963A] font-bold mt-0.5">{p.city}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 bg-white/5 rounded-xl px-2 py-1">
                        <span className="text-[10px]">⭐</span>
                        <span className="text-[11px] font-black text-white">{p.rating}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/35 mt-1 truncate">{p.specialty}</p>
                  </div>
                </div>

                <div className="my-3 border-t border-white/5" />

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {p.badge && (
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-full"
                      style={{ background: `${p.badge_color||'#C9963A'}20`, color: p.badge_color||'#C9963A', border: `1px solid ${p.badge_color||'#C9963A'}40` }}>
                      {p.badge}
                    </span>
                  )}
                  {p.promo && (
                    <span className="text-[10px] text-[#C9963A] font-bold bg-[#C9963A]/10 px-3 py-1 rounded-full">🎁 {p.promo}</span>
                  )}
                  {/* FORMAT PUB 3 — Badge timer sur la carte */}
                  {hasTimer && (
                    <span className="text-[9px] font-black text-orange-300 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-full">⏱ Offre limitée</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {selectedPartner && <PartnerModal partner={selectedPartner} onClose={() => setSelectedPartner(null)} />}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, syncCreditsFromServer } from "../services/credits.js";
import Seo from "../components/Seo.jsx";
import {
  generateStableMessage,
  getOrCreateSessionId,
  resetMessageAssignment,
} from "../services/stableMessage.js";
import { useFavorites } from "../hooks/useFavorites.js";

const STYLES_PER_PAGE = 3;

// ─── ProtectedImg ─────────────────────────────────────────────────────────────
const ProtectedImg = ({ src, alt, className, onClick }) => (
  <div className="relative w-full h-full" onClick={onClick}>
    <img src={src} alt={alt} className={className}
      draggable={false} onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none" }} />
    <div className="absolute inset-0"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()} />
  </div>
);

// ─── Fireworks ────────────────────────────────────────────────────────────────
function Fireworks({ onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const COLORS = ["#C9963A","#E8B96A","#FAF4EC","#FFFFFF","#FFD700","#A87B28","#FFF0C0"];

    class Particle {
      constructor(x, y) {
        this.x = x; this.y = y;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
        this.decay = Math.random() * 0.018 + 0.008;
        this.size = Math.random() * 3.5 + 1;
        this.trail = Math.random() > 0.5;
      }
      update() { this.x += this.vx; this.y += this.vy; this.vy += 0.09; this.vx *= 0.98; this.life -= this.decay; }
      draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        if (this.trail) {
          ctx.globalAlpha = Math.max(0, this.life * 0.3);
          ctx.beginPath(); ctx.arc(this.x - this.vx * 2, this.y - this.vy * 2, this.size * 0.6, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    const particles = [];
    const BURSTS = [
      { x: W * 0.2,  y: H * 0.28, delay: 0   },
      { x: W * 0.8,  y: H * 0.22, delay: 180 },
      { x: W * 0.5,  y: H * 0.15, delay: 350 },
      { x: W * 0.15, y: H * 0.5,  delay: 520 },
      { x: W * 0.85, y: H * 0.42, delay: 280 },
      { x: W * 0.5,  y: H * 0.38, delay: 600 },
    ];
    const timers = BURSTS.map(b => setTimeout(() => {
      for (let i = 0; i < 70; i++) particles.push(new Particle(b.x, b.y));
    }, b.delay));

    let animId, finished = false;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (particles.length > 0 || !finished) { animId = requestAnimationFrame(animate); }
      else { onDone?.(); }
    };
    animate();
    const doneTimer = setTimeout(() => { finished = true; }, 3200);
    return () => { timers.forEach(clearTimeout); clearTimeout(doneTimer); cancelAnimationFrame(animId); };
  }, [onDone]);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999, width: "100%", height: "100%" }} />
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Results() {
  const navigate = useNavigate();

  const [faceShape, setFaceShape]         = useState("oval");
  const [selfieUrl, setSelfieUrl]         = useState(null);
  const [styles, setStyles]               = useState([]);
  const [credits, setCredits]             = useState(getCredits());
  const [zoomImage, setZoomImage]         = useState(null);
  const [errorMsg, setErrorMsg]           = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [showVirtualTryOnModal, setShowVirtualTryOnModal] = useState(false);
  const [stableMsg, setStableMsg]         = useState({ headline: "Voici tes résultats ✨", subtext: "" });
  const [displayName, setDisplayName]     = useState(() => localStorage.getItem("afrotresse_user_name") || "");

  const { isFav, toggleFav, FREE_LIMIT } = useFavorites();

  const [currentPage, setCurrentPage]     = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));
  const [styleStats, setStyleStats]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("afrotresse_style_stats") || "{}"); }
    catch { return {}; }
  });

  const topRef   = useRef(null);
  const errorRef = useRef(null);
  const userName = localStorage.getItem("afrotresse_user_name") || "Reine";

  const consumeFireworksFlag = () => {
    const flag = sessionStorage.getItem("afrotresse_trigger_fireworks");
    if (flag) { sessionStorage.removeItem("afrotresse_trigger_fireworks"); return true; }
    return false;
  };

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFaceShape(parsed.faceShape || "oval");
        const recs = parsed.recommendations || [];
        setStyles(recs);
        if (recs.length > 0 && consumeFireworksFlag()) {
          setShowFireworks(true);
          resetMessageAssignment();
        }
        const sessionId  = getOrCreateSessionId();
        const name       = localStorage.getItem("afrotresse_user_name") || "";
        const confidence = parsed.confidence ?? 0.5;
        const shape      = parsed.faceShape || "oval";
        setStableMsg(generateStableMessage({ faceShape: shape, sessionId, name, confidence }));
        setStyleStats(prev => {
          const next = { ...prev };
          let changed = false;
          recs.forEach(s => {
            if (!next[s.id]) {
              next[s.id] = {
                views: Math.floor(Math.random() * 3000) + 800,
                likes: Math.floor(Math.random() * 1200) + 200,
              };
              changed = true;
            }
          });
          if (changed) localStorage.setItem("afrotresse_style_stats", JSON.stringify(next));
          return next;
        });
      } catch (e) { console.error("Error parsing results:", e); }
    }
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    syncCreditsFromServer().then(c => { if (c !== undefined) setCredits(c); }).catch(() => setCredits(getCredits()));
  }, []);

  // Vues/likes temps réel
  useEffect(() => {
    const viewInterval = setInterval(() => {
      setStyleStats(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = { ...next[id], views: next[id].views + Math.floor(Math.random() * 3) + 1 };
        });
        localStorage.setItem("afrotresse_style_stats", JSON.stringify(next));
        return next;
      });
    }, 8000);
    const likeInterval = setInterval(() => {
      setStyleStats(prev => {
        const next = { ...prev };
        const ids = Object.keys(next);
        if (ids.length > 0) {
          const id = ids[Math.floor(Math.random() * ids.length)];
          next[id] = { ...next[id], likes: next[id].likes + 1 };
        }
        localStorage.setItem("afrotresse_style_stats", JSON.stringify(next));
        return next;
      });
    }, 20000);
    return () => { clearInterval(viewInterval); clearInterval(likeInterval); };
  }, []);

  // Pagination
  const getShuffledStyles = (shuffleSeed) => {
    const seeded = (seed) => {
      let s = seed;
      return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    };
    const rand = seeded(shuffleSeed);
    const arr = [...styles];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const getPageStyles = (page) => {
    const total = styles.length;
    if (total === 0) return [];
    const baseSeed = userName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 12345);
    const stylesPerShuffle = Math.floor(total / STYLES_PER_PAGE) * STYLES_PER_PAGE || STYLES_PER_PAGE;
    const shuffleIndex = Math.floor(((page - 1) * STYLES_PER_PAGE) / stylesPerShuffle);
    const positionInShuffle = ((page - 1) * STYLES_PER_PAGE) % stylesPerShuffle;
    const shuffled = getShuffledStyles(baseSeed + shuffleIndex * 9973);
    const result = [];
    for (let i = 0; i < STYLES_PER_PAGE; i++) result.push(shuffled[(positionInShuffle + i) % total]);
    return result;
  };

  const displayedStyles = getPageStyles(currentPage);
  const totalPages = styles.length > 0 ? Math.ceil(styles.length / STYLES_PER_PAGE) : 1;

  const goToPage = (page) => {
    setCurrentPage(page);
    localStorage.setItem("afrotresse_current_page", String(page));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGenerateMore = async () => {
    const realCredits = await syncCreditsFromServer().catch(() => getCredits());
    setCredits(realCredits);
    if (realCredits <= 0) { navigate("/credits"); return; }

    try {
      const { getSessionIdWithFp } = await import("../services/fingerprint.js");
      const { getCurrentUser }     = await import("../services/useSupabaseCredits.js");
      const sessionId = await getSessionIdWithFp();
      const user      = await getCurrentUser().catch(() => null);
      const userId    = user?.id || null;

      const res = await fetch("/api/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId, amount: 1 }),
      });
      if (res.status === 402 || !res.ok) { navigate("/credits"); return; }
      const { credits: newBalance } = await res.json();
      setCredits(newBalance);
    } catch {
      navigate("/credits"); return;
    }

    const nextPage = unlockedPages + 1;
    setUnlockedPages(nextPage);
    setCurrentPage(nextPage);
    localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
    localStorage.setItem("afrotresse_current_page", String(nextPage));
    setShowFireworks(true);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleToggleFav = (style) => {
    const result = toggleFav(style);
    if (result && !result.success && result.reason === "limit_reached") {
      setErrorMsg(`💎 Limite de ${FREE_LIMIT} favoris atteints !`);
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // ÉTAT ZÉRO — aucun résultat (première visite ou onglet Styles)
  // ══════════════════════════════════════════════════════════════════
  if (!styles.length) {
    return (
      <div
        className="min-h-[100dvh] text-[#FAF4EC] flex flex-col relative overflow-hidden"
        style={{ backgroundColor: '#2C1A0E' }}
      >
        <Seo title="Styles — AfroTresse" />

        {/* Hero couronne */}
        <div className="relative flex flex-col items-center justify-center pt-16 pb-8 px-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="text-6xl mb-4"
          >
            👑
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white font-bold text-2xl text-center leading-tight"
          >
            Ton visage,{" "}
            <span style={{ color: "#C9963A" }}>tes styles ✨</span>
          </motion.p>
        </div>

        <div className="flex flex-col flex-1 px-5 pb-32">

          {/* Titre + accroche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }} className="mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-2">
              Découvre les tresses adaptées à ton visage 💛
            </h2>
            <p className="text-sm text-white/50 leading-relaxed italic">
              "Un selfie suffit pour trouver la coiffure qui te correspond."
            </p>
          </motion.div>

          {/* 3 étapes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col gap-3 mb-8"
          >
            {[
              { icon: "📸", label: "Selfie",              sub: "Prends ou uploade une photo" },
              { icon: "🔍", label: "Analyse IA",          sub: "Tes proportions en quelques secondes" },
              { icon: "✨", label: "Styles personnalisés", sub: "3 recommandations taillées pour toi" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-4 rounded-2xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className="text-2xl">{step.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white leading-none">{step.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{step.sub}</p>
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(201,150,58,0.15)",
                    border: "1px solid rgba(201,150,58,0.35)",
                  }}
                >
                  <span className="text-[#C9963A] text-[10px] font-bold">{i + 1}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/camera")}
            className="w-full py-5 rounded-2xl font-bold text-base text-[#2C1A0E] shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #C9963A, #E8B96A)",
              boxShadow: "0 0 30px rgba(201,150,58,0.35)",
            }}
          >
            📸 Prendre mon selfie
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-[10px] text-white/30 mt-3"
          >
            Crédits offerts à l'inscription · Aucune inscription requise
          </motion.p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ÉCRAN RÉSULTATS
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">
      <Seo title="Tes résultats — AfroTresse" />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}
      <div ref={topRef} />

      {/* Erreur favoris */}
      {errorMsg && (
        <motion.div ref={errorRef}
          className="mb-4 px-5 py-3 rounded-2xl bg-red-900/30 border border-red-500/30 text-red-300 text-[11px] font-bold text-center">
          {errorMsg}
        </motion.div>
      )}

      {/* HEADER selfie + message */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10"
        style={{ boxShadow: "0 0 40px rgba(201,150,58,0.2)" }}
      >
        <div className="relative shrink-0">
          {selfieUrl ? (
            <ProtectedImg src={selfieUrl}
              className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-white/50">
              Photo
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md uppercase">
            Moi
          </div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="font-bold text-lg text-[#C9963A] leading-tight break-words">
            {displayName
              ? <><span className="block">Voici tes résultats</span><span className="text-white">{displayName}</span> ✨</>
              : stableMsg.headline
            }
          </h1>
          <p className="text-[11px] opacity-80 leading-snug mt-1.5">{stableMsg.subtext}</p>
          {/* Description morphologie */}
          {faceShape && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(201,150,58,0.15)", color: "#C9963A", border: "1px solid rgba(201,150,58,0.3)" }}>
                Visage {faceShape}
              </span>
              <span className="text-[9px] text-white/35 leading-tight">
                · Styles sélectionnés pour ta morphologie
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* STYLES */}
      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {
          const styleId    = style.id?.replace(/-/g, "");
          const isFavorited = isFav(style.id);
          const stats      = styleStats[style.id] || { views: 0, likes: 0 };

          return (
            <motion.div
              key={style.id || index}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl"
            >
              {/* Photos 3 vues */}
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <ProtectedImg
                    src={style.views?.face || `/styles/${styleId}-face.webp`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setZoomImage(style.views?.face || `/styles/${styleId}-face.webp`)}
                  />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <ProtectedImg
                    src={style.views?.back || `/styles/${styleId}-back.webp`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setZoomImage(style.views?.back || `/styles/${styleId}-back.webp`)}
                  />
                  <ProtectedImg
                    src={style.views?.top || `/styles/${styleId}-top.webp`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setZoomImage(style.views?.top || `/styles/${styleId}-top.webp`)}
                  />
                </div>
              </div>

              <div className="p-6">
                {/* Nom + fav */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-xl text-white">{style.name}</h3>
                  <button
                    onClick={() => handleToggleFav(style)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isFavorited ? "rgba(201,150,58,0.2)" : "rgba(255,255,255,0.05)",
                      border: isFavorited ? "1.5px solid #C9963A" : "1.5px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <span className="text-base">{isFavorited ? "❤️" : "🤍"}</span>
                  </button>
                </div>

                {/* Stats vues/likes + temps de pose */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-[10px] text-white/30">
                    👁 {stats.views.toLocaleString("fr-FR")} vues
                  </span>
                  <span className="text-[10px] text-white/30">
                    ❤️ {stats.likes.toLocaleString("fr-FR")} likes
                  </span>
                  {(style.duration || style.pose_time || style.time) && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      ⏱ {style.duration || style.pose_time || style.time}
                    </span>
                  )}
                </div>

                <p className="text-[11px] opacity-60 mb-4 leading-relaxed">
                  {style.description || "Un style unique adapté à ta morphologie"}
                </p>

                {/* Tags */}
                {style.tags && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {style.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] bg-white/10 text-white/70 px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Virtual Try-On CTA avec badge Bientôt à l'angle */}
                <div className="relative">
                  {/* Badge Bientôt — angle supérieur droit */}
                  <div className="absolute -top-2.5 -right-2.5 z-10">
                    <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #C9963A, #E8B96A)",
                        color: "#1A0A00",
                        boxShadow: "0 0 12px rgba(201,150,58,0.5)",
                      }}>
                      ⏳ Bientôt
                    </span>
                  </div>
                  <button
                    onClick={() => setShowVirtualTryOnModal(true)}
                    className="w-full py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(201,150,58,0.08), rgba(201,150,58,0.03))",
                      border: "1.5px solid rgba(201,150,58,0.25)",
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 -skew-x-12 pointer-events-none"
                      style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,150,58,0.08) 50%, transparent 100%)" }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    />
                    <span className="flex items-center justify-center gap-2 relative">
                      <span className="text-lg">🧖‍♀️</span>
                      <span className="text-white/50 font-semibold text-sm">Essayer virtuellement</span>
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* VOIR 3 AUTRES STYLES */}
      {unlockedPages < totalPages && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Envie de plus ?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerateMore}
            className="w-full max-w-xs py-4 rounded-2xl font-semibold text-sm"
            style={{ background: "rgba(201,150,58,0.06)", border: "1px solid rgba(201,150,58,0.2)" }}
          >
            <span className="flex items-center justify-center gap-2 text-[#C9963A]/80">
              ✨ Voir 3 autres styles
              <span className="text-[9px] bg-[#C9963A]/10 border border-[#C9963A]/20 text-[#C9963A]/70 px-2 py-0.5 rounded-full font-bold">
                1 crédit
              </span>
            </span>
            <p className="text-[10px] text-white/20 mt-1 font-normal">
              Solde : {credits} crédit{credits > 1 ? "s" : ""}
            </p>
          </motion.button>
        </motion.div>
      )}

      {/* PAGINATION */}
      {unlockedPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <p className="text-[11px] text-white/40 uppercase tracking-widest">
            Page {currentPage} / {unlockedPages}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center disabled:opacity-30 active:scale-95">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {Array.from({ length: unlockedPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => goToPage(page)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all active:scale-95 ${page === currentPage ? "text-[#2C1A0E] shadow-lg" : "bg-white/10 border border-white/10 text-white/60"}`}
                style={page === currentPage ? { background: "linear-gradient(135deg, #C9963A, #E8B96A)" } : {}}>
                {page}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === unlockedPages}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center disabled:opacity-30 active:scale-95">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}

      {/* BOUTONS FLOTTANTS : Solde + Générer */}
      <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-2">
        {/* Solde */}
        <motion.div
          initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate("/credits")}
          className="w-12 h-12 bg-[#FAF4EC] text-[#2C1A0E] rounded-xl flex flex-col items-center justify-center shadow-lg border border-[#C9963A]/30 cursor-pointer active:scale-95 transition-all"
        >
          <div className="text-[5px] font-black uppercase opacity-60 leading-tight">Solde</div>
          <div className="text-xl font-black leading-none">{credits}</div>
        </motion.div>
        {/* Générer — toujours visible */}
        <motion.button
          initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleGenerateMore}
          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-lg relative active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
        >
          <span className="text-[6px] font-black text-[#2C1A0E] uppercase leading-none mb-0.5">Gen</span>
          <span className="text-base">✨</span>
          <div className="absolute -top-1 -right-1 bg-[#1A0A00] text-[#C9963A] text-[7px] px-1 rounded-full font-bold border border-[#C9963A]">
            -1
          </div>
        </motion.button>
      </div>

      {/* MODAL VIRTUAL TRY-ON */}
      <AnimatePresence>
        {showVirtualTryOnModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-8"
            style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(12px)" }}
            onClick={() => setShowVirtualTryOnModal(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="w-full max-w-sm rounded-[2.5rem] p-8 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
                border: "2px solid rgba(201,150,58,0.5)",
                boxShadow: "0 0 60px rgba(201,150,58,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.1, duration: 0.5 }} className="text-5xl mb-4">🧖‍♀️</motion.div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#2C1A0E" }}>
                Bientôt disponible
              </span>
              <h2 className="text-2xl font-black text-white mt-3 mb-2 leading-tight">Virtual Try-On ✨</h2>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Vois-toi <span className="text-[#C9963A] font-bold">réellement</span> avec la coiffure — disponible très bientôt !
              </p>
              <div className="flex flex-col gap-3 mb-6">
                {[
                  { icon: "📸", text: "Rendu sur mesure sur ton selfie" },
                  { icon: "🎨", text: "Rendu réaliste en quelques secondes" },
                  { icon: "💾", text: "Sauvegarde & partage facilement" },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-left">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-white/70 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => setShowVirtualTryOnModal(false)}
                className="w-full py-4 rounded-2xl font-black text-[#2C1A0E] text-base"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
                J'ai hâte ! 🔥
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center backdrop-blur-xl"
            style={{ padding: "16px", paddingBottom: "96px" }}
            onClick={() => setZoomImage(null)}
          >
            <div className="flex flex-col items-center w-full max-w-sm gap-4" onClick={(e) => e.stopPropagation()}>
              {/* Bouton fermeture lightbox */}
              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                onClick={() => setZoomImage(null)}
                className="self-end flex items-center justify-center w-10 h-10 rounded-full font-black text-lg"
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  color: "#fff",
                }}
              >
                ✕
              </motion.button>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full relative">
                <img src={zoomImage} alt="Zoom"
                  className="w-full rounded-3xl shadow-2xl border border-white/10"
                  draggable={false} onContextMenu={(e) => e.preventDefault()}
                  style={{ objectFit: "cover", maxHeight: "52vh", userSelect: "none", WebkitUserSelect: "none" }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

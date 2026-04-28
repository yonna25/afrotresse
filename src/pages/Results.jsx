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
    const COLORS = ["#C9963A", "#E8B96A", "#FAF4EC", "#FFFFFF", "#FFD700", "#A87B28", "#FFF0C0"];

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
          ctx.beginPath();
          ctx.arc(this.x - this.vx * 2, this.y - this.vy * 2, this.size * 0.6, 0, Math.PI * 2); ctx.fill();
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
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      if (particles.length > 0 || !finished) { animId = requestAnimationFrame(animate); }
      else { onDone?.(); }
    };
    animate();
    const doneTimer = setTimeout(() => { finished = true; }, 3200);
    return () => { timers.forEach(clearTimeout); clearTimeout(doneTimer); cancelAnimationFrame(animId); };
  }, [onDone]);

  return (
    <>
      <Seo title="Tes résultats — AfroTresse" noindex />
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999, width: "100%", height: "100%" }} />
    </>
  );
}

// ─── Popup Miroir Virtuel (Exclusivité AfroTresse) ──────────────────────────
const VirtualTryOnPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const whatsappGroupLink = "https://chat.whatsapp.com/VOTRE_LIEN_GROUPE_WHATSAPP";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-[#FAF4EC] border-2 border-[#C9963A] w-full max-w-md rounded-2xl p-10 shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-[#2C1A0E]/40 hover:text-[#2C1A0E]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center text-[#2C1A0E]">
          <span className="text-[#C9963A] text-[11px] tracking-[0.4em] uppercase font-bold mb-6 block">Exclusivité AfroTresse</span>
          <h2 className="text-3xl font-serif mb-2 italic">Votre Miroir Virtuel</h2>
          <p className="text-[#C9963A] font-semibold text-lg mb-8 tracking-wide">Bientôt disponible.</p>
          <div className="space-y-6 mb-10">
            <p className="text-base leading-relaxed">Essayez vos tresses en un instant avant de passer au salon.</p>
            <p className="text-sm italic font-medium">Rejoignez notre liste d'attente exclusive pour être informée les premiers.</p>
          </div>
          <a href={whatsappGroupLink} target="_blank" rel="noopener noreferrer" 
             className="inline-flex w-full items-center justify-center bg-[#C9963A] hover:bg-[#2C1A0E] text-white text-sm font-bold py-5 rounded-lg shadow-xl transition-all duration-300 uppercase tracking-widest">
            REJOINDRE LE CERCLE SUR WHATSAPP
          </a>
        </div>
      </div>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Results() {
  const navigate = useNavigate();
  const [faceShape, setFaceShape]     = useState("oval");
  const [selfieUrl, setSelfieUrl]     = useState(null);
  const [styles, setStyles]           = useState([]);
  const [credits, setCredits]         = useState(getCredits());
  const [zoomImage, setZoomImage]     = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [showVirtualTryOnModal, setShowVirtualTryOnModal] = useState(false);
  
  const [stableMsg, setStableMsg]     = useState({ headline: "Voici tes résultats ✨", subtext: "" });
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("afrotresse_user_name") || "");
  const { isFav, toggleFav, FREE_LIMIT } = useFavorites();
  const [currentPage, setCurrentPage]     = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));
  
  const [styleStats] = useState(() => {
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
        const sessionId   = getOrCreateSessionId();
        const shape       = parsed.faceShape || "oval";
        const name        = localStorage.getItem("afrotresse_user_name") || "";
        setStableMsg(generateStableMessage({ faceShape: shape, sessionId, name, confidence: parsed.confidence ?? 0.5 }));
      } catch (e) { console.error("Error parsing results:", e); }
    }
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    syncCreditsFromServer().then(c => setCredits(c)).catch(() => setCredits(getCredits()));
  }, []);

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
    const shuffled = getShuffledStyles(baseSeed);
    const start = ((page - 1) * STYLES_PER_PAGE) % total;
    const result = [];
    for (let i = 0; i < STYLES_PER_PAGE; i++) {
      result.push(shuffled[(start + i) % total]);
    }
    return result;
  };

  const displayedStyles = getPageStyles(currentPage);

  const handleGenerateMore = async () => {
    if (credits === 0) { navigate("/credits"); return; }
    const ok = await consumeCredits(1);
    if (!ok) { navigate("/credits"); return; }
    setCredits(getCredits());
    const nextPage = unlockedPages + 1;
    setUnlockedPages(nextPage);
    setCurrentPage(nextPage);
    localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
    localStorage.setItem("afrotresse_current_page", String(nextPage));
    setShowFireworks(true);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const totalPages = styles.length > 0 ? Math.ceil(styles.length / STYLES_PER_PAGE) : 1;
  const allStylesSeen = unlockedPages >= totalPages && unlockedPages > 1;
  const [showCatalogueEnd, setShowCatalogueEnd] = useState(false);

  useEffect(() => {
    if (styles.length > 0 && allStylesSeen) { setShowCatalogueEnd(true); }
  }, [unlockedPages, styles.length, allStylesSeen]);

  const handleDiscoverMore = async () => {
    if (credits <= 0) { navigate("/credits"); return; }
    const ok = await consumeCredits(1);
    if (!ok) { navigate("/credits"); return; }
    setCredits(getCredits());
    setUnlockedPages(1);
    setCurrentPage(1);
    setShowCatalogueEnd(false);
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

  if (!styles.length) {
    return (
      <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] flex flex-col relative overflow-hidden">
        <div className="relative h-52 overflow-hidden bg-[#1A0A00] flex items-center justify-center">
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(160deg, rgba(201,150,58,0.15) 0%, rgba(44,26,14,0.7) 100%)" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }} className="text-5xl mb-3">👑</motion.div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-white font-black text-2xl text-center px-4 leading-tight">Ton visage,<br /><span className="text-[#C9963A]">tes styles ✨</span></motion.p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: "linear-gradient(to bottom, transparent, #1A0A00)" }} />
        </div>

        <div className="flex flex-col flex-1 px-5 pt-2 pb-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-5">
            <h2 className="text-xl font-black text-white mb-2">Découvre les tresses adaptées à ton visage 💛</h2>
            <p className="text-[12px] text-white/50 leading-relaxed">Un selfie suffit pour trouver la coiffure qui te correspond.</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-col gap-3 mb-8">
            {[{ icon: "📸", label: "Prends un selfie", sub: "Ou uploade une photo existante" }, { icon: "🔍", label: "Lecture de visage", sub: "Tes proportions analysées en secondes" }, { icon: "✨", label: "Styles personnalisés", sub: "3 recommandations taillées pour toi" }].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <span className="text-2xl">{step.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white leading-none">{step.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{step.sub}</p>
                </div>
                <div className="ml-auto w-6 h-6 rounded-full bg-[#C9963A]/20 border border-[#C9963A]/40 flex items-center justify-center">
                  <span className="text-[#C9963A] text-[10px] font-black">{i + 1}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} onClick={() => navigate("/camera")} className="w-full py-5 rounded-2xl font-black text-lg text-[#2C1A0E] shadow-2xl" style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", boxShadow: "0 0 30px rgba(201,150,58,0.4)" }}>📸 Prendre mon selfie</motion.button>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center text-[10px] text-white/30 mt-3">2 crédits offerts • Aucune inscription requise</motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">
      <Seo title="Tes résultats — AfroTresse" />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}
      <div ref={topRef} />

      {errorMsg && (
        <motion.div ref={errorRef} className="mb-4 px-5 py-3 rounded-2xl bg-red-900/30 border border-red-500/30 text-red-300 text-[11px] font-bold text-center">
          {errorMsg}
        </motion.div>
      )}

      <motion.div className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10" style={{ boxShadow: "0 0 40px rgba(201,150,58,0.2)" }}>
        <div className="relative shrink-0">
          {selfieUrl ? (
            <ProtectedImg src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-white/50">Photo</div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md uppercase">Moi</div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="font-bold text-lg sm:text-2xl text-[#C9963A] leading-tight break-words">
            {displayName ? <><span className="block">Voici tes résultats</span><span className="text-white">{displayName}</span> ✨</> : stableMsg.headline}
          </h1>
          <p className="text-[11px] opacity-80 leading-snug mt-1.5">{stableMsg.subtext}</p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {
          const styleId = style.id?.replace(/-/g, "");
          const isFavorited = isFav(style.id);
          const stats = styleStats[style.id] || { views: 124, likes: 48 };

          return (
            <motion.div key={style.id || index} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <ProtectedImg src={style.views?.face || `/styles/${styleId}-face.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.face || `/styles/${styleId}-face.webp`)} alt={style.name} />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <ProtectedImg src={style.views?.back || `/styles/${styleId}-back.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.back || `/styles/${styleId}-back.webp`)} />
                  <ProtectedImg src={style.views?.top || `/styles/${styleId}-top.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.top || `/styles/${styleId}-top.webp`)} />
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-xl leading-none mb-1">{style.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] opacity-40 uppercase tracking-tighter">
                      <span>👁️ {stats.views}</span>
                      <span>❤️ {stats.likes}</span>
                    </div>
                  </div>
                  <button onClick={() => handleToggleFav(style)} className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90" style={{ background: isFavorited ? "rgba(201,150,58,0.2)" : "rgba(255,255,255,0.05)", border: isFavorited ? "1px solid #C9963A" : "1px solid rgba(255,255,255,0.1)" }}>
                    {isFavorited ? "❤️" : "🤍"}
                  </button>
                </div>
                <p className="text-[11px] opacity-60 leading-relaxed mb-6 h-12 overflow-hidden">{style.description}</p>
                <button
                  onClick={() => setShowVirtualTryOnModal(true)}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  "✨ Essayer virtuellement"
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {unlockedPages < totalPages && (
        <div className="mt-12 mb-4">
          <button onClick={handleGenerateMore} className="w-full py-6 rounded-[2rem] font-black text-[#2C1A0E] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden" style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
            <span className="text-lg">✨ Voir 3 autres styles</span>
            <div className="bg-[#2C1A0E]/10 px-2 py-1 rounded-lg text-[9px] uppercase">-1 Crédit</div>
          </button>
        </div>
      )}

      <div className="fixed bottom-24 right-4 z-40">
        <div onClick={() => navigate("/credits")} className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-lg flex flex-col items-center justify-center shadow-lg border border-[#2C1A0E]/20 cursor-pointer">
          <div className="text-[5px] font-black uppercase opacity-60 leading-tight">Solde</div>
          <div className="text-xl font-black leading-none">{credits}</div>
        </div>
      </div>

      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div className="relative max-w-full max-h-full">
              <ProtectedImg src={zoomImage} className="max-w-full max-h-[85dvh] rounded-3xl shadow-2xl object-contain border border-white/10" alt="Zoom" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <VirtualTryOnPopup isOpen={showVirtualTryOnModal} onClose={() => setShowVirtualTryOnModal(false)} />
    </div>
  );
}

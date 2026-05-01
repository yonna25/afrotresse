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
          ctx.arc(this.x - this.vx * 2, this.y - this.vy * 2, this.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const particles = [];
    const BURSTS = [
      { x: W * 0.2,  y: H * 0.28, delay: 0   },
      { x: W * 0.8,  y: H * 0.22, delay: 180 },
      { x: W * 0.5,  y: H * 0.15, delay: 350 },
      { x: W * 0.15, y: H * 0.5,  delay: 520 },
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

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }} />;
}

// ─── Modal Miroir Virtuel ───────────────────────────────────────────────────
const VirtualTryOnPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#FAF4EC] border-2 border-[#C9963A] w-full max-w-md rounded-[2.5rem] p-10 relative text-center">
        <button onClick={onClose} className="absolute top-6 right-6 text-2xl">✕</button>
        <span className="text-[#C9963A] text-[10px] tracking-[0.3em] font-black uppercase mb-4 block">Bientôt disponible</span>
        <h2 className="font-serif text-3xl text-[#2C1A0E] mb-6 italic">Miroir Virtuel</h2>
        <p className="text-sm text-[#2C1A0E]/60 leading-relaxed mb-8">Essayez vos tresses en un instant grâce à notre IA. Rejoignez la liste d'attente pour être avertie.</p>
        <button className="w-full py-4 bg-[#C9963A] text-white rounded-2xl font-black text-[10px] tracking-widest uppercase">Rejoindre le cercle</button>
      </div>
    </div>
  );
};

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles]               = useState([]);
  const [selfieUrl, setSelfieUrl]         = useState(null);
  const [credits, setCredits]             = useState(null);
  const [zoomImage, setZoomImage]         = useState(null);
  const [errorMsg, setErrorMsg]           = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [showVirtualTryOnModal, setShowVirtualTryOnModal] = useState(false);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [stableMsg, setStableMsg]         = useState({ headline: "", subtext: "" });
  const [displayName]                     = useState(() => localStorage.getItem("afrotresse_user_name") || "");

  const { isFav, toggleFav, FREE_LIMIT } = useFavorites();
  const [currentPage, setCurrentPage]     = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));

  const topRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStyles(parsed.recommendations || []);
        const name = localStorage.getItem("afrotresse_user_name") || "";
        setStableMsg(generateStableMessage({ faceShape: parsed.faceShape, sessionId: getOrCreateSessionId(), name, confidence: 0.9 }));
        if (sessionStorage.getItem("afrotresse_trigger_fireworks")) {
          setShowFireworks(true);
          sessionStorage.removeItem("afrotresse_trigger_fireworks");
        }
      } catch (e) { console.error(e); }
    }
    setSelfieUrl(sessionStorage.getItem("afrotresse_photo"));
    setCredits(getCredits());
    syncCreditsFromServer().then(setCredits);
  }, []);

  const getPageStyles = (page) => {
    const start = (page - 1) * STYLES_PER_PAGE;
    return styles.slice(start, start + STYLES_PER_PAGE);
  };

  const displayedStyles = getPageStyles(currentPage);
  const totalPages      = Math.ceil(styles.length / STYLES_PER_PAGE);
  const hasMorePages    = unlockedPages < totalPages;

  const handleGenerateMore = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setErrorMsg("");

    const currentC = getCredits();
    if (currentC <= 0) {
      setErrorMsg("💎 Plus de crédits — recharge pour voir d'autres styles !");
      setIsGenerating(false);
      return;
    }

    if (consumeCredits(1)) {
      setCredits(getCredits());
      const next = unlockedPages + 1;
      setUnlockedPages(next);
      setCurrentPage(next);
      localStorage.setItem("afrotresse_unlocked_pages", String(next));
      localStorage.setItem("afrotresse_current_page", String(next));
      setShowFireworks(true);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setIsGenerating(false);
  };

  const goToPage = (p) => {
    setCurrentPage(p);
    localStorage.setItem("afrotresse_current_page", String(p));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!styles.length) return <div className="p-20 text-center text-white">Analyse en cours...</div>;

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">
      <Seo title="Tes résultats — AfroTresse" />
      <div ref={topRef} />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}

      {/* ERROR MSG */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6 p-4 bg-[#C9963A]/10 border border-[#C9963A]/30 rounded-2xl text-center">
            <p className="text-[#C9963A] text-xs font-bold mb-3">{errorMsg}</p>
            <button onClick={() => navigate("/credits")} className="bg-[#C9963A] text-[#1A0A00] px-6 py-2 rounded-xl text-[10px] font-black uppercase">Recharger</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="mb-10 flex gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="relative">
          <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#1A0A00] text-[8px] font-black px-2 py-1 rounded">MOI</div>
        </div>
        <div>
          <h1 className="font-bold text-xl text-[#C9963A]">{displayName ? `Résultats pour ${displayName}` : stableMsg.headline}</h1>
          <p className="text-[10px] opacity-60 mt-1">{stableMsg.subtext}</p>
        </div>
      </div>

      {/* STYLES */}
      <div className="flex flex-col gap-10">
        {displayedStyles.map((style, idx) => (
          <motion.div key={style.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-[#2C1A0E] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="grid grid-cols-3 h-72 gap-0.5 bg-black/20">
              <div className="col-span-2"><ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-face.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-face.webp`)} /></div>
              <div className="grid grid-rows-2 gap-0.5">
                <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-back.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-back.webp`)} />
                <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-top.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-top.webp`)} />
              </div>
            </div>
            <div className="p-8 text-center">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black text-[#C9963A] uppercase tracking-widest">Sur-Mesure</span>
                <button onClick={() => toggleFav(style)} className="text-xl">{isFav(style.id) ? "❤️" : "🤍"}</button>
              </div>
              <h2 className="text-2xl font-bold mb-3">{style.name}</h2>
              <p className="text-xs opacity-50 mb-8 px-4 leading-relaxed">{style.description}</p>
              <button onClick={() => setShowVirtualTryOnModal(true)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#C9963A]">✨ Essai Virtuel</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PAGINATION & GENERATE */}
      <div className="mt-16 flex flex-col items-center gap-8">
        {hasMorePages ? (
          <button onClick={handleGenerateMore} disabled={isGenerating} className="flex flex-col items-center group">
            <div className="bg-gradient-to-br from-[#C9963A] to-[#A87B28] p-6 rounded-full shadow-2xl mb-4 group-active:scale-90 transition-transform">
              <span className="text-3xl">🪄</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C9963A]">Voir d'autres styles</span>
            <span className="text-[9px] opacity-40 mt-1">1 Crédit</span>
          </button>
        ) : (
          <div className="text-center opacity-40 text-[10px] uppercase tracking-widest">Fin des recommandations</div>
        )}

        <div className="flex gap-3">
          {Array.from({ length: unlockedPages }).map((_, i) => (
            <button key={i} onClick={() => goToPage(i + 1)} className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? "bg-[#C9963A] text-[#1A0A00]" : "bg-white/5 text-white/30"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <VirtualTryOnPopup isOpen={showVirtualTryOnModal} onClose={() => setShowVirtualTryOnModal(false)} />
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-6">
            <img src={zoomImage} className="max-w-full max-h-full rounded-2xl" alt="Zoom" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

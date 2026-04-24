import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { getCredits, consumeCredits, syncCreditsFromServer } from "../services/credits.js";
import Seo from "../components/Seo.jsx";
import {
  generateStableMessage,
  getOrCreateSessionId,
  resetMessageAssignment,
} from "../services/stableMessage.js";
import { useFavorites } from "../hooks/useFavorites.js";

const STYLES_PER_PAGE = 3;

const ProtectedImg = ({ src, alt, className, onClick }) => (
  <div className="relative w-full h-full" onClick={onClick}>
    <img src={src} alt={alt} className={className}
      draggable={false} onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none" }} 
      onError={(e) => {
        // Sécurité si l'URL expire : on tente de recharger ou on met un placeholder
        e.target.src = "/logo.png"; 
        e.target.className = className + " opacity-20 grayscale";
      }}
    />
    <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
  </div>
);

function Fireworks({ onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const COLORS = ["#C9963A", "#E8B96A", "#FAF4EC", "#FFFFFF", "#FFD700"];
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
      }
      update() { this.x += this.vx; this.y += this.vy; this.vy += 0.09; this.vx *= 0.98; this.life -= this.decay; }
      draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
      }
    }
    const particles = [];
    const BURSTS = [{ x: W * 0.5, y: H * 0.3, delay: 0 }, { x: W * 0.2, y: H * 0.4, delay: 200 }];
    const timers = BURSTS.map(b => setTimeout(() => { for (let i = 0; i < 60; i++) particles.push(new Particle(b.x, b.y)); }, b.delay));
    let animId, finished = false;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      if (particles.length > 0 || !finished) animId = requestAnimationFrame(animate);
      else onDone?.();
    };
    animate();
    const doneTimer = setTimeout(() => { finished = true; }, 3000);
    return () => { timers.forEach(clearTimeout); clearTimeout(doneTimer); cancelAnimationFrame(animId); };
  }, [onDone]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }} />;
}

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [stableMsg, setStableMsg] = useState({ headline: "Voici tes résultats ✨", subtext: "" });
  const [selfieUrl, setSelfieUrl] = useState(sessionStorage.getItem("afrotresse_photo"));
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("afrotresse_user_name") || "");

  const { isFav, toggleFav } = useFavorites();
  const [currentPage, setCurrentPage] = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));

  const topRef = useRef(null);
  const soldeRef = useRef(null);
  const userName = localStorage.getItem("afrotresse_user_name") || "Reine";

  useEffect(() => {
    if (location.hash === "#solde") {
      setTimeout(() => {
        soldeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 600);
    }

    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const recs = parsed.recommendations || [];
        setStyles(recs);
        if (sessionStorage.getItem("afrotresse_trigger_fireworks")) {
          setShowFireworks(true);
          sessionStorage.removeItem("afrotresse_trigger_fireworks");
          resetMessageAssignment();
        }
        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape || "oval", 
          sessionId: getOrCreateSessionId(),
          name: localStorage.getItem("afrotresse_user_name") || ""
        }));
      } catch (e) { console.error("Data error", e); }
    }
    syncCreditsFromServer().then(c => setCredits(c));
  }, [location]);

  const getShuffledStyles = (seedNum) => {
    const seeded = (s) => () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    const rand = seeded(seedNum);
    const arr = [...styles];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const getPageStyles = (page) => {
    if (!styles.length) return [];
    const baseSeed = userName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 12345);
    const shuffled = getShuffledStyles(baseSeed);
    const start = ((page - 1) * STYLES_PER_PAGE) % shuffled.length;
    return shuffled.slice(start, start + STYLES_PER_PAGE);
  };

  const displayedStyles = getPageStyles(currentPage);
  const totalPages = Math.ceil(styles.length / STYLES_PER_PAGE);

  const handleGenerateMore = async () => {
    if (credits <= 0) { 
      navigate("/credits#solde"); 
      return; 
    }
    const success = await consumeCredits(1);
    if (success) {
      const nextP = unlockedPages + 1;
      setUnlockedPages(nextP);
      setCurrentPage(nextP);
      localStorage.setItem("afrotresse_unlocked_pages", String(nextP));
      localStorage.setItem("afrotresse_current_page", String(nextP));
      setCredits(getCredits());
      setShowFireworks(true);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    localStorage.setItem("afrotresse_current_page", String(page));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 pb-40 relative overflow-x-hidden font-sans">
      <Seo title="Tes résultats — AfroTresse" />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}
      <div ref={topRef} />

      {/* HEADER */}
      <div className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="relative shrink-0">
          <ProtectedImg src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[8px] font-black px-2 py-1 rounded-md uppercase">Moi</div>
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-bold text-lg text-[#C9963A] leading-tight">
            {displayName ? `Voici tes résultats ${displayName} ✨` : stableMsg.headline}
          </h1>
          <p className="text-[11px] opacity-70 mt-1">{stableMsg.subtext}</p>
        </div>
      </div>

      {/* LISTE DES STYLES */}
      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {
          const styleId = style.id?.replace(/-/g, "");
          return (
            <motion.div key={style.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <ProtectedImg src={style.views?.face || `/styles/${styleId}-face.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.face || `/styles/${styleId}-face.webp`)} alt="Face" />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <ProtectedImg src={style.views?.back || `/styles/${styleId}-back.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.back || `/styles/${styleId}-back.webp`)} />
                  <ProtectedImg src={style.views?.top || `/styles/${styleId}-top.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.top || `/styles/${styleId}-top.webp`)} />
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-xl">{style.name}</h3>
                  <button onClick={() => toggleFav(style)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90">
                    {isFav(style.id) ? "❤️" : "🤍"}
                  </button>
                </div>
                <p className="text-[11px] opacity-60 leading-relaxed">{style.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* BOUTON "VOIR PLUS" RÉDUIT ET AFFINÉ */}
      {unlockedPages < totalPages && (
        <div className="mt-12 mb-8 px-8">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerateMore} 
            className="relative w-full py-4 rounded-full font-black text-[#2C1A0E] shadow-xl flex items-center justify-center gap-3 overflow-hidden group"
            style={{ background: "linear-gradient(135deg, #C9963A 0%, #F3D082 50%, #C9963A 100%)" }}
          >
            <span className="text-sm uppercase tracking-widest">Voir 3 autres styles</span>
            <div className="bg-[#2C1A0E]/20 px-2 py-0.5 rounded text-[9px] font-black">-1 CRÉDIT</div>
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
          </motion.button>
        </div>
      )}

      {/* PAGINATION ÉPURÉE */}
      {unlockedPages > 1 && (
        <div className="mt-10 mb-6 flex flex-col items-center gap-5">
          <div className="flex items-center gap-4">
            <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${currentPage === 1 ? 'border-white/5 text-white/10' : 'border-[#C9963A]/30 text-[#C9963A] active:scale-90'}`}>
              ‹
            </button>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              {Array.from({ length: unlockedPages }, (_, i) => i + 1).map((p) => (
                <div key={p} className="flex items-center">
                  <button onClick={() => goToPage(p)} className={`text-sm font-bold ${p === currentPage ? "text-[#C9963A] scale-125 px-2" : "text-white/20 px-1"}`}>{p}</button>
                  {p < unlockedPages && <span className="text-white/10 text-[8px] mx-1">•</span>}
                </div>
              ))}
            </div>
            <button disabled={currentPage === unlockedPages} onClick={() => goToPage(currentPage + 1)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${currentPage === unlockedPages ? 'border-white/5 text-white/10' : 'border-[#C9963A]/30 text-[#C9963A] active:scale-90'}`}>
              ›
            </button>
          </div>
        </div>
      )}

      {/* BOUTONS FLOTTANTS */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-center gap-3">
        <div ref={soldeRef} onClick={() => navigate("/credits#solde")} className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-xl flex flex-col items-center justify-center shadow-2xl border border-[#2C1A0E]/20 cursor-pointer active:scale-90">
          <span className="text-[6px] font-black uppercase opacity-60">Solde</span>
          <span className="text-xl font-black leading-none">{credits}</span>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleGenerateMore} className="w-12 h-12 rounded-xl shadow-2xl flex flex-col items-center justify-center border border-white/10" style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
          <span className="text-[7px] font-black text-[#2C1A0E] uppercase mb-1">Générer</span>
          <span className="text-xl">✨</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 text-center">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative max-w-full">
              <ProtectedImg src={zoomImage} className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border border-white/10 object-contain" />
              <button className="absolute -top-12 right-0 text-white/50 text-xs font-bold uppercase tracking-widest">Fermer</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

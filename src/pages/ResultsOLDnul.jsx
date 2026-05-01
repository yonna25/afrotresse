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

// ─── Popup Miroir Virtuel ────────────────────────────────────────────────────
const VirtualTryOnPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-[#FAF4EC] border-2 border-[#C9963A] w-full max-w-md rounded-2xl p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-[#2C1A0E]/40">✕</button>
        <div className="text-center text-[#2C1A0E]">
          <span className="text-[#C9963A] text-[11px] uppercase font-bold mb-6 block">Bientôt disponible</span>
          <h2 className="text-3xl font-serif mb-2 italic">Miroir Virtuel</h2>
          <p className="leading-relaxed mb-10 text-sm">Essayez vos tresses en un instant grâce à l'IA.</p>
          <button onClick={onClose} className="w-full bg-[#C9963A] text-white py-4 rounded-lg font-black uppercase text-[10px]">Fermer</button>
        </div>
      </div>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles]           = useState([]);
  const [credits, setCredits]         = useState(getCredits());
  const [zoomImage, setZoomImage]     = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showVirtualTryOnModal, setShowVirtualTryOnModal] = useState(false);
  const [stableMsg, setStableMsg]     = useState({ headline: "Voici tes résultats ✨", subtext: "" });
  const { favorites, isFav, toggleFav } = useFavorites();
  const [currentPage, setCurrentPage]     = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));

  const topRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStyles(parsed.recommendations || []);
        const sessionId = getOrCreateSessionId();
        setStableMsg(generateStableMessage({ 
            faceShape: parsed.faceShape || "oval", 
            sessionId, 
            name: localStorage.getItem("afrotresse_user_name") || "", 
            confidence: parsed.confidence ?? 0.5 
        }));
      } catch (e) { console.error("Erreur parsing:", e); }
    }

    syncCreditsFromServer().then(c => { if (c !== undefined) setCredits(c); });
  }, []);

  // LOGIQUE DE DÉFALCATION (Le cœur du problème)
  const handleGenerateMore = async () => {
    const freshCredits = getCredits();
    
    if (freshCredits <= 0) {
      navigate("/credits");
      return;
    }

    // Défalcation dans Supabase
    const ok = await consumeCredits(1);
    
    if (ok) {
        // Mise à jour immédiate de l'affichage du solde
        setCredits(getCredits());

        // Déblocage de la page suivante
        const nextPage = unlockedPages + 1;
        setUnlockedPages(nextPage);
        setCurrentPage(nextPage);
        
        // Sauvegarde de la progression
        localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
        localStorage.setItem("afrotresse_current_page", String(nextPage));
        
        setShowFireworks(true);
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
        // En cas d'erreur de synchro, on vérifie le serveur une dernière fois
        const synced = await syncCreditsFromServer().catch(() => 0);
        setCredits(synced);
        if (synced <= 0) navigate("/credits");
    }
  };

  const totalPages = styles.length > 0 ? Math.ceil(styles.length / STYLES_PER_PAGE) : 1;
  const displayedStyles = styles.slice((currentPage - 1) * STYLES_PER_PAGE, currentPage * STYLES_PER_PAGE);

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 pb-40 relative">
      <Seo title="Tes résultats — AfroTresse" />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}
      <div ref={topRef} />

      <div className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <h1 className="font-bold text-lg text-[#C9963A] leading-tight flex-1">
          {stableMsg.headline}
        </h1>
      </div>

      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => (
          <motion.div key={style.id || index} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20">
            <div className="h-72">
              <ProtectedImg src={style.views?.face} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.face)} />
            </div>
            <div className="p-6 text-center">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl">{style.name}</h3>
                <button onClick={() => toggleFav(style)} className="text-xl">{isFav(style.id) ? "❤️" : "🤍"}</button>
              </div>
              <p className="text-[11px] opacity-60 mb-6">{style.description}</p>
              <button onClick={() => setShowVirtualTryOnModal(true)} className="w-full py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase">Essayer virtuellement</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* BOUTON FIXE SOUS LES RÉSULTATS */}
      {unlockedPages < totalPages && (
        <button
          onClick={handleGenerateMore}
          className="w-full mt-8 py-5 rounded-2xl font-bold text-sm text-[#2C1A0E] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
        >
          <span>✨ Voir 3 autres styles</span>
          <span className="bg-[#2C1A0E]/20 px-2 py-0.5 rounded-full text-xs">1 crédit</span>
        </button>
      )}

      {/* BOUTON FLOTTANT GÉNÉRER (Sync avec la défalcation) */}
      <AnimatePresence>
        {unlockedPages < totalPages && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={handleGenerateMore}
            className="fixed bottom-32 right-6 z-[100] w-16 h-16 bg-[#C9963A] rounded-full shadow-2xl flex flex-col items-center justify-center border-4 border-[#1A0A00] active:scale-90"
          >
            <span className="text-xl">✨</span>
            <span className="text-[7px] font-black uppercase text-[#1A0A00] mt-1">Générer</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* BOUTON FLOTTANT SOLDE */}
      <div className="fixed bottom-24 right-4 z-[60]">
        <div onClick={() => navigate("/credits")} className="w-12 h-12 bg-[#FAF4EC] text-[#2C1A0E] rounded-lg flex flex-col items-center justify-center shadow-lg border border-[#C9963A]/30">
          <div className="text-[5px] font-black uppercase opacity-60">Solde</div>
          <div className="text-xl font-black leading-none">{credits}</div>
        </div>
      </div>

      <VirtualTryOnPopup isOpen={showVirtualTryOnModal} onClose={() => setShowVirtualTryOnModal(false)} />

      {zoomImage && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4" onClick={() => setZoomImage(null)}>
          <ProtectedImg src={zoomImage} className="max-w-full max-h-[80vh] rounded-3xl object-contain" />
        </div>
      )}
    </div>
  );
}

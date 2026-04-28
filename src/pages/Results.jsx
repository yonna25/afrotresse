import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, hasCredits, syncCreditsFromServer } from "../services/credits.js";
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
        particles[i].update();
        particles[i].draw();
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
    <>
      <Seo title="Tes résultats — AfroTresse" noindex />
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999, width: "100%", height: "100%" }} />
    </>
  );
}

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
  const [isTesting, setIsTesting]     = useState(false); // État pour le test IA
  const [stableMsg, setStableMsg]     = useState({ headline: "Voici tes résultats ✨", subtext: "" });
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("afrotresse_user_name") || "");

  const { favorites, count: favCount, isFav, toggleFav, canAddMore, FREE_LIMIT } = useFavorites();

  const [currentPage, setCurrentPage]     = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));

  const [styleStats, setStyleStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("afrotresse_style_stats") || "{}"); }
    catch { return {}; }
  });

  const topRef   = useRef(null);
  const userName = localStorage.getItem("afrotresse_user_name") || "Reine";

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFaceShape(parsed.faceShape || "oval");
        const recs = parsed.recommendations || [];
        setStyles(recs);
        if (recs.length > 0 && sessionStorage.getItem("afrotresse_trigger_fireworks")) {
          setShowFireworks(true);
          sessionStorage.removeItem("afrotresse_trigger_fireworks");
          resetMessageAssignment();
        }
        const sessionId = getOrCreateSessionId();
        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape || "oval", 
          sessionId, 
          name: localStorage.getItem("afrotresse_user_name") || "", 
          confidence: parsed.confidence ?? 0.5 
        }));
      } catch (e) { console.error("Error parsing results:", e); }
    }
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    syncCreditsFromServer().then(c => setCredits(c)).catch(() => setCredits(getCredits()));
  }, []);

  // FONCTION DE TEST IA CONNECTÉE
  const handleTestTryOn = async (style) => {
    if (!selfieUrl) return alert("Aucun selfie trouvé.");
    setIsTesting(true);
    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `${style.name}: ${style.description}`,
          image: selfieUrl 
        })
      });

      const data = await res.json();
      if (res.ok && data.image) {
        setZoomImage(data.image); // Affiche le résultat dans le zoom
      } else {
        alert("L'IA prépare encore le modèle. Réessaie dans 30 secondes.");
      }
    } catch (err) {
      alert("Erreur de connexion");
    } finally {
      setIsTesting(false);
    }
  };

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
  const totalPages = styles.length > 0 ? Math.ceil(styles.length / STYLES_PER_PAGE) : 1;

  const handleToggleFav = (style) => {
    const result = toggleFav(style);
    if (result && !result.success && result.reason === "limit_reached") {
      setErrorMsg(`💎 Limite de ${FREE_LIMIT} favoris atteints !`);
    }
  };

  if (!styles.length) return null; // Ou chargement

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">
      <Seo title="Tes résultats — AfroTresse" />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}
      <div ref={topRef} />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="relative shrink-0">
          <ProtectedImg src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md uppercase">Moi</div>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="font-bold text-lg sm:text-2xl text-[#C9963A] leading-tight">
            {displayName ? <><span className="block">Voici tes résultats</span><span className="text-white">{displayName}</span> ✨</> : stableMsg.headline}
          </h1>
        </div>
      </motion.div>

      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {
          const styleId = style.id?.replace(/-/g, "");
          const isFavorited = isFav(style.id);
          const stats = styleStats[style.id] || { views: 124, likes: 48 };

          return (
            <motion.div key={style.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <ProtectedImg src={style.views?.face || `/styles/${styleId}-face.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.face || `/styles/${styleId}-face.webp`)} />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <ProtectedImg src={style.views?.back || `/styles/${styleId}-back.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.back || `/styles/${styleId}-back.webp`)} />
                  <ProtectedImg src={style.views?.top || `/styles/${styleId}-top.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.top || `/styles/${styleId}-top.webp`)} />
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-xl mb-1">{style.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] opacity-40">
                      <span>👁️ {stats.views}</span>
                      <span>❤️ {stats.likes}</span>
                    </div>
                  </div>
                  <button onClick={() => handleToggleFav(style)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
                    {isFavorited ? "❤️" : "🤍"}
                  </button>
                </div>
                <p className="text-[11px] opacity-60 leading-relaxed mb-6">{style.description}</p>
                
                {/* BOUTON DE TEST CONNECTÉ */}
                <button 
                  onClick={() => handleTestTryOn(style)} 
                  disabled={isTesting}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
                >
                  {isTesting ? "⏳ Génération en cours..." : "🧪 TESTER LE RENDU IA"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Zoom partagé (utilisé aussi pour le résultat IA) */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative max-w-full max-h-full">
              <img src={zoomImage} className="max-w-full max-h-[85vh] rounded-3xl border border-white/10 object-contain" alt="Aperçu" />
              <p className="text-center text-white/50 text-[10px] mt-4 uppercase tracking-widest">Cliquer pour fermer</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

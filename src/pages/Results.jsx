import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase"; // Import indispensable pour l'orientation Supabase
import { getCredits, consumeCredits, syncCreditsFromServer } from "../services/credits.js";
import Seo from "../components/Seo.jsx";
import {
  generateStableMessage,
  getOrCreateSessionId,
  resetMessageAssignment,
} from "../services/stableMessage.js";
import { useFavorites } from "../hooks/useFavorites.js";

const STYLES_PER_PAGE = 3;

// ─── ProtectedImg (Restauration du style premium) ──────────────────────────────
const ProtectedImg = ({ src, alt, className, onClick }) => (
  <div className="relative w-full h-full overflow-hidden" onClick={onClick}>
    <img src={src} alt={alt} className={`${className} transition-transform duration-700 hover:scale-110`}
      draggable={false} onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none" }} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()} />
  </div>
);

// ─── Fireworks (Restauration du canvas) ────────────────────────────────────────
function Fireworks({ onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const COLORS = ["#C9963A", "#E8B96A", "#FFFFFF", "#FFD700"];

    class Particle {
      constructor(x, y) {
        this.x = x; this.y = y;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.size = Math.random() * 3 + 1;
      }
      update() { this.x += this.vx; this.y += this.vy; this.vy += 0.08; this.life -= this.decay; }
      draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
      }
    }

    let particles = [];
    const bursts = [{ x: W * 0.5, y: H * 0.3, d: 0 }, { x: W * 0.2, y: H * 0.4, d: 300 }, { x: W * 0.8, y: H * 0.35, d: 600 }];
    bursts.forEach(b => setTimeout(() => { for (let i = 0; i < 60; i++) particles.push(new Particle(b.x, b.y)); }, b.d));

    let anim;
    const run = () => {
      ctx.clearRect(0, 0, W, H);
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => { p.update(); p.draw(); });
      if (particles.length > 0) anim = requestAnimationFrame(run); else onDone?.();
    };
    run();
    return () => cancelAnimationFrame(anim);
  }, [onDone]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }} />;
}

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [credits, setCredits] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stableMsg, setStableMsg] = useState({ headline: "", subtext: "" });
  const [user, setUser] = useState(null);

  const { isFav, toggleFav } = useFavorites();
  const [currentPage, setCurrentPage] = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1"));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1"));

  const topRef = useRef(null);

  useEffect(() => {
    // 1. Détecter l'utilisateur Supabase
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // 2. Charger les résultats
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStyles(parsed.recommendations || []);
        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape, 
          sessionId: getOrCreateSessionId(), 
          name: localStorage.getItem("afrotresse_user_name") || "", 
          confidence: 0.9 
        }));
        if (sessionStorage.getItem("afrotresse_trigger_fireworks")) {
          setShowFireworks(true);
          sessionStorage.removeItem("afrotresse_trigger_fireworks");
        }
      } catch (e) { console.error(e); }
    }
    setSelfieUrl(sessionStorage.getItem("afrotresse_photo"));
    
    // 3. Sync Crédits
    setCredits(getCredits());
    syncCreditsFromServer().then(setCredits);
  }, []);

  const displayedStyles = styles.slice((currentPage - 1) * STYLES_PER_PAGE, currentPage * STYLES_PER_PAGE);
  const totalPages = Math.ceil(styles.length / STYLES_PER_PAGE);
  const hasMorePages = unlockedPages < totalPages;

  const handleGenerateMore = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    if (getCredits() <= 0) {
      setErrorMsg("💎 Solde insuffisant pour débloquer de nouveaux styles.");
      setIsGenerating(false);
      return;
    }
    if (consumeCredits(1)) {
      const next = unlockedPages + 1;
      setUnlockedPages(next);
      setCurrentPage(next);
      localStorage.setItem("afrotresse_unlocked_pages", String(next));
      localStorage.setItem("afrotresse_current_page", String(next));
      setCredits(getCredits());
      setShowFireworks(true);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] pb-40">
      <Seo title="Tes résultats — AfroTresse" />
      <div ref={topRef} />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}

      {/* HEADER LUXE */}
      <div className="p-6 pt-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-[#2C1A0E] to-[#1A0A00] p-6 rounded-[2.5rem] border border-[#C9963A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9963A]/5 blur-3xl rounded-full -mr-10 -mt-10" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="relative shrink-0">
              <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover shadow-xl" alt="Moi" />
              <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#1A0A00] text-[8px] font-black px-2 py-1 rounded shadow-lg">PROFIL</div>
            </div>
            <div className="min-w-0">
              <h1 className="text-[#C9963A] font-bold text-xl leading-tight">
                {user ? `Ravie de vous revoir` : `Voici vos styles ✨`}
              </h1>
              <p className="text-[10px] text-white/50 uppercase tracking-widest mt-1 font-medium">{stableMsg.headline}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* LISTE DES STYLES (Style Carte Premium) */}
      <div className="px-6 space-y-12">
        {displayedStyles.map((style, idx) => (
          <motion.div 
            key={style.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group bg-[#2C1A0E] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 hover:border-[#C9963A]/40"
          >
            {/* Grille d'images */}
            <div className="grid grid-cols-3 h-[320px] gap-1 bg-black/40 p-1">
              <div className="col-span-2 rounded-l-[2.5rem] overflow-hidden">
                <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-face.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-face.webp`)} />
              </div>
              <div className="grid grid-rows-2 gap-1">
                <div className="rounded-tr-[2.5rem] overflow-hidden">
                  <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-back.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-back.webp`)} />
                </div>
                <div className="rounded-br-[1rem] overflow-hidden">
                  <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-top.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-top.webp`)} />
                </div>
              </div>
            </div>

            {/* Infos Style */}
            <div className="p-8 relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[#C9963A] text-[9px] font-black uppercase tracking-[0.2em]">Recommandation IA</span>
                  <h2 className="text-2xl font-bold text-white mt-1">{style.name}</h2>
                </div>
                <button onClick={() => toggleFav(style)} className="p-3 bg-white/5 rounded-full active:scale-125 transition-transform">
                  {isFav(style.id) ? "❤️" : "🤍"}
                </button>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-8 line-clamp-3">{style.description}</p>
              <button className="w-full py-5 bg-gradient-to-r from-[#C9963A] to-[#A87B28] rounded-2xl text-[#1A0A00] font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#C9963A]/20 active:scale-[0.98] transition-all">
                ✨ Essai Virtuel Premium
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PAGINATION & CTA */}
      <div className="mt-20 flex flex-col items-center gap-8 px-6">
        {hasMorePages ? (
          <button onClick={handleGenerateMore} className="group relative flex flex-col items-center">
            <div className="absolute inset-0 bg-[#C9963A]/20 blur-3xl rounded-full group-hover:bg-[#C9963A]/40 transition-all" />
            <div className="relative bg-gradient-to-br from-[#C9963A] to-[#E8B96A] p-7 rounded-full shadow-2xl mb-4 group-active:scale-90 transition-transform">
              <span className="text-4xl text-[#1A0A00]">🪄</span>
            </div>
            <span className="text-[#C9963A] font-black text-xs uppercase tracking-[0.3em]">Découvrir 3 autres styles</span>
            <span className="text-[10px] text-white/30 mt-2">Coût : 1 crédit</span>
          </button>
        ) : (
          <div className="text-center py-10 px-8 rounded-[2.5rem] bg-white/5 border border-white/10 border-dashed">
            <p className="text-[#C9963A] font-bold text-sm">Toutes les pépites ont été trouvées 👑</p>
          </div>
        )}

        {/* INDICATEUR DE PAGES */}
        <div className="flex gap-3">
          {Array.from({ length: unlockedPages }).map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-12 h-12 rounded-2xl font-black text-xs transition-all ${currentPage === i + 1 ? "bg-[#C9963A] text-[#1A0A00] shadow-xl shadow-[#C9963A]/20 scale-110" : "bg-white/5 text-white/30 border border-white/10"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* ZOOM MODAL */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <img src={zoomImage} className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border border-white/10" alt="Zoom" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

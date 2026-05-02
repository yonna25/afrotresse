import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
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
  <div className="relative w-full h-full overflow-hidden" onClick={onClick}>
    <img src={src} alt={alt} className={`${className} transition-transform duration-700 hover:scale-110`}
      draggable={false} onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none" }} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
  </div>
);

// ─── Fireworks ────────────────────────────────────────────────────────────────
function Fireworks({ onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const COLORS = ["#C9963A", "#E8B96A", "#FAF4EC", "#FFFFFF"];
    class Particle {
      constructor(x, y) {
        this.x = x; this.y = y;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.life = 1; this.decay = Math.random() * 0.015 + 0.01;
      }
      update() { this.x += this.vx; this.y += this.vy; this.vy += 0.08; this.life -= this.decay; }
      draw() { ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); ctx.fill(); }
    }
    let particles = [];
    const bursts = [{ x: W * 0.5, y: H * 0.3, d: 0 }, { x: W * 0.2, y: H * 0.4, d: 200 }, { x: W * 0.8, y: H * 0.35, d: 400 }];
    bursts.forEach(b => setTimeout(() => { for (let i = 0; i < 50; i++) particles.push(new Particle(b.x, b.y)); }, b.d));
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
  return <canvas ref={canvasRef} className="fixed inset-0 z-[9999] pointer-events-none" />;
}

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  const [zoomImage, setZoomImage] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stableMsg, setStableMsg] = useState({ headline: "", subtext: "" });
  const [displayName] = useState(() => localStorage.getItem("afrotresse_user_name") || "");

  const { isFav, toggleFav } = useFavorites();
  const [currentPage, setCurrentPage] = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1"));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1"));

  const topRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStyles(parsed.recommendations || []);
        setStableMsg(generateStableMessage({ faceShape: parsed.faceShape, sessionId: getOrCreateSessionId(), name: displayName }));
        if (sessionStorage.getItem("afrotresse_trigger_fireworks")) {
          setShowFireworks(true);
          sessionStorage.removeItem("afrotresse_trigger_fireworks");
        }
      } catch (e) { console.error(e); }
    }
    setSelfieUrl(sessionStorage.getItem("afrotresse_photo"));
    syncCreditsFromServer().then(setCredits);
  }, [displayName]);

  const displayedStyles = styles.slice((currentPage - 1) * STYLES_PER_PAGE, currentPage * STYLES_PER_PAGE);
  const totalPages = Math.ceil(styles.length / STYLES_PER_PAGE);
  const hasMorePages = unlockedPages < totalPages;

  const handleGenerateMore = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    if (getCredits() <= 0) {
      setErrorMsg("💎 Solde insuffisant pour débloquer plus de styles.");
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

  // --- RENDU ÉTAT ZÉRO ---
  if (styles.length === 0) {
    return (
      <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] flex flex-col relative overflow-hidden">
        <Seo title="Découvre tes styles — AfroTresse" />
        <div className="relative h-64 flex items-center justify-center" style={{ background: "linear-gradient(160deg, rgba(201,150,58,0.15) 0%, rgba(44,26,14,0.7) 100%)" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-6xl mb-4">👑</motion.div>
          <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-[#1A0A00] to-transparent" />
        </div>
        <div className="px-6 -mt-10 relative z-10">
          <h2 className="text-2xl font-black mb-2">Ton visage, tes styles ✨</h2>
          <p className="text-sm opacity-60 mb-8 italic">"Un selfie suffit pour trouver la coiffure qui te correspond."</p>
          <div className="space-y-4 mb-10">
            {["📸 Prends un selfie", "🔍 Analyse IA", "✨ Styles sur-mesure"].map((step, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-sm">{step}</span>
                <span className="text-[#C9963A] text-xs font-black">0{i+1}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/camera")} className="w-full py-5 rounded-2xl font-black bg-[#C9963A] text-[#1A0A00]">📸 PRENDRE MON SELFIE</button>
        </div>
      </div>
    );
  }

  // --- RENDU RÉSULTATS ---
  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] pb-40">
      <Seo title="Tes résultats — AfroTresse" />
      <div ref={topRef} />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}

      {/* BOUTONS FLOTTANTS (Restauration) */}
      <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-3">
        <div className="w-12 h-12 bg-[#FAF4EC] text-[#2C1A0E] rounded-lg flex flex-col items-center justify-center shadow-2xl border border-[#C9963A]/30">
          <div className="text-[5px] font-black uppercase opacity-60">Solde</div>
          <div className="text-xl font-black">{credits}</div>
        </div>
        <button onClick={handleGenerateMore} disabled={isGenerating} className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shadow-lg bg-gradient-to-br from-[#C9963A] to-[#E8B96A] border border-white/10 active:scale-90 transition-transform">
          <span className="text-[6px] font-black text-[#2C1A0E] uppercase mb-1">Générer</span>
          <span className="text-xl">✨</span>
        </button>
      </div>

      {/* HEADER RÉSULTATS */}
      <div className="p-6">
        <div className="bg-gradient-to-br from-[#2C1A0E] to-[#1A0A00] p-6 rounded-[2.5rem] border border-[#C9963A]/30 shadow-2xl flex items-center gap-4">
          <img src={selfieUrl} className="w-16 h-16 rounded-xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          <div>
            <h1 className="text-[#C9963A] font-bold text-lg">{stableMsg.headline || "Tes styles sur-mesure"}</h1>
            <p className="text-[10px] opacity-50 uppercase tracking-widest">{stableMsg.subtext}</p>
          </div>
        </div>
      </div>

      {/* GRILLE DE STYLES */}
      <div className="px-6 space-y-10">
        {displayedStyles.map((style) => (
          <motion.div key={style.id} className="bg-[#2C1A0E] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="grid grid-cols-3 h-64 gap-0.5 bg-black/20">
              <div className="col-span-2">
                <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-face.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-face.webp`)} />
              </div>
              <div className="grid grid-rows-2 gap-0.5">
                <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-back.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-back.webp`)} />
                <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-top.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-top.webp`)} />
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">{style.name}</h3>
                <button onClick={() => toggleFav(style)} className="text-xl">{isFav(style.id) ? "❤️" : "🤍"}</button>
              </div>
              <p className="text-xs opacity-50 mb-6 leading-relaxed line-clamp-2">{style.description}</p>
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[#C9963A] text-[10px] font-black uppercase tracking-widest">✨ Essai Virtuel</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PAGINATION & CTA VOIR PLUS */}
      <div className="mt-12 flex flex-col items-center gap-6">
        {hasMorePages ? (
          <button onClick={handleGenerateMore} className="flex flex-col items-center group">
            <div className="bg-[#C9963A] p-5 rounded-full shadow-2xl mb-3 group-active:scale-90 transition-transform">
              <span className="text-2xl text-[#1A0A00]">🪄</span>
            </div>
            <span className="text-[#C9963A] font-black text-[10px] uppercase tracking-widest">Voir 3 autres styles</span>
          </button>
        ) : (
          <p className="text-white/20 text-[10px] uppercase font-bold">Fin des recommandations</p>
        )}

        <div className="flex gap-2">
          {Array.from({ length: unlockedPages }).map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl font-black text-xs ${currentPage === i + 1 ? "bg-[#C9963A] text-[#1A0A00]" : "bg-white/5 text-white/30"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4">
            <img src={zoomImage} className="max-w-full max-h-[80vh] rounded-2xl" alt="Zoom" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

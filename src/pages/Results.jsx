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
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.015;
      }
      update() { this.x += this.vx; this.y += this.vy; this.vy += 0.08; this.life -= this.decay; }
      draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
    const particles = [];
    const burst = (x, y) => { for (let i = 0; i < 40; i++) particles.push(new Particle(x, y)); };
    burst(W / 2, H / 3);
    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p, i) => { p.update(); p.draw(); if (p.life <= 0) particles.splice(i, 1); });
      if (particles.length > 0) animId = requestAnimationFrame(animate); else onDone?.();
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [onDone]);
  return <canvas ref={canvasRef} className="fixed inset-0 z-[9999] pointer-events-none" />;
}

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(getCredits());
  const [zoomImage, setZoomImage] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));
  const [stableMsg, setStableMsg] = useState({ headline: "Voici tes résultats ✨", subtext: "" });
  const [selfieUrl, setSelfieUrl] = useState(sessionStorage.getItem("afrotresse_photo"));

  const { isFav, toggleFav } = useFavorites();
  const topRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // On récupère les styles soit dans .recommendations soit directement si c'est un tableau
        const recs = parsed.recommendations || (Array.isArray(parsed) ? parsed : []);
        setStyles(recs);
        
        if (sessionStorage.getItem("afrotresse_trigger_fireworks")) {
          setShowFireworks(true);
          sessionStorage.removeItem("afrotresse_trigger_fireworks");
        }
        
        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape || "oval", 
          sessionId: getOrCreateSessionId(),
          name: localStorage.getItem("afrotresse_user_name") || ""
        }));
      } catch (e) {
        console.error("Erreur parsing:", e);
      }
    }
    syncCreditsFromServer().then(c => setCredits(c));
  }, []);

  // Logique technique de pagination robuste
  const totalAvailableStyles = styles.length;
  const totalPagesPossible = Math.ceil(totalAvailableStyles / STYLES_PER_PAGE);
  
  // Correction de l'affichage : On prend tous les styles jusqu'à la page débloquée
  // pour permettre le scroll fluide et la navigation
  const stylesToDisplay = styles.slice(0, unlockedPages * STYLES_PER_PAGE);

  const handleGenerateMore = async () => {
    if (credits <= 0) { navigate("/credits"); return; }
    
    const success = await consumeCredits(1);
    if (success) {
      setCredits(getCredits());
      const nextP = unlockedPages + 1;
      setUnlockedPages(nextP);
      localStorage.setItem("afrotresse_unlocked_pages", String(nextP));
      setShowFireworks(true);
      // Petit délai pour laisser le temps au rendu avant de scroller
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 pb-40 relative">
      <Seo title="Tes résultats — AfroTresse" />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}
      <div ref={topRef} />

      {/* HEADER */}
      <div className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-xl">
        <div className="relative shrink-0">
          <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="font-bold text-lg text-[#C9963A] leading-tight break-words">{stableMsg.headline}</h1>
          <p className="text-[11px] opacity-80 mt-1.5 leading-snug">{stableMsg.subtext}</p>
        </div>
      </div>

      {/* LISTE DES STYLES */}
      <div className="flex flex-col gap-8">
        {stylesToDisplay.map((style, index) => (
          <motion.div key={style.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
             <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <img src={style.views?.face || `/styles/${style.id?.replace(/-/g, "")}-face.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.face || `/styles/${style.id?.replace(/-/g, "")}-face.webp`)} alt="Face" />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <img src={style.views?.back || `/styles/${style.id?.replace(/-/g, "")}-back.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.back || `/styles/${style.id?.replace(/-/g, "")}-back.webp`)} alt="Back" />
                  <img src={style.views?.top || `/styles/${style.id?.replace(/-/g, "")}-top.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.top || `/styles/${style.id?.replace(/-/g, "")}-top.webp`)} alt="Top" />
                </div>
             </div>
             <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xl">{style.name}</h3>
                  <button onClick={() => toggleFav(style)} className="text-xl p-2">{isFav(style.id) ? "❤️" : "🤍"}</button>
                </div>
                <p className="text-[11px] opacity-60 leading-relaxed">{style.description}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* BOUTON VOIR PLUS (Sous la liste) */}
      {unlockedPages < totalPagesPossible && (
        <div className="mt-12 mb-4">
          <button onClick={handleGenerateMore} className="w-full py-5 rounded-[2rem] font-black text-[#2C1A0E] bg-[#C9963A] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
            <span>✨ Voir 3 autres styles</span>
            <span className="bg-[#2C1A0E]/20 px-2 py-0.5 rounded text-[10px] uppercase font-black">-1 Crédit</span>
          </button>
        </div>
      )}

      {/* BOUTONS FLOTTANTS */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-center gap-3">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => navigate("/credits")} className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-xl flex flex-col items-center justify-center shadow-2xl border border-[#2C1A0E]/20 cursor-pointer">
          <span className="text-[5px] font-black uppercase opacity-60 leading-none">Solde</span>
          <span className="text-xl font-black leading-none">{credits}</span>
        </motion.div>

        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }} onClick={handleGenerateMore} className="w-12 h-12 rounded-xl shadow-2xl flex flex-col items-center justify-center border border-white/10" style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
          <span className="text-[6px] font-black text-[#2C1A0E] uppercase leading-none mb-1">Générer</span>
          <span className="text-xl">✨</span>
        </motion.button>
      </div>

      {/* MODAL ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={zoomImage} className="max-w-full max-h-[85vh] rounded-3xl object-contain border border-white/10 shadow-2xl" />
            <button className="absolute top-10 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-3xl">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

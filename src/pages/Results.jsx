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
    const BURSTS = [{ x: W * 0.5, y: H * 0.3, delay: 0 }, { x: W * 0.2, y: H * 0.4, delay: 200 }, { x: W * 0.8, y: H * 0.4, delay: 400 }];
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
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(getCredits());
  const [zoomImage, setZoomImage] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));
  const [stableMsg, setStableMsg] = useState({ headline: "Voici tes résultats ✨", subtext: "" });
  const [selfieUrl] = useState(sessionStorage.getItem("afrotresse_photo"));

  const { isFav, toggleFav } = useFavorites();
  const topRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      const parsed = JSON.parse(raw);
      setStyles(parsed.recommendations || []);
      if (sessionStorage.getItem("afrotresse_trigger_fireworks")) {
        setShowFireworks(true);
        sessionStorage.removeItem("afrotresse_trigger_fireworks");
      }
      setStableMsg(generateStableMessage({ 
        faceShape: parsed.faceShape || "oval", 
        sessionId: getOrCreateSessionId(),
        name: localStorage.getItem("afrotresse_user_name") || ""
      }));
    }
    syncCreditsFromServer().then(c => setCredits(c));
  }, []);

  const totalPagesAvailable = Math.ceil(styles.length / STYLES_PER_PAGE);
  const displayedStyles = styles.slice((currentPage - 1) * STYLES_PER_PAGE, currentPage * STYLES_PER_PAGE);

  const handleGenerateMore = async () => {
    if (credits <= 0) { navigate("/credits"); return; }
    const success = await consumeCredits(1);
    if (success) {
      setCredits(getCredits());
      const nextPage = unlockedPages + 1;
      setUnlockedPages(nextPage);
      setCurrentPage(nextPage);
      localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
      localStorage.setItem("afrotresse_current_page", String(nextPage));
      setShowFireworks(true);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 pb-40 relative overflow-x-hidden">
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}
      <div ref={topRef} />

      {/* HEADER */}
      <div className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="relative shrink-0">
          <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-bold text-lg text-[#C9963A] leading-tight">{stableMsg.headline}</h1>
          <p className="text-[11px] opacity-80 mt-1.5">{stableMsg.subtext}</p>
        </div>
      </div>

      {/* LISTE DES STYLES */}
      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => (
          <motion.div key={style.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
             <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <img src={style.views?.face || `/styles/${style.id?.replace(/-/g, "")}-face.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.face || `/styles/${style.id?.replace(/-/g, "")}-face.webp`)} alt={style.name} />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <img src={style.views?.back || `/styles/${style.id?.replace(/-/g, "")}-back.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.back || `/styles/${style.id?.replace(/-/g, "")}-back.webp`)} />
                  <img src={style.views?.top || `/styles/${style.id?.replace(/-/g, "")}-top.webp`} className="w-full h-full object-cover cursor-zoom-in" onClick={() => setZoomImage(style.views?.top || `/styles/${style.id?.replace(/-/g, "")}-top.webp`)} />
                </div>
             </div>
             <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-xl">{style.name}</h3>
                  <button onClick={() => toggleFav(style)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">{isFav(style.id) ? "❤️" : "🤍"}</button>
                </div>
                <p className="text-[11px] opacity-60 leading-relaxed">{style.description || "Un style unique pour sublimer ton visage."}</p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* BOUTON VOIR 3 AUTRES STYLES */}
      {unlockedPages < totalPagesAvailable && (
        <div className="mt-12">
          <button onClick={handleGenerateMore} className="w-full py-5 rounded-[2rem] font-black text-[#2C1A0E] bg-[#C9963A] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
            <span>✨ Voir 3 autres styles</span>
            <span className="bg-[#2C1A0E]/20 px-2 py-0.5 rounded text-[10px] uppercase">-1 Crédit</span>
          </button>
        </div>
      )}

      {/* PAGINATION */}
      {unlockedPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: unlockedPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => { setCurrentPage(p); topRef.current?.scrollIntoView({ behavior: "smooth" }); }} className={`w-10 h-10 rounded-xl font-black ${p === currentPage ? "bg-[#C9963A] text-[#2C1A0E]" : "bg-white/10 text-white/50"}`}>{p}</button>
          ))}
        </div>
      )}

      {/* BOUTONS FLOTTANTS */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-2">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={() => navigate("/credits")} className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-lg flex flex-col items-center justify-center shadow-lg border border-[#2C1A0E]/20 active:scale-95 cursor-pointer">
          <div className="text-[5px] font-black uppercase opacity-60">Solde</div>
          <div className="text-xl font-black leading-none">{credits}</div>
        </motion.div>
        <motion.button initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} whileTap={{ scale: 0.9 }} onClick={handleGenerateMore} className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shadow-lg border border-white/10" style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
          <span className="text-[6px] font-black text-[#2C1A0E] uppercase">Générer</span>
          <span className="text-xl">✨</span>
        </motion.button>
      </div>

      {/* MODAL ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} src={zoomImage} className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl object-contain border border-white/10" />
            <button className="absolute top-10 right-10 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl font-bold">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

// ─── Composant Image Protégée ───
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

// ─── Composant Feux d'artifice ───
function Fireworks({ onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const COLORS = ["#C9963A", "#FAF4EC", "#FFD700"];
    class Particle {
      constructor(x, y) {
        this.x = x; this.y = y;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1; this.decay = 0.015; this.size = 2;
      }
      update() { this.x += this.vx; this.y += this.vy; this.vy += 0.1; this.life -= this.decay; }
      draw() {
        ctx.globalAlpha = this.life; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
      }
    }
    const particles = [];
    for (let i = 0; i < 50; i++) particles.push(new Particle(W / 2, H / 3));
    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p, i) => { p.update(); p.draw(); if (p.life <= 0) particles.splice(i, 1); });
      if (particles.length > 0) animId = requestAnimationFrame(animate); else onDone();
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [onDone]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9999]" />;
}

export default function Results() {
  const navigate = useNavigate();
  const topRef = useRef(null);

  // ÉTATS
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(getCredits());
  const [zoomImage, setZoomImage] = useState(null);
  const [showFireworks, setShowFireworks] = useState(false);
  const [isTesting, setIsTesting] = useState(false); // CRUCIAL : Défini ici
  const [stableMsg, setStableMsg] = useState({ headline: "Tes résultats ✨", subtext: "" });
  const [displayName, setDisplayName] = useState(localStorage.getItem("afrotresse_user_name") || "");
  const [currentPage, setCurrentPage] = useState(1);

  const { isFav, toggleFav } = useFavorites();

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
          name: displayName,
          confidence: parsed.confidence || 0.5
        }));
        if (sessionStorage.getItem("afrotresse_trigger_fireworks")) {
          setShowFireworks(true);
          sessionStorage.removeItem("afrotresse_trigger_fireworks");
        }
      } catch (e) { console.error(e); }
    }
    setSelfieUrl(sessionStorage.getItem("afrotresse_photo"));
    syncCreditsFromServer().then(setCredits);
  }, [displayName]);

  // FONCTION TEST IA
  const handleTestTryOn = async (style) => {
    if (!selfieUrl) return alert("Photo manquante");
    setIsTesting(true);
    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${style.name}: ${style.description}`, image: selfieUrl })
      });
      const data = await res.json();
      if (res.ok && data.image) {
        setZoomImage(data.image);
      } else {
        alert("L'IA est en train de charger. Réessaie dans 20 secondes.");
      }
    } catch (err) {
      alert("Erreur de connexion.");
    } finally {
      setIsTesting(false);
    }
  };

  if (styles.length === 0) return <div className="p-10 text-center text-white">Chargement...</div>;

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] p-4 pb-32">
      <Seo title="Résultats — AfroTresse" />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}
      <div ref={topRef} />

      {/* Header Profil */}
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
        <ProtectedImg src={selfieUrl} className="w-16 h-16 rounded-xl border border-[#C9963A] object-cover" />
        <div>
          <h1 className="font-bold text-lg text-[#C9963A]">{displayName || "Reine"} ✨</h1>
          <p className="text-[10px] opacity-60">{stableMsg.headline}</p>
        </div>
      </div>

      {/* Liste des Styles */}
      <div className="space-y-8">
        {styles.slice(0, STYLES_PER_PAGE).map((style) => (
          <div key={style.id} className="bg-[#2C1A0E] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-xl">
            <div className="h-64 overflow-hidden">
              <ProtectedImg 
                src={style.views?.face || `/styles/${style.id.replace(/-/g,'')}-face.webp`} 
                className="w-full h-full object-cover"
                onClick={() => setZoomImage(style.views?.face || `/styles/${style.id.replace(/-/g,'')}-face.webp`)}
              />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl">{style.name}</h3>
                <button onClick={() => toggleFav(style)} className="text-xl">
                  {isFav(style.id) ? "❤️" : "🤍"}
                </button>
              </div>
              <p className="text-xs opacity-60 mb-6">{style.description}</p>
              
              <button 
                onClick={() => handleTestTryOn(style)} 
                disabled={isTesting}
                className="w-full py-4 rounded-2xl bg-[#C9963A] text-[#2C1A0E] font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                {isTesting ? "⏳ IA en cours..." : "🧪 Tester ce style"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Zoom */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.img 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              src={zoomImage} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/10" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, syncCreditsFromServer } from "../services/credits.js";
import Seo from "../components/Seo.jsx";
import {
  generateStableMessage,
  getOrCreateSessionId,
  resetMessageAssignment,
} from "../services/stableMessage.js";
import { useFavorites } from "../hooks/useFavorites.js";

const STYLES_PER_PAGE = 3;

const EMPTY_STEPS = [
  { icon: "📸", num: "01", label: "Selfie", sub: "Prends ou upload une photo" },
  { icon: "🔍", num: "02", label: "Analyse", sub: "Morphologie détectée en 3s" },
  { icon: "✨", num: "03", label: "Styles sur-mesure", sub: "3 tresses taillées pour toi" },
];

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

function Fireworks({ onDone }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const COLORS = ["#C9963A","#E8B96A","#FAF4EC","#FFFFFF","#FFD700","#A87B28","#FFF0C0"];
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
      { x: W * 0.2, y: H * 0.28, delay: 0   },
      { x: W * 0.8, y: H * 0.22, delay: 180 },
      { x: W * 0.5, y: H * 0.15, delay: 350 },
      { x: W * 0.15,y: H * 0.5,  delay: 520 },
      { x: W * 0.85,y: H * 0.42, delay: 280 },
      { x: W * 0.5, y: H * 0.38, delay: 600 },
    ];
    const timers = BURSTS.map(b => setTimeout(() => {
      for (let i = 0; i < 70; i++) particles.push(new Particle(b.x, b.y));
    }, b.delay));
    let animId, finished = false;
    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(); particles[i].draw();
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
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999, width: "100%", height: "100%" }} />
  );
}

export default function Results() {
  const navigate = useNavigate();

  const [faceShape, setFaceShape]         = useState("oval");
  const [selfieUrl, setSelfieUrl]         = useState(null);
  const [styles, setStyles]               = useState([]);
  const [credits, setCreditsState]        = useState(getCredits());
  const [zoomImage, setZoomImage]         = useState(null);
  const [errorMsg, setErrorMsg]           = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [showVirtualTryOnModal, setShowVirtualTryOnModal] = useState(false);
  const [stableMsg, setStableMsg]         = useState({ headline: "Voici tes résultats ✨", subtext: "" });
  const [displayName, setDisplayName]     = useState(() => localStorage.getItem("afrotresse_user_name") || "");
  const [generating, setGenerating]       = useState(false);
  const [crownReady, setCrownReady]       = useState(false);

  const { isFav, toggleFav, FREE_LIMIT } = useFavorites();

  const [currentPage, setCurrentPage]     = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));
  const [styleStats, setStyleStats]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("afrotresse_style_stats") || "{}"); }
    catch { return {}; }
  });

  const topRef   = useRef(null);
  const errorRef = useRef(null);
  const userName = localStorage.getItem("afrotresse_user_name") || "Reine";

  useEffect(() => { const t = setTimeout(() => setCrownReady(true), 300); return () => clearTimeout(t); }, []);

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
        const sessionId  = getOrCreateSessionId();
        const name       = localStorage.getItem("afrotresse_user_name") || "";
        const confidence = parsed.confidence ?? 0.5;
        const shape      = parsed.faceShape || "oval";
        setStableMsg(generateStableMessage({ faceShape: shape, sessionId, name, confidence }));
        setStyleStats(prev => {
          const next = { ...prev };
          let changed = false;
          recs.forEach(s => {
            if (!next[s.id]) {
              next[s.id] = {
                views: Math.floor(Math.random() * 3000) + 800,
                likes: Math.floor(Math.random() * 1200) + 200,
              };
              changed = true;
            }
          });
          if (changed) localStorage.setItem("afrotresse_style_stats", JSON.stringify(next));
          return next;
        });
      } catch (e) { console.error("Error parsing results:", e); }
    }
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    syncCreditsFromServer()
      .then(c => { if (c !== undefined) setCreditsState(c); })
      .catch(() => setCreditsState(getCredits()));
  }, []);

  useEffect(() => {
    const viewInterval = setInterval(() => {
      setStyleStats(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id] = { ...next[id], views: next[id].views + Math.floor(Math.random() * 3) + 1 };
        });
        localStorage.setItem("afrotresse_style_stats", JSON.stringify(next));
        return next;
      });
    }, 8000);
    const likeInterval = setInterval(() => {
      setStyleStats(prev => {
        const next = { ...prev };
        const ids = Object.keys(next);
        if (ids.length > 0) {
          const id = ids[Math.floor(Math.random() * ids.length)];
          next[id] = { ...next[id], likes: next[id].likes + 1 };
        }
        localStorage.setItem("afrotresse_style_stats", JSON.stringify(next));
        return next;
      });
    }, 20000);
    return () => { clearInterval(viewInterval); clearInterval(likeInterval); };
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
    if (total <= STYLES_PER_PAGE) return styles.slice(0, STYLES_PER_PAGE);

    const baseSeed = userName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 12345);

    // Construire un ordre global : on épuise tous les styles (cycle complet)
    // avant de remélanger aléatoirement pour un nouveau cycle.
    // Aucun style ne peut apparaître deux fois dans le même cycle.
    const buildFullOrder = () => {
      const result = [];
      let cycle = 0;
      while (result.length < page * STYLES_PER_PAGE) {
        // Nouveau mélange à chaque cycle, avec une graine différente
        const shuffled = getShuffledStyles(baseSeed + cycle * 9973);
        // On pousse TOUS les styles du cycle — pas de filtre inter-cycle ici
        for (const s of shuffled) {
          result.push(s);
          if (result.length >= page * STYLES_PER_PAGE) break;
        }
        cycle++;
      }
      return result;
    };

    const fullOrder = buildFullOrder();
    const start = (page - 1) * STYLES_PER_PAGE;
    return fullOrder.slice(start, start + STYLES_PER_PAGE);
  };

  const displayedStyles = getPageStyles(currentPage);
  const maxPages = styles.length > 0 ? Math.ceil(styles.length / STYLES_PER_PAGE) : 2;

  const goToPage = (page) => {
    setCurrentPage(page);
    localStorage.setItem("afrotresse_current_page", String(page));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGenerateMore = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const { getSessionIdWithFp } = await import("../services/fingerprint.js");
      const { getCurrentUser }     = await import("../services/useSupabaseCredits.js");
      const sessionId = await getSessionIdWithFp();
      const user      = await getCurrentUser().catch(() => null);
      const userId    = user?.id || null;

      const res = await fetch("/api/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userId, amount: 1 }),
      });

      if (res.status === 402) { navigate("/credits"); return; }
      if (!res.ok) { navigate("/credits"); return; }

      const { credits: newBalance } = await res.json();
      setCreditsState(newBalance);
      localStorage.setItem("afrotresse_credits", String(newBalance));

    } catch {
      navigate("/credits"); return;
    } finally {
      setGenerating(false);
    }

    const nextPage = unlockedPages + 1;
    setUnlockedPages(nextPage);
    setCurrentPage(nextPage);
    localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
    localStorage.setItem("afrotresse_current_page", String(nextPage));
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

  // ── EMPTY STATE PREMIUM ───────────────────────────────────────────────────
  if (!styles.length) {
    return (
      <div className="min-h-[100dvh] text-[#FAF4EC] flex flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(170deg, #1A0A00 0%, #2C1A0E 45%, #1A0A00 100%)" }}>
        <Seo title="Styles — AfroTresse" />

        <style>{`
          @keyframes crownIn {
            0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
            60%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
            80%  { transform: scale(0.95) rotate(-2deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(201,150,58,0), 0 0 30px rgba(201,150,58,0.15); }
            50%       { box-shadow: 0 0 0 16px rgba(201,150,58,0.08), 0 0 50px rgba(201,150,58,0.25); }
          }
          @keyframes floatCrown {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-7px); }
          }
          @keyframes shimmerBtn {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes orbitDot {
            from { transform: rotate(0deg) translateX(58px) rotate(0deg); }
            to   { transform: rotate(360deg) translateX(58px) rotate(-360deg); }
          }
          @keyframes rayIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>

        {/* Glow bg */}
        <div style={{
          position: "fixed", top: "12%", left: "50%", transform: "translateX(-50%)",
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,150,58,0.1) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* HERO */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 52, paddingBottom: 4 }}>

          {/* Crown */}
          <div style={{ position: "relative", marginBottom: 24 }}>
            {/* Orbit dot */}
            {crownReady && (
              <div style={{ position: "absolute", top: "50%", left: "50%", width: 0, height: 0, zIndex: 2 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#C9963A",
                  marginTop: -3.5, marginLeft: -3.5,
                  animation: "orbitDot 3.5s linear infinite",
                  boxShadow: "0 0 6px rgba(201,150,58,0.8)",
                }} />
              </div>
            )}
            {/* Rays */}
            {[0,45,90,135,180,225,270,315].map((deg, i) => (
              <div key={deg} style={{
                position: "absolute", top: "50%", left: "50%",
                width: 1.5, height: 14, marginLeft: -0.75, marginTop: -62,
                background: "linear-gradient(to bottom, rgba(201,150,58,0.55), transparent)",
                transformOrigin: "0.75px 62px",
                transform: `rotate(${deg}deg)`,
                borderRadius: 2,
                animation: crownReady ? `rayIn 0.3s ease ${0.9 + i * 0.06}s both` : "none",
                opacity: 0,
              }} />
            ))}
            {/* Circle */}
            <div style={{
              width: 108, height: 108, borderRadius: "50%",
              background: "linear-gradient(145deg, #2C1A0E, #1A0A00)",
              border: "1.5px solid rgba(201,150,58,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: crownReady
                ? "crownIn 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.3s both, glowPulse 3s ease-in-out 1.2s infinite, floatCrown 3.5s ease-in-out 1.5s infinite"
                : "none",
            }}>
              <span style={{ fontSize: 50, lineHeight: 1 }}>👑</span>
            </div>
          </div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ textAlign: "center", padding: "0 24px" }}>
            <p style={{ fontSize: 11, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(201,150,58,0.65)", fontFamily: "sans-serif", fontWeight: 600, marginBottom: 8 }}>
              AfroTresse
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, color: "#FAF4EC", margin: 0, fontFamily: "sans-serif" }}>
              Ton visage,{" "}
              <span style={{
                background: "linear-gradient(90deg, #C9963A, #E8B96A, #C9963A)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmerBtn 3s linear infinite",
              }}>
                {'tes styles ✨'}
              </span>
            </h1>
          </motion.div>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, zIndex: 1, padding: "0 20px 120px", display: "flex", flexDirection: "column" }}>

          {/* Subtitle */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ textAlign: "center", margin: "20px 0 24px" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#FAF4EC", marginBottom: 6, fontFamily: "sans-serif", lineHeight: 1.4 }}>
              {'Découvre les tresses adaptées'}<br />{'à ton visage 💛'}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic", fontFamily: "sans-serif", lineHeight: 1.6 }}>
              {'« Un selfie suffit pour trouver la coiffure qui te correspond. »'}
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(201,150,58,0.2))" }} />
            <span style={{ fontSize: 9, color: "rgba(201,150,58,0.45)", letterSpacing: "0.3em", fontFamily: "sans-serif", textTransform: "uppercase" }}>
              Comment ça marche
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(201,150,58,0.2))" }} />
          </motion.div>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {EMPTY_STEPS.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 + i * 0.09 }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: "linear-gradient(135deg, rgba(44,26,14,0.9), rgba(26,10,0,0.95))",
                  border: "1px solid rgba(201,150,58,0.13)",
                  borderRadius: 18, padding: "14px 16px",
                  position: "relative", overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)",
                }}>
                {/* bg number */}
                <div style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 32, fontWeight: 900, color: "rgba(201,150,58,0.05)",
                  fontFamily: "sans-serif", lineHeight: 1, userSelect: "none",
                }}>{step.num}</div>
                {/* icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                  background: "linear-gradient(145deg, rgba(201,150,58,0.18), rgba(201,150,58,0.06))",
                  border: "1px solid rgba(201,150,58,0.22)",
       

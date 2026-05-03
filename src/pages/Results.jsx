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
  { icon: "🔍", num: "02", label: "Analyse IA", sub: "Morphologie d\u00e9tect\u00e9e en 3s" },
  { icon: "✨", num: "03", label: "Styles sur-mesure", sub: "3 tresses taill\u00e9es pour toi" },
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
  const [stableMsg, setStableMsg]         = useState({ headline: "Voici tes r\u00e9sultats \u2728", subtext: "" });
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
    const baseSeed = userName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 12345);
    const stylesPerShuffle = Math.floor(total / STYLES_PER_PAGE) * STYLES_PER_PAGE || STYLES_PER_PAGE;
    const shuffleIndex = Math.floor(((page - 1) * STYLES_PER_PAGE) / stylesPerShuffle);
    const positionInShuffle = ((page - 1) * STYLES_PER_PAGE) % stylesPerShuffle;
    const shuffled = getShuffledStyles(baseSeed + shuffleIndex * 9973);
    const result = [];
    for (let i = 0; i < STYLES_PER_PAGE; i++) result.push(shuffled[(positionInShuffle + i) % total]);
    return result;
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
              AfroTresse · IA
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
                {'tes styles \u2728'}
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
              {'D\u00e9couvre les tresses adapt\u00e9es'}<br />{'à ton visage 💛'}
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
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, boxShadow: "0 2px 10px rgba(201,150,58,0.08)",
                }}>{step.icon}</div>
                {/* text */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#FAF4EC", marginBottom: 2, fontFamily: "sans-serif" }}>{step.label}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "sans-serif" }}>{step.sub}</p>
                </div>
                {/* arrow */}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(201,150,58,0.1)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#C9963A",
                }}>→</div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, type: "spring", stiffness: 200, damping: 20 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/camera")}
            style={{
              width: "100%", padding: "18px 24px", borderRadius: 18, border: "none", cursor: "pointer",
              background: "linear-gradient(90deg, #C9963A 0%, #E8B96A 50%, #C9963A 100%)",
              backgroundSize: "200% auto",
              animation: "shimmerBtn 3s linear infinite",
              color: "#1A0A00", fontWeight: 900, fontSize: 16,
              fontFamily: "sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 8px 28px rgba(201,150,58,0.45), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}>
            <span style={{ fontSize: 20 }}>📸</span>
            <span>Prendre mon selfie</span>
          </motion.button>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 }}>
            <div style={{ display: "flex" }}>
              {["#C9963A","#8B5E3C","#A0522D"].map((bg, i) => (
                <div key={i} style={{
                  width: 20, height: 20, borderRadius: "50%", background: bg,
                  border: "2px solid #1A0A00", marginLeft: i > 0 ? -6 : 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, color: "#FAF4EC", fontWeight: 900, fontFamily: "sans-serif",
                }}>{["A","F","K"][i]}</div>
              ))}
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "sans-serif" }}>
              +240 reines ont {`d\u00e9j\u00e0`} essay\u00e9
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── RÉSULTATS (inchangé) ─────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">
      <Seo title="Tes résultats — AfroTresse" />
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}
      <div ref={topRef} />

      {errorMsg && (
        <motion.div ref={errorRef}
          className="mb-4 px-5 py-3 rounded-2xl bg-red-900/30 border border-red-500/30 text-red-300 text-[11px] font-bold text-center">
          {errorMsg}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        className="mb-8 rounded-[2rem] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(44,26,14,0.9) 0%, rgba(61,38,22,0.95) 100%)",
          border: "1px solid rgba(201,150,58,0.25)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,150,58,0.08)",
        }}>
        <div className="flex items-center gap-4 p-4 pb-3">
          <div className="relative shrink-0">
            {selfieUrl ? (
              <ProtectedImg src={selfieUrl}
                className="w-16 h-16 rounded-2xl object-cover"
                style={{ border: "2px solid rgba(201,150,58,0.6)" }} />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">👤</div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
              style={{ backgroundColor: "#22c55e", borderColor: "#2C1A0E" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold mb-0.5" style={{ color: "rgba(201,150,58,0.7)" }}>
              {'Voici tes r\u00e9sultats'}
            </p>
            <h1 className="font-black text-2xl text-white leading-tight truncate">
              {displayName || "Ma Reine"} ✨
            </h1>
          </div>
        </div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="w-1 self-stretch rounded-full shrink-0"
            style={{ background: "linear-gradient(to bottom, #C9963A, rgba(201,150,58,0.1))" }} />
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(250,244,236,0.55)" }}>
            {stableMsg.subtext || "Ton visage est un terrain de jeu sans limites. Aucune contrainte, toutes les libert\u00e9s."}
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {
          const styleId    = style.id?.replace(/-/g, "");
          const isFavorited = isFav(style.id);
          const stats      = styleStats[style.id] || { views: 0, likes: 0 };
          const poseTime   = style.duration || style.pose_time || style.time;

          return (
            <motion.div key={style.id || index}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <ProtectedImg
                    src={style.views?.face || `/styles/${styleId}-face.webp`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setZoomImage(style.views?.face || `/styles/${styleId}-face.webp`)} />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <ProtectedImg
                    src={style.views?.back || `/styles/${styleId}-back.webp`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setZoomImage(style.views?.back || `/styles/${styleId}-back.webp`)} />
                  <ProtectedImg
                    src={style.views?.top || `/styles/${styleId}-top.webp`}
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setZoomImage(style.views?.top || `/styles/${styleId}-top.webp`)} />
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xl text-white">{style.name}</h3>
                  <button onClick={() => handleToggleFav(style)}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isFavorited ? "rgba(201,150,58,0.2)" : "rgba(255,255,255,0.05)",
                      border: isFavorited ? "1.5px solid #C9963A" : "1.5px solid rgba(255,255,255,0.1)",
                    }}>
                    <span className="text-base">{isFavorited ? "❤️" : "🤍"}</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-[10px] text-white/30">👁 {stats.views.toLocaleString("fr-FR")} vues</span>
                  <span className="text-[10px] text-white/30">❤️ {stats.likes.toLocaleString("fr-FR")} likes</span>
                  {poseTime && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      ⏱ {poseTime}
                    </span>
                  )}
                </div>
                <p className="text-[11px] opacity-60 mb-4 leading-relaxed">
                  {style.description || "Un style unique adapt\u00e9 à ta morphologie"}
                </p>
                {style.tags && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {style.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-[10px] bg-white/10 text-white/70 px-3 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <div className="absolute -top-2.5 -right-2.5 z-10">
                    <span className="text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg"
                      style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#1A0A00", boxShadow: "0 0 10px rgba(201,150,58,0.5)" }}>
                      ⏳ {'Bient\u00f4t'}
                    </span>
                  </div>
                  <button onClick={() => setShowVirtualTryOnModal(true)}
                    className="w-full py-4 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, rgba(201,150,58,0.08), rgba(201,150,58,0.03))", border: "1.5px solid rgba(201,150,58,0.25)" }}>
                    <motion.div className="absolute inset-0 -skew-x-12 pointer-events-none"
                      style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,150,58,0.08) 50%, transparent 100%)" }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }} />
                    <span className="flex items-center justify-center relative">
                      <span className="text-white/60 font-semibold text-sm">Tester ce style</span>
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }} className="mt-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-white/30 uppercase tracking-widest whitespace-nowrap">Envie de plus ?</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerateMore} disabled={generating}
          className="w-full py-4 rounded-2xl font-semibold text-sm disabled:opacity-50 transition-all"
          style={{ background: "rgba(201,150,58,0.06)", border: "1px solid rgba(201,150,58,0.2)" }}>
          <span className="flex items-center justify-center gap-2 text-[#C9963A]/80">
            {generating ? '⏳ G\u00e9n\u00e9ration...' : '✨ Voir 3 autres styles'}
            <span className="text-[9px] bg-[#C9963A]/10 border border-[#C9963A]/20 text-[#C9963A]/70 px-2 py-0.5 rounded-full font-bold">1 cr\u00e9dit</span>
          </span>
          <p className="text-[10px] text-white/20 mt-1 font-normal">Solde : {credits} cr\u00e9dit{credits > 1 ? "s" : ""}</p>
        </motion.button>
      </motion.div>

      {unlockedPages > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex flex-col items-center gap-4">
          <p className="text-[11px] text-white/40 uppercase tracking-widest">Page {currentPage} / {unlockedPages}</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center disabled:opacity-30 active:scale-95">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            {Array.from({ length: unlockedPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => goToPage(page)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition-all active:scale-95 ${page === currentPage ? "text-[#2C1A0E] shadow-lg" : "bg-white/10 border border-white/10 text-white/60"}`}
                style={page === currentPage ? { background: "linear-gradient(135deg, #C9963A, #E8B96A)" } : {}}>
                {page}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === unlockedPages}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center disabled:opacity-30 active:scale-95">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </motion.div>
      )}

      <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-2">
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center shadow-xl"
          style={{ width: 52, height: 52, background: "linear-gradient(135deg, #FAF4EC, #fff)", borderRadius: 14, border: "2px solid rgba(201,150,58,0.5)", boxShadow: "0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(201,150,58,0.15)" }}>
          <div className="text-[8px] font-black uppercase leading-tight" style={{ color: "rgba(44,26,14,0.5)" }}>Solde</div>
          <div className="font-black leading-none" style={{ fontSize: 22, color: "#2C1A0E" }}>{credits}</div>
        </motion.div>
        <motion.button initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }} whileTap={{ scale: 0.9 }} disabled={generating}
          onClick={handleGenerateMore}
          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-lg relative active:scale-95 transition-all disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
          <span className="text-[6px] font-black text-[#2C1A0E] uppercase leading-none mb-0.5">{generating ? "..." : "Gen"}</span>
          <span className="text-base">✨</span>
          <div className="absolute -top-1 -right-1 bg-[#1A0A00] text-[#C9963A] text-[7px] px-1 rounded-full font-bold border border-[#C9963A]">-1</div>
        </motion.button>
      </div>

      <AnimatePresence>
        {showVirtualTryOnModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center px-6"
            style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowVirtualTryOnModal(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="w-full max-w-xs rounded-3xl p-7 text-center"
              style={{ background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)", border: "1.5px solid rgba(201,150,58,0.4)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
              onClick={(e) => e.stopPropagation()}>
              <div className="text-4xl mb-3">✨</div>
              <h2 className="font-black text-xl text-white mb-2">{'Bient\u00f4t disponible'}</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(250,244,236,0.55)" }}>
                Votre essayage virtuel arrive prochainement.
              </p>
              <button onClick={() => setShowVirtualTryOnModal(false)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-[#2C1A0E]"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
                {'OK, j\u2019attends ! 🙌'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center backdrop-blur-xl"
            style={{ padding: "16px", paddingBottom: "96px" }}
            onClick={() => setZoomImage(null)}>
            <div className="flex flex-col items-center w-full max-w-sm gap-4" onClick={(e) => e.stopPropagation()}>
              <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                onClick={() => setZoomImage(null)}
                className="self-end w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", color: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                ✕
              </motion.button>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full">
                <img src={zoomImage} alt="Zoom"
                  className="w-full rounded-3xl shadow-2xl border border-white/10"
                  draggable={false} onContextMenu={(e) => e.preventDefault()}
                  style={{ objectFit: "cover", maxHeight: "60dvh", userSelect: "none", WebkitUserSelect: "none" }} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

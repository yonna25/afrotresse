import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, hasCredits } from "../services/credits.js";

// ─── Constantes ───────────────────────────────────────────────────────────────

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. Une structure \u00e9quilibr\u00e9e qui s'adapte \u00e0 presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Les tresses hautes allongent et affinent visuellement tes traits.",
  square:  "Ton visage est de forme Carr\u00e9e. Les tresses avec du volume adoucissent ta m\u00e2choire.",
  heart:   "Ton visage est en forme de C\u0153ur. Les tresses avec du volume en bas \u00e9quilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses lat\u00e9rales cr\u00e9ent l'harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
};

const TEASER_STYLES = [
  { key: "boxbraids",      label: "Box Braids" },
  { key: "cornrows",       label: "Cornrows" },
  { key: "knotlessbraids", label: "Knotless Braids" },
  { key: "twists",         label: "Twists" },
  { key: "fulanibraids",   label: "Fulani Braids" },
  { key: "goddessbraids",  label: "Goddess Braids" },
];

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

// ─── Composant principal ──────────────────────────────────────────────────────
export default function Results() {
  const navigate = useNavigate();

  const [faceShape, setFaceShape]     = useState("oval");
  const [selfieUrl, setSelfieUrl]     = useState(null);
  const [styles, setStyles]           = useState([]);
  const [credits, setCredits]         = useState(0);
  const [zoomImage, setZoomImage]     = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [showVirtualTryOnModal, setShowVirtualTryOnModal] = useState(false);

  // Sauvegarde profil
  const [savePrenom, setSavePrenom]   = useState(() => localStorage.getItem("afrotresse_user_name") || "");
  const [saveEmail, setSaveEmail]     = useState(() => localStorage.getItem("afrotresse_email") || "");
  const [saveDone, setSaveDone]       = useState(() => !!localStorage.getItem("afrotresse_email"));
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("afrotresse_user_name") || "");
  const [saveOpen, setSaveOpen]       = useState(() => !localStorage.getItem("afrotresse_email"));

  // Favoris
  const FREE_FAV_LIMIT = 3;
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("afrotresse_session_favs") || "[]"); }
    catch { return []; }
  });

  // Pagination
  const [currentPage, setCurrentPage]     = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));

  // Stats
  const [styleStats, setStyleStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("afrotresse_style_stats") || "{}"); }
    catch { return {}; }
  });

  const topRef   = useRef(null);
  const errorRef = useRef(null);
  const userName = localStorage.getItem("afrotresse_user_name") || "Reine";

  // ── Init depuis sessionStorage ──────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFaceShape(parsed.faceShape || "oval");
        const recs = parsed.recommendations || [];
        setStyles(recs);
        if (recs.length > 0) setShowFireworks(true);
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
    setCredits(getCredits());
  }, []);

  // Vues/likes en temps réel
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

  // Pagination
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

  const goToPage = (page) => {
    setCurrentPage(page);
    localStorage.setItem("afrotresse_current_page", String(page));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGenerateMore = () => {
    if (!hasCredits()) { navigate("/credits"); return; }
    consumeCredits(1);
    setCredits(getCredits());
    const nextPage = unlockedPages + 1;
    setUnlockedPages(nextPage);
    setCurrentPage(nextPage);
    localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
    localStorage.setItem("afrotresse_current_page", String(nextPage));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveProfile = () => {
    const nom = savePrenom.trim() || "Reine";
    localStorage.setItem("afrotresse_user_name", nom);
    setDisplayName(nom);
    if (saveEmail.trim()) localStorage.setItem("afrotresse_email", saveEmail.trim());
    setSaveDone(true);
  };

  const isFav = (styleId) => favorites.some(f => f === styleId);

  const handleToggleFav = (style) => {
    if (isFav(style.id)) {
      const updated = favorites.filter(f => f !== style.id);
      setFavorites(updated);
      sessionStorage.setItem("afrotresse_session_favs", JSON.stringify(updated));
      const saved = JSON.parse(localStorage.getItem("afrotresse_saved_styles") || "[]");
      localStorage.setItem("afrotresse_saved_styles", JSON.stringify(saved.filter(s => s.id !== style.id)));
      return;
    }
    const creditsFree = !localStorage.getItem("afrotresse_email");
    if (creditsFree && favorites.length >= FREE_FAV_LIMIT) {
      setErrorMsg("\ud83d\udca8 Limite de 3 favoris gratuits atteinte \u2014 sauvegarde ton compte pour en ajouter plus\u00a0!");
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      return;
    }
    const updated = [...favorites, style.id];
    setFavorites(updated);
    sessionStorage.setItem("afrotresse_session_favs", JSON.stringify(updated));
    const saved = JSON.parse(localStorage.getItem("afrotresse_saved_styles") || "[]");
    if (!saved.find(s => s.id === style.id)) {
      saved.push({ ...style, savedAt: new Date().toISOString() });
      localStorage.setItem("afrotresse_saved_styles", JSON.stringify(saved));
    }
  };

  const faceText = FACE_SHAPE_TEXTS[faceShape] || "";

  // ══════════════════════════════════════════════════════════════════════════
  // OPTION A — Nouvelle utilisatrice, aucun résultat
  // ══════════════════════════════════════════════════════════════════════════
  if (!styles.length) {
    return (
      <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] flex flex-col relative overflow-hidden">

        {/* Hero couronne */}
        <div className="relative h-52 overflow-hidden bg-[#2C1A0E] flex items-center justify-center">
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(160deg, rgba(201,150,58,0.15) 0%, rgba(44,26,14,0.7) 100%)" }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="text-5xl mb-3">
              \ud83d\udc51
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white font-black text-2xl text-center px-4 leading-tight">
              Tes styles parfaits<br />
              <span className="text-[#C9963A]">t&apos;attendent</span>
            </motion.p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24"
            style={{ background: "linear-gradient(to bottom, transparent, #2C1A0E)" }} />
        </div>

        <div className="flex flex-col flex-1 px-5 pt-2 pb-32">

          {/* Titre + accroche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }} className="mb-5">
            <h2 className="text-xl font-black text-white mb-2">
              D\u00e9couvre les tresses faites pour toi \ud83d\udcdb
            </h2>
            <p className="text-[12px] text-white/50 leading-relaxed">
              Un selfie suffit. Notre IA analyse la forme de ton visage et te recommande les styles qui te mettront le plus en valeur.
            </p>
          </motion.div>

          {/* 3 étapes numérotées */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }} className="flex flex-col gap-3 mb-8">
            {[
              { icon: "\ud83d\udcf8", label: "Prends un selfie",            sub: "Ou uploade une photo existante" },
              { icon: "\ud83d\udd0d", label: "Analyse IA instantan\u00e9e", sub: "Forme de visage d\u00e9tect\u00e9e en secondes" },
              { icon: "\u2728",       label: "Styles personnalis\u00e9s",    sub: "3 recommandations taill\u00e9es pour toi" },
            ].map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <span className="text-2xl">{step.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white leading-none">{step.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{step.sub}</p>
                </div>
                <div className="ml-auto w-6 h-6 rounded-full bg-[#C9963A]/20 border border-[#C9963A]/40 flex items-center justify-center">
                  <span className="text-[#C9963A] text-[10px] font-black">{i + 1}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Aperçu styles floutés */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }} className="mb-8">
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 text-center">
              Styles qui t&apos;attendent
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {TEASER_STYLES.map((s, i) => (
                <motion.div key={s.key}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className="relative h-24 rounded-2xl overflow-hidden">
                  <img src={`/styles/${s.key}-face.jpg`} alt={s.label}
                    className="w-full h-full object-cover"
                    style={{ filter: "brightness(0.45) blur(1px)" }}
                    draggable={false} onContextMenu={(e) => e.preventDefault()} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <span className="text-white/50 text-lg">\ud83d\udd12</span>
                    <span className="text-[9px] text-white/30 font-semibold text-center px-1 leading-tight">
                      {s.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/camera")}
            className="w-full py-5 rounded-2xl font-black text-lg text-[#2C1A0E] shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #C9963A, #E8B96A)",
              boxShadow: "0 0 30px rgba(201,150,58,0.4)",
            }}>
            \ud83d\udcf8 Prendre mon selfie
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-[10px] text-white/30 mt-3">
            2 cr\u00e9dits offerts \u2022 Aucune inscription requise
          </motion.p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ÉCRAN RÉSULTATS
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">

      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}

      <div ref={topRef} />

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10"
        style={{ boxShadow: "0 0 40px rgba(201,150,58,0.2)" }}>
        <div className="relative shrink-0">
          {selfieUrl ? (
            <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi"
              draggable={false} onContextMenu={(e) => e.preventDefault()} />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-white/50">Photo</div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md uppercase">Moi</div>
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-bold text-3xl text-[#C9963A]">
            {displayName
              ? <><span className="text-[#FAF4EC]">{displayName}</span>, voici tes r\u00e9sultats \u2728</>
              : <>Voici tes r\u00e9sultats \u2728</>
            }
          </h1>
          <p className="text-[11px] opacity-80 leading-tight mt-1 max-w-xs">{faceText}</p>
        </div>
      </motion.div>

      {/* ALERTE VOLATILITÉ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-3"
        style={{ background: "rgba(201,150,58,0.08)", border: "1px solid rgba(201,150,58,0.25)" }}>
        <span className="text-lg mt-0.5">\u26a0\ufe0f</span>
        <p className="text-[11px] text-white/60 leading-relaxed">
          <span className="text-[#C9963A] font-bold">Tes r\u00e9sultats ne sont pas sauvegard\u00e9s.</span>
          {" "}Ajoute tes styles en favoris ou sauvegarde ton compte ci-dessous.
        </p>
      </motion.div>

      {/* BLOC SAUVEGARDE — FIX: bouton Modifier quand déjà sauvegardé */}
      {saveDone ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-6 px-4 py-3 rounded-2xl flex items-center justify-between gap-3"
          style={{ background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.3)" }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">\u2705</span>
            <p className="text-[12px] text-green-300 font-semibold">
              Sauvegard\u00e9 pour <span className="font-black">{displayName || saveEmail}</span>\u00a0!
            </p>
          </div>
          <button
            onClick={() => setSaveDone(false)}
            className="text-[10px] text-white/40 underline shrink-0 active:opacity-60">
            Modifier
          </button>
        </motion.div>
      ) : (
        <div className="mb-6 rounded-[2rem] overflow-hidden"
          style={{ background: "linear-gradient(135deg, #3D2616, #2C1A0E)", border: "1.5px solid rgba(201,150,58,0.35)" }}>
          <button onClick={() => setSaveOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 active:opacity-80 transition-opacity">
            <span className="font-black text-sm text-white">Sauvegarder mes r\u00e9sultats \u2728</span>
            <motion.span animate={{ rotate: saveOpen ? 180 : 0 }} transition={{ duration: 0.25 }}
              className="text-[#C9963A] text-base leading-none">&#9662;</motion.span>
          </button>
          <AnimatePresence initial={false}>
            {saveOpen && (
              <motion.div key="save-form"
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}>
                <div className="px-5 pb-5">
                  <p className="text-[11px] text-white/50 mb-4">
                    Retrouve tes favoris sur n&apos;importe quel appareil.
                  </p>
                  <div className="flex flex-col gap-2 mb-3">
                    <input type="text" placeholder="Ton pr\u00e9nom..."
                      value={savePrenom} onChange={e => setSavePrenom(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none"
                      style={{ background: "rgba(92,51,23,0.5)", border: "1px solid rgba(201,150,58,0.3)", color: "#FAF4EC" }} />
                    <input type="email" placeholder="Ton email..."
                      value={saveEmail} onChange={e => setSaveEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSaveProfile()}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none"
                      style={{ background: "rgba(92,51,23,0.5)", border: "1px solid rgba(201,150,58,0.3)", color: "#FAF4EC" }} />
                  </div>
                  <button onClick={handleSaveProfile}
                    className="w-full py-3 rounded-xl font-black text-sm text-[#2C1A0E]"
                    style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
                    Sauvegarder mes r\u00e9sultats \u2728
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* MESSAGE ERREUR */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div ref={errorRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-4 border rounded-xl p-3 ${errorMsg.includes("\u2705") || errorMsg.includes("\u2728") ? "bg-green-900/30 border-green-500/50" : "bg-red-900/30 border-red-500/50"}`}>
            <p className={errorMsg.includes("\u2705") || errorMsg.includes("\u2728") ? "text-green-200 text-sm" : "text-red-200 text-sm"}>
              {errorMsg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARDS STYLES */}
      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {
          const styleKey = style.id?.replace(/-/g, "") || style.id;
          const faceImg  = style.views?.face || `/styles/${styleKey}-face.jpg`;
          const backImg  = style.views?.back || `/styles/${styleKey}-back.jpg`;
          const topImg   = style.views?.top  || `/styles/${styleKey}-top.jpg`;

          return (
            <motion.div key={style.id || index}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">

              {/* Galerie 3 vues — FIX: image principale remplit le casier + zoom au tap */}
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden cursor-pointer"
                  onClick={() => setZoomImage(faceImg)}>
                  <img
                    src={faceImg}
                    alt={style.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ userSelect: "none", WebkitUserSelect: "none" }}
                  />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <div className="overflow-hidden">
                    <img src={backImg} alt="dos" className="w-full h-full object-cover"
                      onClick={() => setZoomImage(backImg)}
                      draggable={false} onContextMenu={(e) => e.preventDefault()}
                      style={{ userSelect: "none", WebkitUserSelect: "none", cursor: "pointer" }} />
                  </div>
                  <div className="overflow-hidden">
                    <img src={topImg} alt="dessus" className="w-full h-full object-cover"
                      onClick={() => setZoomImage(topImg)}
                      draggable={false} onContextMenu={(e) => e.preventDefault()}
                      style={{ userSelect: "none", WebkitUserSelect: "none", cursor: "pointer" }} />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-6 py-3 flex gap-5 text-[10px] font-black uppercase tracking-widest text-[#C9963A]/80 border-b border-white/5">
                <span>\ud83d\udc41\ufe0f {(styleStats[style.id]?.views || 0).toLocaleString("fr-FR")} vues</span>
                <span>\u2764\ufe0f {(styleStats[style.id]?.likes || 0).toLocaleString("fr-FR")} likes</span>
              </div>

              {/* Infos + actions */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl">{style.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-md font-black uppercase">
                      {style.duration || "3-5h"}
                    </span>
                    <button onClick={() => handleToggleFav(style)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                      style={{
                        background: isFav(style.id) ? "rgba(201,150,58,0.25)" : "rgba(255,255,255,0.05)",
                        border: isFav(style.id) ? "1.5px solid #C9963A" : "1.5px solid rgba(255,255,255,0.1)",
                      }}>
                      <span className="text-base">{isFav(style.id) ? "\u2764\ufe0f" : "\ud83e\udd0d"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] opacity-70 mb-6 leading-relaxed">
                  {style.description || "Un style unique adapt\u00e9 \u00e0 ta morphologie"}
                </p>

                <div className="flex gap-2 flex-wrap mb-4">
                  {(style.tags || ["Tendance", "\u00c9l\u00e9gant"]).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-white/10 text-white/80 px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>

                {/* Virtual Try-On — Coming Soon */}
                <button onClick={() => setShowVirtualTryOnModal(true)}
                  className="w-full py-4 rounded-2xl font-bold text-base active:scale-[0.98] transition-all relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(201,150,58,0.08), rgba(201,150,58,0.03))",
                    border: "1.5px solid rgba(201,150,58,0.25)",
                  }}>
                  <motion.div className="absolute inset-0 -skew-x-12 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent 0%, rgba(201,150,58,0.08) 50%, transparent 100%)" }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }} />
                  <span className="flex items-center justify-center gap-2.5 relative">
                    <span className="text-lg">\ud83e\uddd6\u200d\u2640\ufe0f</span>
                    <span className="text-white/50 font-bold text-sm">Essayer virtuellement</span>
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#2C1A0E", boxShadow: "0 0 10px rgba(201,150,58,0.4)" }}>
                      \u23f3 Bient\u00f4t
                    </span>
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* VOIR 3 AUTRES STYLES */}
      {currentPage === 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }} className="mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Envie de plus\u00a0?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerateMore}
            className="w-full max-w-xs py-5 rounded-2xl font-black text-base relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #3D2616, #4A2E1A)",
              border: "1.5px solid rgba(201,150,58,0.4)",
              boxShadow: "0 0 30px rgba(201,150,58,0.1)",
            }}>
            <span className="flex items-center justify-center gap-2 text-[#C9963A]">
              \u2728 Voir 3 autres styles
              <span className="text-[10px] bg-[#C9963A]/20 border border-[#C9963A]/40 text-[#C9963A] px-2 py-0.5 rounded-full font-black">
                1 cr\u00e9dit
              </span>
            </span>
            <p className="text-[10px] text-white/30 mt-1 font-normal">
              Solde actuel\u00a0: {credits} cr\u00e9dit{credits > 1 ? "s" : ""}
            </p>
          </motion.button>
        </motion.div>
      )}

      {/* PAGINATION */}
      {unlockedPages > 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex flex-col items-center gap-4">
          <p className="text-[11px] text-white/40 uppercase tracking-widest">
            Page {currentPage} / {unlockedPages}
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center disabled:opacity-30 transition-all active:scale-95">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {Array.from({ length: unlockedPages }, (_, i) => i + 1).map((page) => (
              <button key={page} onClick={() => goToPage(page)}
                className={`w-10 h-10 rounded-xl font-black text-sm transition-all active:scale-95 ${page === currentPage ? "text-[#2C1A0E] shadow-lg" : "bg-white/10 border border-white/10 text-white/60"}`}
                style={page === currentPage ? { background: "linear-gradient(135deg, #C9963A, #E8B96A)" } : {}}>
                {page}
              </button>
            ))}
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === unlockedPages}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center disabled:opacity-30 transition-all active:scale-95">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[#C9963A]/60">
            Solde\u00a0: {credits} cr\u00e9dit{credits > 1 ? "s" : ""}
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerateMore}
            className="mt-2 px-6 py-3 rounded-2xl font-bold text-sm relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #3D2616, #4A2E1A)", border: "1.5px solid rgba(201,150,58,0.4)" }}>
            <span className="flex items-center gap-2 text-[#C9963A]">
              \u2728 Voir 3 autres styles
              <span className="text-[9px] bg-[#C9963A]/20 border border-[#C9963A]/40 text-[#C9963A] px-1.5 py-0.5 rounded-full font-black">
                -1 cr\u00e9dit
              </span>
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* MODALE VIRTUAL TRY-ON */}
      <AnimatePresence>
        {showVirtualTryOnModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-8"
            style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(12px)" }}
            onClick={() => setShowVirtualTryOnModal(false)}>
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="w-full max-w-sm rounded-[2.5rem] p-8 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
                border: "2px solid rgba(201,150,58,0.5)",
                boxShadow: "0 0 60px rgba(201,150,58,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.1, duration: 0.5 }} className="text-5xl mb-4">\ud83e\uddd6\u200d\u2640\ufe0f</motion.div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#2C1A0E" }}>
                Bient\u00f4t disponible
              </span>
              <h2 className="text-2xl font-black text-white mt-3 mb-2 leading-tight">
                Virtual Try-On \u2728
              </h2>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Vois-toi <span className="text-[#C9963A] font-bold">r\u00e9ellement</span> avec la coiffure gr\u00e2ce \u00e0 notre IA \u2014 disponible tr\u00e8s bient\u00f4t\u00a0!
              </p>
              <div className="flex flex-col gap-3 mb-6">
                {[
                  { icon: "\ud83d\udcf8", text: "Superposition IA sur ton selfie" },
                  { icon: "\ud83c\udfa8", text: "Rendu r\u00e9aliste en quelques secondes" },
                  { icon: "\ud83d\udcbe", text: "Sauvegarde & partage facilement" },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-left">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-white/70 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              <button onClick={() => setShowVirtualTryOnModal(false)}
                className="w-full py-4 rounded-2xl font-black text-[#2C1A0E] text-base"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
                J&apos;ai h\u00e2te\u00a0! \ud83d\udd25
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setZoomImage(null)} onContextMenu={(e) => e.preventDefault()}>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <img src={zoomImage} alt="Zoom"
                  className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/10"
                  draggable={false} onContextMenu={(e) => e.preventDefault()}
                  style={{ objectFit: "contain", userSelect: "none", WebkitUserSelect: "none" }} />
              </motion.div>
              <div className="absolute inset-0 rounded-3xl"
                onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
            </div>
            <div className="mt-10 flex gap-4 w-full max-w-xs">
              <button onClick={() => setZoomImage(null)}
                className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10">
                \u2715 Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOUTONS FLOTTANTS */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-2">
        <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={() => navigate("/credits")}
          className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-lg flex flex-col items-center justify-center shadow-lg border border-[#2C1A0E]/20 active:scale-95 transition-all cursor-pointer">
          <div className="text-[5px] font-black uppercase opacity-60 leading-tight">Solde</div>
          <div className="text-xl font-black leading-none">{credits}</div>
        </motion.div>
        <motion.button initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.95 }} onClick={handleGenerateMore}
          className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shadow-lg relative border border-white/10 active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
          <span className="text-[6px] font-black text-[#2C1A0E] uppercase leading-none">Gen</span>
          <span className="text-base">\u2728</span>
          <div className="absolute -top-1 -right-1 bg-[#2C1A0E] text-[#C9963A] text-[7px] px-1 py-0 rounded-full font-bold border border-[#C9963A]">
            -1
          </div>
        </motion.button>
      </div>

    </div>
  );
}

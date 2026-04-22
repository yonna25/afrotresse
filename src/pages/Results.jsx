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
  const [credits, setCredits]         = useState(0);
  const [zoomImage, setZoomImage]     = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [showVirtualTryOnModal, setShowVirtualTryOnModal] = useState(false);
  const [stableMsg, setStableMsg]     = useState({ headline: "Voici tes résultats ✨", subtext: "" });

  // Sauvegarde profil
  const [savePrenom, setSavePrenom]   = useState(() => localStorage.getItem("afrotresse_user_name") || "");
  const [saveEmail, setSaveEmail]     = useState(() => localStorage.getItem("afrotresse_email") || "");
  const [saveDone, setSaveDone]       = useState(() => !!localStorage.getItem("afrotresse_email"));
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("afrotresse_user_name") || "");
  const [saveOpen, setSaveOpen]       = useState(false);

  // Favoris — source unique via hook
  const {
    favorites,
    count: favCount,
    isFav,
    toggleFav,
    canAddMore,
    FREE_LIMIT,
  } = useFavorites();

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

  // ── Détection navigation fraîche (pas refresh ni retour arrière) ───────────
  // ── Flag posé par Analyze.jsx juste avant navigate("/results") ──────────
  const consumeFireworksFlag = () => {
    const flag = sessionStorage.getItem("afrotresse_trigger_fireworks");
    if (flag) {
      sessionStorage.removeItem("afrotresse_trigger_fireworks");
      return true;
    }
    return false;
  };

  // Déclencher fireworks depuis n'importe quel endroit (ex : VTO résultat)
  const triggerFireworks = () => setShowFireworks(true);

  // ── Init depuis sessionStorage ──────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFaceShape(parsed.faceShape || "oval");
        const recs = parsed.recommendations || [];
        setStyles(recs);
        // Fireworks uniquement si navigation fraîche depuis l'analyse
        if (recs.length > 0 && consumeFireworksFlag()) {
          setShowFireworks(true);
          resetMessageAssignment();
        }
        // Génère le message stable dès que faceShape + prénom sont connus
        const sessionId   = getOrCreateSessionId();
        const name        = localStorage.getItem("afrotresse_user_name") || "";
        const confidence  = parsed.confidence ?? 0.5;
        const shape       = parsed.faceShape || "oval";
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
    syncCreditsFromServer().then(c => setCredits(c)).catch(() => setCredits(getCredits()));
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

  // ── Anti-doublons : styles déjà affichés cette session ────────
  const getSeenIdsThisSession = () => {
    try { return JSON.parse(sessionStorage.getItem("afrotresse_seen_ids") || "[]"); }
    catch { return []; }
  };

  const markStylesSeen = (styleList) => {
    const seen = getSeenIdsThisSession();
    const newIds = styleList.map(s => s.id).filter(id => !seen.includes(id));
    if (newIds.length > 0) {
      sessionStorage.setItem("afrotresse_seen_ids", JSON.stringify([...seen, ...newIds]));
    }
  };

  const getPageStyles = (page) => {
    const total = styles.length;
    if (total === 0) return [];
    const baseSeed = userName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 12345);
    const stylesPerShuffle = Math.floor(total / STYLES_PER_PAGE) * STYLES_PER_PAGE || STYLES_PER_PAGE;
    const shuffleIndex = Math.floor(((page - 1) * STYLES_PER_PAGE) / stylesPerShuffle);
    const positionInShuffle = ((page - 1) * STYLES_PER_PAGE) % stylesPerShuffle;
    const shuffled = getShuffledStyles(baseSeed + shuffleIndex * 9973);

    // Exclure les styles déjà vus cette session (sauf page 1)
    const seenIds = page > 1 ? getSeenIdsThisSession() : [];
    const unseen = shuffled.filter(s => !seenIds.includes(s.id));
    const pool = unseen.length >= STYLES_PER_PAGE ? unseen : shuffled;

    const result = [];
    for (let i = 0; i < STYLES_PER_PAGE; i++) result.push(pool[(positionInShuffle + i) % pool.length]);
    return result;
  };

  const displayedStyles = getPageStyles(currentPage);

  // Marquer les styles affichés comme vus
  useEffect(() => {
    if (displayedStyles.length > 0) markStylesSeen(displayedStyles);
  }, [currentPage]); // eslint-disable-line
  const maxPages = styles.length > 0 ? Math.ceil(styles.length / STYLES_PER_PAGE) : 2;
  const allStylesSeen = currentPage >= maxPages;

  const goToPage = (page) => {
    setCurrentPage(page);
    localStorage.setItem("afrotresse_current_page", String(page));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleGenerateMore = () => {
    if (credits === 0) { navigate("/credits"); return; }
    // Déduire localement (instantané, pas de blocage)
    const ok = consumeCredits(1);
    if (!ok) { navigate("/credits"); return; }
    setCredits(getCredits());
    // Sync Supabase en arrière-plan sans bloquer l'UI
    syncCreditsFromServer().catch(() => {});
    const nextPage = unlockedPages + 1;
    setUnlockedPages(nextPage);
    setCurrentPage(nextPage);
    localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
    localStorage.setItem("afrotresse_current_page", String(nextPage));
    setShowFireworks(true);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Fin de catalogue ────────────────────────────────────────
  const [showCatalogueEnd, setShowCatalogueEnd] = useState(false);

  // Détection : tous les styles du catalogue global vus cette session
  const TOTAL_CATALOGUE = styles.length; // 6 styles par forme
  const allCatalogueSeen = () => {
    const seen = getSeenIdsThisSession();
    return TOTAL_CATALOGUE > 0 && seen.length >= TOTAL_CATALOGUE;
  };

  const handleDiscoverMore = () => {
    if (credits <= 0) { navigate("/credits"); return; }
    const ok = consumeCredits(1);
    if (!ok) { navigate("/credits"); return; }
    setCredits(getCredits());
    syncCreditsFromServer().catch(() => {});
    // Vider les styles vus sauf les 2 derniers (éviter répétition immédiate)
    const seen = getSeenIdsThisSession();
    const keep = seen.slice(-2);
    sessionStorage.setItem("afrotresse_seen_ids", JSON.stringify(keep));
    // Reset pagination et shuffle
    const nextPage = unlockedPages + 1;
    setUnlockedPages(nextPage);
    setCurrentPage(nextPage);
    localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
    localStorage.setItem("afrotresse_current_page", String(nextPage));
    setShowCatalogueEnd(false);
    setShowFireworks(true);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Déclencher la détection après chaque changement de page
  useEffect(() => {
    if (allCatalogueSeen()) setShowCatalogueEnd(true);
  }, [currentPage, styles]); // eslint-disable-line

  const handleSaveProfile = () => {
    const nom = savePrenom.trim() || "Reine";
    localStorage.setItem("afrotresse_user_name", nom);
    setDisplayName(nom);
    if (saveEmail.trim()) localStorage.setItem("afrotresse_email", saveEmail.trim());
    setSaveDone(true);
    // Régénère le headline avec le prénom maintenant connu
    setStableMsg(prev => ({
      ...prev,
      headline: `Voici tes résultats ${nom} ✨`,
    }));
  };

  // ── Gestion favori — délègue au hook, affiche erreur si limite atteinte ──
  const handleToggleFav = (style) => {
    const result = toggleFav(style);
    if (result && !result.success && result.reason === "limit_reached") {
      setErrorMsg(`💎 Limite de ${FREE_LIMIT} favoris gratuits atteinte — sauvegarde ton compte pour en ajouter plus !`);
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // OPTION A — Nouvelle utilisatrice, aucun résultat
  // ══════════════════════════════════════════════════════════════════════════
  if (!styles.length) {
    return (
      <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] flex flex-col relative overflow-hidden">

        {/* Hero couronne */}
        <div className="relative h-52 overflow-hidden bg-[#1A0A00] flex items-center justify-center">
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(160deg, rgba(201,150,58,0.15) 0%, rgba(44,26,14,0.7) 100%)" }}>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="text-5xl mb-3">
              👑
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white font-black text-2xl text-center px-4 leading-tight">
              Tes styles parfaits<br />
              <span className="text-[#C9963A]">t'attendent</span>
            </motion.p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24"
            style={{ background: "linear-gradient(to bottom, transparent, #1A0A00)" }} />
        </div>

        <div className="flex flex-col flex-1 px-5 pt-2 pb-32">

          {/* Titre + accroche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }} className="mb-5">
            <h2 className="text-xl font-black text-white mb-2">
              Découvre les tresses faites pour toi 💛
            </h2>
            <p className="text-[12px] text-white/50 leading-relaxed">
              Un selfie suffit. Notre technologie lit les proportions de ton visage et sélectionne les styles faits pour toi.
            </p>
          </motion.div>

          {/* 3 étapes numérotées */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }} className="flex flex-col gap-3 mb-8">
            {[
              { icon: "📸", label: "Prends un selfie",            sub: "Ou uploade une photo existante" },
              { icon: "🔍", label: "Lecture de visage",            sub: "Tes proportions analysées en secondes" },
              { icon: "✨", label: "Styles personnalisés",         sub: "3 recommandations taillées pour toi" },
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
            📸 Prendre mon selfie
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-[10px] text-white/30 mt-3">
            2 crédits offerts • Aucune inscription requise
          </motion.p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ÉCRAN RÉSULTATS
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">

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
          <h1 className="font-bold text-2xl text-[#C9963A] leading-tight">
            {displayName
              ? <>Voici tes résultats <span className="text-white">{displayName}</span> ✨</>
              : stableMsg.headline
            }
          </h1>
          <p className="text-[11px] opacity-80 leading-snug mt-1.5 max-w-xs">{stableMsg.subtext}</p>
        </div>
      </motion.div>

      {/* NOTIFICATION STATUT COMPTE */}
      {saveDone ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{ background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.25)" }}>
          <span className="text-lg">✅</span>
          <p className="text-[12px] text-green-300 font-semibold">
            Compte enregistré{displayName ? <> — <span className="font-black">{displayName}</span></> : ""}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-3"
          style={{
            background: credits === 0
              ? "rgba(255,80,80,0.08)"
              : credits === 1
              ? "rgba(201,150,58,0.12)"
              : "rgba(201,150,58,0.08)",
            border: credits === 0
              ? "1px solid rgba(255,80,80,0.3)"
              : "1px solid rgba(201,150,58,0.25)"
          }}>
          <span className="text-lg mt-0.5">
            {credits === 0 ? "🚫" : credits === 1 ? "⏳" : "⚠️"}
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] text-white/60 leading-relaxed">
              <span className="text-[#C9963A] font-bold">Tes résultats ne sont pas sauvegardés.</span>
              {" "}Ajoute tes styles en favoris ou sauvegarde ton compte ci-dessous.
            </p>
            {credits === 1 && (
              <p className="text-[11px] text-[#E8B96A] font-bold mt-1">
                ⚡ Il te reste 1 analyse gratuite — inscris-toi pour ne pas la perdre.
              </p>
            )}
            {credits === 0 && (
              <p className="text-[11px] text-red-300 font-bold mt-1">
                Tes analyses gratuites sont terminées — crée un compte pour continuer.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* BLOC SAUVEGARDE (accordéon — uniquement anonymes) */}
      {!saveDone && (
        <div className="mb-6 rounded-[2rem] overflow-hidden"
          style={{ background: "linear-gradient(135deg, #2C1A0E, #1A0A00)", border: "1.5px solid rgba(201,150,58,0.35)" }}>
          <button onClick={() => setSaveOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 active:opacity-80 transition-opacity">
            <span className="font-black text-sm text-white">Sauvegarder mes résultats ✨</span>
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
                    Retrouve tes favoris sur n'importe quel appareil.
                  </p>
                  <div className="flex flex-col gap-2 mb-3">
                    <input type="text" placeholder="Ton prénom..."
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
                    Sauvegarder mes résultats ✨
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
            className={`mb-4 border rounded-xl p-3 ${errorMsg.includes("✅") || errorMsg.includes("✨") ? "bg-green-900/30 border-green-500/50" : "bg-red-900/30 border-red-500/50"}`}>
            <p className={errorMsg.includes("✅") || errorMsg.includes("✨") ? "text-green-200 text-sm" : "text-red-200 text-sm"}>
              {errorMsg}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CARDS STYLES */}
      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {
          const styleKey = style.id?.replace(/-/g, "") || style.id;
          const faceImg  = style.views?.face || `/styles/${styleKey}-face.webp`;
          const backImg  = style.views?.back || `/styles/${styleKey}-back.webp`;
          const topImg   = style.views?.top  || `/styles/${styleKey}-top.webp`;

          return (
            <motion.div key={style.id || index}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">

              {/* Galerie 3 vues */}
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <img src={faceImg} alt={style.name} className="w-full h-full object-cover cursor-pointer" onClick={() => setZoomImage(faceImg)} draggable={false} onContextMenu={(e) => e.preventDefault()} style={{userSelect:"none"}} />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <div className="overflow-hidden">
                    <img src={backImg} alt="dos" className="w-full h-full object-cover cursor-pointer" onClick={() => setZoomImage(backImg)} draggable={false} onContextMenu={(e) => e.preventDefault()} style={{userSelect:"none"}} />
                  </div>
                  <div className="overflow-hidden">
                    <img src={topImg} alt="dessus" className="w-full h-full object-cover cursor-pointer" onClick={() => setZoomImage(topImg)} draggable={false} onContextMenu={(e) => e.preventDefault()} style={{userSelect:"none"}} />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-6 py-3 flex gap-5 text-[10px] font-black uppercase tracking-widest text-[#C9963A]/80 border-b border-white/5">
                <span>👁️ {(styleStats[style.id]?.views || 0).toLocaleString("fr-FR")} vues</span>
                <span>❤️ {(styleStats[style.id]?.likes || 0).toLocaleString("fr-FR")} likes</span>
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
                      <span className="text-base">{isFav(style.id) ? "❤️" : "🤍"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] opacity-70 mb-6 leading-relaxed">
                  {style.description || "Un style unique adapté à ta morphologie"}
                </p>

                <div className="flex gap-2 flex-wrap mb-4">
                  {(style.tags || ["Tendance", "Élégant"]).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-white/10 text-white/80 px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>

                {/* Virtual Try-On — Coming Soon */}
                <button onClick={() => credits === 0 ? navigate("/credits") : setShowVirtualTryOnModal(true)}
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
                    <span className="text-lg">🧖‍♀️</span>
                    <span className="text-white/50 font-bold text-sm">Essayer virtuellement</span>
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#2C1A0E", boxShadow: "0 0 10px rgba(201,150,58,0.4)" }}>
                      ⏳ Bientôt
                    </span>
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* VOIR 3 AUTRES STYLES / FIN DE CATALOGUE */}
      {currentPage === 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }} className="mt-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Envie de plus ?</span>
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
              ✨ Voir 3 autres styles
              <span className="text-[10px] bg-[#C9963A]/20 border border-[#C9963A]/40 text-[#C9963A] px-2 py-0.5 rounded-full font-black">
                1 crédit
              </span>
            </span>
            <p className="text-[10px] text-white/30 mt-1 font-normal">
              Solde actuel : {credits} crédit{credits > 1 ? "s" : ""}
            </p>
          </motion.button>
        </motion.div>
      )}

      {/* MODULE FIN DE CATALOGUE */}
      <AnimatePresence>
        {showCatalogueEnd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-8"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="w-full max-w-sm rounded-[2.5rem] p-7 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
                border: "2px solid rgba(201,150,58,0.5)",
                boxShadow: "0 0 60px rgba(201,150,58,0.3)",
              }}
            >
              {/* Particules décoratives */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div key={i} className="absolute text-lg"
                    initial={{ opacity: 0, y: 40, x: `${10 + i * 15}%` }}
                    animate={{ opacity: [0, 1, 0], y: -60 }}
                    transition={{ delay: i * 0.2, duration: 2, repeat: Infinity, repeatDelay: 2 }}>
                    {['✨', '👑', '💛', '✨', '👑', '💛'][i]}
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.1, duration: 0.5 }} className="text-5xl mb-3">
                ✨
              </motion.div>

              <h2 className="text-xl font-black text-[#C9963A] mb-1">
                Tu as exploré toutes les suggestions !
              </h2>
              <p className="text-[12px] text-white/50 mb-6 leading-relaxed">
                Prête à découvrir de nouvelles combinaisons ?{" "}
                <span className="text-white/30 italic">Chaque génération peut te surprendre…</span>
              </p>

              {/* CTA principal */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDiscoverMore}
                className="w-full py-4 rounded-2xl font-black text-base text-[#2C1A0E] mb-3 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
              >
                <span className="flex items-center justify-center gap-2">
                  🔀 Découvrir encore des styles
                  <span className="text-[10px] bg-[#2C1A0E]/20 px-2 py-0.5 rounded-full font-black">
                    1 crédit
                  </span>
                </span>
              </motion.button>

              {/* CTA secondaire */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setShowCatalogueEnd(false); navigate("/library"); }}
                className="w-full py-3.5 rounded-2xl font-black text-sm mb-2"
                style={{
                  background: "rgba(201,150,58,0.08)",
                  border: "1.5px solid rgba(201,150,58,0.3)",
                  color: "#C9963A",
                }}
              >
                ❤️ Voir mes favoris
              </motion.button>

              <button
                onClick={() => setShowCatalogueEnd(false)}
                className="w-full py-2 text-xs text-white/20"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            Solde : {credits} crédit{credits > 1 ? "s" : ""}
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleGenerateMore}
            className="mt-2 w-full max-w-xs py-5 rounded-2xl font-black text-base relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #3D2616, #4A2E1A)", border: "1.5px solid rgba(201,150,58,0.4)", boxShadow: "0 0 30px rgba(201,150,58,0.1)" }}>
            <span className="flex items-center justify-center gap-2 text-[#C9963A]">
              ✨ Voir 3 autres styles
              <span className="text-[10px] bg-[#C9963A]/20 border border-[#C9963A]/40 text-[#C9963A] px-2 py-0.5 rounded-full font-black">
                1 crédit
              </span>
            </span>
            <p className="text-[10px] text-white/30 mt-1 font-normal">
              Solde actuel : {credits} crédit{credits > 1 ? "s" : ""}
            </p>
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
                transition={{ delay: 0.1, duration: 0.5 }} className="text-5xl mb-4">🧖‍♀️</motion.div>
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#2C1A0E" }}>
                Bientôt disponible
              </span>
              <h2 className="text-2xl font-black text-white mt-3 mb-2 leading-tight">
                Virtual Try-On ✨
              </h2>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Vois-toi <span className="text-[#C9963A] font-bold">réellement</span> avec la coiffure, avec une précision bluffante — disponible très bientôt !
              </p>
              <div className="flex flex-col gap-3 mb-6">
                {[
                  { icon: "📸", text: "Rendu sur mesure sur ton selfie" },
                  { icon: "🎨", text: "Rendu réaliste en quelques secondes" },
                  { icon: "💾", text: "Sauvegarde & partage facilement" },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-left">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-white/70 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
              {/* Quand le VTO livrera ses résultats : appeler triggerFireworks() ici */}
              <button onClick={() => setShowVirtualTryOnModal(false)}
                className="w-full py-4 rounded-2xl font-black text-[#2C1A0E] text-base"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
                J'ai hâte ! 🔥
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center backdrop-blur-xl"
            style={{ padding: "16px", paddingBottom: "96px" }}
            onClick={() => setZoomImage(null)} onContextMenu={(e) => e.preventDefault()}>
            <div className="flex flex-col items-center w-full max-w-sm gap-4" onClick={(e) => e.stopPropagation()}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full relative">
                <img src={zoomImage} alt="Zoom"
                  className="w-full rounded-3xl shadow-2xl border border-white/10"
                  draggable={false} onContextMenu={(e) => e.preventDefault()}
                  style={{ objectFit: "cover", maxHeight: "52vh", userSelect: "none", WebkitUserSelect: "none" }} />
                <div className="absolute inset-0 rounded-3xl pointer-events-none"
                  onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
              </motion.div>
              <button onClick={() => setZoomImage(null)}
                className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10">
                ✕ Fermer
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
        {!allStylesSeen && (
        <motion.button initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          whileTap={{ scale: 0.95 }} onClick={handleGenerateMore}
          className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shadow-lg relative border border-white/10 active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
          <span className="text-[6px] font-black text-[#2C1A0E] uppercase leading-none">Gen</span>
          <span className="text-base">✨</span>
          <div className="absolute -top-1 -right-1 bg-[#1A0A00] text-[#C9963A] text-[7px] px-1 py-0 rounded-full font-bold border border-[#C9963A]">
            -1
          </div>
        </motion.button>
        )}
      </div>

    </div>
  );
}

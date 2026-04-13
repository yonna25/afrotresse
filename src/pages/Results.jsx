import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeTransform, consumeCredits, hasCredits, canTransform, addSeenStyleId, PRICING } from "../services/credits.js";
import OptimizedImage from "../components/OptimizedImage.jsx";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Cœur. Les tresses avec du volume en bas équilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses latérales créent l'harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
};

const WAITING_MSGS = [
  "Préparation de ton nouveau look... ✨",
  "On ajuste la tresse à ton visage... 👑",
  "Presque là... Prépare-toi à briller ! 😍",
];

const RESULT_MSGS = [
  "Waouh 😍, tu es splendide !",
  "Regarde cette Reine ! ✨",
  "Le style parfait pour toi. 👑",
];

const STYLES_PER_PAGE = 3;

const ProtectedImg = ({ src, alt, className, onClick }) => (
  <div className="relative w-full h-full" onClick={onClick}>
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    />
    <div
      className="absolute inset-0"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  </div>
);

// ─── Pop-up félicitation crédit (local à cette page) ────────────────────────
function CreditSuccessPopup({ data, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full max-w-sm rounded-[2.5rem] p-8 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
          border: "2px solid #C9963A",
          boxShadow: "0 0 60px rgba(201,150,58,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Particules */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {["✨","💎","👑","⭐","✨","💛","👑","💎"].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-lg"
              style={{ left: `${10 + i * 11}%` }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: [0, 1, 0], y: -80 }}
              transition={{ delay: i * 0.15, duration: 1.8, repeat: Infinity, repeatDelay: 1.5 }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-6xl mb-4"
        >
          💎
        </motion.div>

        <h2 className="text-2xl font-black text-[#C9963A] mb-1">
          Félicitations {data.userName} ! 🎉
        </h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black text-white my-4"
        >
          +{data.credits} crédits
        </motion.p>

        <p className="text-sm text-white/60 mb-2">
          Pack <span className="text-[#C9963A] font-bold">{data.label}</span> activé !
        </p>
        <p className="text-xs text-white/40 mb-6">
          Solde : <span className="text-white font-bold">{getCredits()} crédits</span>
        </p>

        <motion.div className="h-1 rounded-full bg-[#C9963A]/30 overflow-hidden mb-5">
          <motion.div
            className="h-full bg-[#C9963A] rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4, ease: "linear" }}
          />
        </motion.div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-[#1A0A00] text-base"
          style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
        >
          Continuer ✨
        </button>
      </motion.div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function Results() {
  const navigate = useNavigate();
  const [faceShape, setFaceShape] = useState("oval");
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [styles, setStyles] = useState([]);
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultMsg, setResultMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [credits, setCredits] = useState(0);
  const [waitingMsgIdx, setWaitingMsgIdx] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [savesCount, setSavesCount] = useState(0);
  const [creditPopup, setCreditPopup] = useState(null);
  const [showVirtualTryOnModal, setShowVirtualTryOnModal] = useState(false);

  // ── Pagination — persistée dans localStorage ───────────────────────────
  const [currentPage, setCurrentPage] = useState(() => {
    return parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10);
  });
  const [unlockedPages, setUnlockedPages] = useState(() => {
    return parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10);
  });

  // ── Vues et likes par style (persistés) ─────────────────────────────────
  const [styleStats, setStyleStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("afrotresse_style_stats") || "{}");
    } catch { return {}; }
  });

  const resultRef = useRef(null);
  const errorRef = useRef(null);
  const waitingIntervalRef = useRef(null);
  const topRef = useRef(null);

  const userName = localStorage.getItem("afrotresse_user_name") || "Reine";

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFaceShape(parsed.faceShape || "oval");
        const recs = parsed.recommendations || [];
        setStyles(recs);

        // Initialiser les stats (vues/likes) pour chaque style si pas encore fait
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
      } catch (e) {
        console.error("Error parsing results:", e);
      }
    }
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    setCredits(getCredits());
  }, []);

  // ── Incrémenter vues toutes les 8s, likes toutes les 20s ─────────────────
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
        // Incrémenter 1 style aléatoire
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

  // ── Polling pop-up crédit (déclenché depuis Credits.jsx) ────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const raw = sessionStorage.getItem("afrotresse_credit_success");
      if (raw) {
        try {
          const data = JSON.parse(raw);
          sessionStorage.removeItem("afrotresse_credit_success");
          setCredits(getCredits());
          setCreditPopup(data);
        } catch (e) {}
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // ── Pagination helpers — ZÉRO DOUBLON GARANTI ───────────────────────────
  // On mélange UNE FOIS la liste complète avec un seed fixe (basé sur userName)
  // puis chaque page prend une tranche de 3 styles strictement distincts.
  // Si on dépasse la liste, on refait un mélange avec un seed différent.
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

    // Seed de base basé sur le userName pour être stable au reload
    const baseSeed = userName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 12345);

    // Quelle "série" de mélange ? (tous les N pages on recrée un mélange différent)
    const stylesPerShuffle = Math.floor(total / STYLES_PER_PAGE) * STYLES_PER_PAGE || STYLES_PER_PAGE;
    const shuffleIndex = Math.floor(((page - 1) * STYLES_PER_PAGE) / stylesPerShuffle);
    const positionInShuffle = ((page - 1) * STYLES_PER_PAGE) % stylesPerShuffle;

    const shuffled = getShuffledStyles(baseSeed + shuffleIndex * 9973);
    const result = [];
    for (let i = 0; i < STYLES_PER_PAGE; i++) {
      result.push(shuffled[(positionInShuffle + i) % total]);
    }
    return result;
  };

  const displayedStyles = getPageStyles(currentPage);

  const goToPage = (page) => {
    setCurrentPage(page);
    localStorage.setItem("afrotresse_current_page", String(page));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Générer une nouvelle page de styles (coûte 1 crédit)
  const handleGenerateMore = () => {
    if (!hasCredits()) {
      navigate("/credits");
      return;
    }
    consumeCredits(1);
    setCredits(getCredits());
    const nextPage = unlockedPages + 1;
    setUnlockedPages(nextPage);
    setCurrentPage(nextPage);
    localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
    localStorage.setItem("afrotresse_current_page", String(nextPage));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTransform = async (style, index) => {
    if (!hasCredits() || !canTransform()) {
      navigate("/credits");
      return;
    }
    setErrorMsg("");
    setResultImage(null);
    setLoadingIdx(index);
    setWaitingMsgIdx(0);
    setResultMsg("");

    let idx = 0;
    waitingIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % WAITING_MSGS.length;
      setWaitingMsgIdx(idx);
    }, 3000);

    try {
      const selfieBase64 = selfieUrl?.split(",")[1] || null;
      const selfieType = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";
      const styleKey = style.id?.replace(/-/g, "") || style.id;
      const refImage = `${window.location.origin}/styles/${styleKey}-top.jpg`;

      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieBase64, selfieType, styleImageUrl: refImage, faceShape, styleId: style.id }),
      });

      const data = await res.json();
      clearInterval(waitingIntervalRef.current);

      if (!res.ok || !data.imageUrl) {
        setErrorMsg(data?.error || "Génération échouée. Réessaie.");
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        return;
      }

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      // Incrémenter le compteur styles générés (affiché sur Profil)
      const prev = parseInt(localStorage.getItem("afrotresse_styles_generated") || "0", 10);
      localStorage.setItem("afrotresse_styles_generated", String(prev + 1));
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 400);
    } catch {
      clearInterval(waitingIntervalRef.current);
      setErrorMsg("Connexion impossible. Réessaie.");
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleShare = async (text, url) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "AfroTresse", text, url: url || window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Lien copié !");
      }
    } catch (e) {}
  };

  const handleSave = () => {
    // Bloque si 0 crédit — retourne false pour stopper le download
    if (!hasCredits() || getCredits() <= 0) {
      navigate("/credits");
      return false;
    }
    const newCount = savesCount + 1;
    setSavesCount(newCount);

    // 3 sauvegardes = 1 crédit débité
    if (newCount % 3 === 0) {
      const debited = consumeCredits(1);
      if (!debited) {
        setErrorMsg("❌ Pas assez de crédits pour sauvegarder.");
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        return false;
      }
      setCredits(getCredits());
      setErrorMsg("✅ 3 sauvegardes = 1 crédit débité !");
    } else {
      setErrorMsg(`💾 ${newCount % 3}/3 sauvegardes — 1 crédit bientôt utilisé`);
    }
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    return true;
  };

  const faceText = FACE_SHAPE_TEXTS[faceShape] || "";

  // ── ÉCRAN VIDE INTELLIGENT — Option C si photo, Option A sinon ────────
  if (!styles.length) {
    const hasPreviousPhoto = !!selfieUrl;

    // Styles de teaser pour la mosaïque (Option A)
    const TEASER_STYLES = [
      { key: "boxbraids", label: "Box Braids" },
      { key: "cornrows", label: "Cornrows" },
      { key: "knotlessbraids", label: "Knotless Braids" },
      { key: "twists", label: "Twists" },
      { key: "fulanibraids", label: "Fulani Braids" },
      { key: "goddessbraids", label: "Goddess Braids" },
    ];

    return (
      <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] flex flex-col relative overflow-hidden">

        {/* ── OPTION C — Photo existante ── */}
        {hasPreviousPhoto ? (
          <div className="flex flex-col min-h-[100dvh]">

            {/* Hero avec la photo de l'utilisatrice */}
            <div className="relative h-72 overflow-hidden">
              <img src={selfieUrl} alt="Mon selfie" className="w-full h-full object-cover object-top"
                style={{ filter: "brightness(0.45)" }} draggable={false} onContextMenu={e => e.preventDefault()} />
              {/* Gradient bas */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, #2C1A0E 100%)" }} />

              {/* Badge */}
              <div className="absolute top-5 left-5 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                ✨ Prête pour ton look ?
              </div>

              {/* Photo miniature + nom */}
              <div className="absolute bottom-6 left-5 flex items-center gap-3">
                <img src={selfieUrl} alt="moi" className="w-14 h-14 rounded-2xl border-2 border-[#C9963A] object-cover"
                  draggable={false} onContextMenu={e => e.preventDefault()} />
                <div>
                  <p className="font-black text-xl text-white leading-none">{userName}</p>
                  <p className="text-[11px] text-[#C9963A] font-bold mt-0.5">Ta dernière photo est prête 👑</p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex flex-col flex-1 px-5 pt-2 pb-32">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-2xl font-black text-white mb-1">
                  Relance ton analyse <span className="text-[#C9963A]">✨</span>
                </h2>
                <p className="text-[12px] text-white/50 mb-6 leading-relaxed">
                  Ta photo est déjà là. Relance l'analyse pour découvrir de nouveaux styles adaptés à ta morphologie.
                </p>
              </motion.div>

              {/* CTA principal — relancer avec la même photo */}
              <motion.button
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/analyze")}
                className="w-full py-5 rounded-2xl font-black text-lg text-[#2C1A0E] shadow-2xl mb-3"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", boxShadow: "0 0 30px rgba(201,150,58,0.4)" }}
              >
                🔍 Relancer l'analyse
              </motion.button>

              {/* CTA secondaire — nouveau selfie */}
              <motion.button
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/camera")}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white/70 bg-white/5 border border-white/10"
              >
                📸 Prendre un nouveau selfie
              </motion.button>

              {/* Aperçu mosaïque des styles possibles */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="mt-8">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3 text-center">Styles qui t'attendent</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {TEASER_STYLES.map((s, i) => (
                    <motion.div key={s.key}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      className="relative h-24 rounded-2xl overflow-hidden">
                      <img src={`/styles/${s.key}-face.jpg`} alt={s.label}
                        className="w-full h-full object-cover"
                        style={{ filter: "brightness(0.5) blur(1px)" }}
                        draggable={false} onContextMenu={e => e.preventDefault()} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/60 text-lg">🔒</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

        ) : (
          /* ── OPTION A — Aucune photo, teaser mosaïque ── */
          <div className="flex flex-col min-h-[100dvh]">

            {/* Mosaïque hero - FOND UNI */}
            <div className="relative h-80 overflow-hidden bg-[#2C1A0E] flex items-center justify-center">

              {/* Overlay doré */}
              <div className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: "linear-gradient(160deg, rgba(201,150,58,0.15) 0%, rgba(44,26,14,0.7) 100%)" }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  className="text-5xl mb-3">👑</motion.div>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="text-white font-black text-2xl text-center px-4 leading-tight">
                  Tes styles parfaits<br /><span className="text-[#C9963A]">t'attendent</span>
                </motion.p>
              </div>

              {/* Gradient bas */}
              <div className="absolute bottom-0 left-0 right-0 h-24"
                style={{ background: "linear-gradient(to bottom, transparent, #2C1A0E)" }} />
            </div>

            {/* Contenu */}
            <div className="flex flex-col flex-1 px-5 pt-4 pb-32">

              {/* Message */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="mb-6">
                <h2 className="text-xl font-black text-white mb-2">
                  Découvre les tresses faites pour toi 💛
                </h2>
                <p className="text-[12px] text-white/50 leading-relaxed">
                  Un selfie suffit. Notre IA analyse la forme de ton visage et te recommande les styles qui te mettront le plus en valeur.
                </p>
              </motion.div>

              {/* 3 étapes */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="flex flex-col gap-3 mb-8">
                {[
                  { icon: "📸", label: "Prends un selfie", sub: "Ou uploade une photo existante" },
                  { icon: "🔍", label: "Analyse IA instantanée", sub: "Forme de visage détectée en secondes" },
                  { icon: "✨", label: "Styles personnalisés", sub: "3 recommandations taillées pour toi" },
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

              {/* CTA principal */}
              <motion.button
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/camera")}
                className="w-full py-5 rounded-2xl font-black text-lg text-[#2C1A0E] shadow-2xl"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", boxShadow: "0 0 30px rgba(201,150,58,0.4)" }}
              >
                📸 Prendre mon selfie
              </motion.button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">

      {/* ── Pop-up crédit ── */}
      <AnimatePresence>
        {creditPopup && (
          <CreditSuccessPopup data={creditPopup} onClose={() => setCreditPopup(null)} />
        )}
      </AnimatePresence>

      {/* ── Ancre top pour scroll pagination ── */}
      <div ref={topRef} />

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10"
        style={{ boxShadow: "0 0 40px rgba(201,150,58,0.2)" }}
      >
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
            Tes résultats<br />
            <span className="text-[#FAF4EC]">{userName} ✨</span>
          </h1>
          <p className="text-[11px] opacity-80 leading-tight mt-1 max-w-xs">{faceText}</p>
        </div>
      </motion.div>

      {/* ERROR / MESSAGE */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div ref={errorRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-4 border rounded-xl p-3 ${errorMsg.includes("✅") || errorMsg.includes("✨") ? "bg-green-900/30 border-green-500/50" : "bg-red-900/30 border-red-500/50"}`}>
            <p className={errorMsg.includes("✅") || errorMsg.includes("✨") ? "text-green-200 text-sm" : "text-red-200 text-sm"}>{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULT IMAGE */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-6 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A]"
            style={{ boxShadow: "0 0 40px rgba(201,150,58,0.2)" }}
          >
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg || "Magnifique !"}</h3>
              <p className="text-[11px] mt-1 opacity-70">Ce style te met vraiment en valeur. Montre-le à ta coiffeuse !</p>
            </div>
            <div className="relative select-none" onContextMenu={(e) => e.preventDefault()}>
              <img src={resultImage} alt="Résultat" className="w-full object-cover"
                draggable={false} onContextMenu={(e) => e.preventDefault()}
                style={{ userSelect: "none", WebkitUserSelect: "none" }} />
              <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
            </div>
            <div className="p-5 space-y-2">
              <button onClick={() => handleShare("Regarde le style que j'ai choisi avec AfroTresse !", resultImage)}
                className="w-full py-4 rounded-2xl font-bold text-base shadow-xl text-[#2C1A0E]"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
                Envoyer à ma coiffeuse
              </button>
              <button onClick={() => setResultImage(null)}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-white/10 text-white/70 border border-white/10">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STYLES — page courante */}
      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {
          const styleKey = style.id?.replace(/-/g, "") || style.id;
          const faceImg = style.views?.face || `/styles/${styleKey}-face.jpg`;
          const backImg = style.views?.back || `/styles/${styleKey}-back.jpg`;
          const topImg  = style.views?.top  || `/styles/${styleKey}-top.jpg`;
          const isLoading = loadingIdx === index;

          return (
            <motion.div key={style.id || index}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl"
            >
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <OptimizedImage src={faceImg} alt={style.name} className="w-full h-full" onClick={() => setZoomImage(faceImg)} />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <div className="overflow-hidden">
                    <OptimizedImage src={backImg} alt="dos" className="w-full h-full" onClick={() => setZoomImage(backImg)} />
                  </div>
                  <div className="overflow-hidden">
                    <OptimizedImage src={topImg} alt="dessus" className="w-full h-full" onClick={() => setZoomImage(topImg)} />
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 flex gap-5 text-[10px] font-black uppercase tracking-widest text-[#C9963A]/80 border-b border-white/5">
                <span>👁️ {(styleStats[style.id]?.views || 0).toLocaleString("fr-FR")} vues</span>
                <span>❤️ {(styleStats[style.id]?.likes || 0).toLocaleString("fr-FR")} likes</span>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl">{style.name}</h3>
                  <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-md font-black uppercase">{style.duration || "3-5h"}</span>
                </div>
                <p className="text-[11px] opacity-70 mb-6 leading-relaxed">{style.description || "Un style unique adapté à ta morphologie"}</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {(style.tags || ["Tendance", "Élégant"]).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-white/10 text-white/80 px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                {/* ── Virtual Try-On — Coming Soon ── */}
                <button
                  onClick={() => setShowVirtualTryOnModal(true)}
                  className="w-full py-4 rounded-2xl font-bold text-base shadow-xl active:scale-[0.98] transition-all relative overflow-hidden text-white/60 border border-white/15"
                  style={{ background: "linear-gradient(135deg, rgba(201,150,58,0.12), rgba(201,150,58,0.05))" }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>🪞 Essayer virtuellement</span>
                    <span
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#2C1A0E" }}
                    >
                      Bientôt
                    </span>
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── BOUTON "Voir 3 autres styles" — 2ème crédit ── */}
      {currentPage === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          {/* Séparateur élégant */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Envie de plus ?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerateMore}
            className="w-full max-w-xs py-5 rounded-2xl font-black text-base relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #3D2616, #4A2E1A)",
              border: "1.5px solid rgba(201,150,58,0.4)",
              boxShadow: "0 0 30px rgba(201,150,58,0.1)",
            }}
          >
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

      {/* ── PAGINATION — visible si plusieurs pages débloquées ── */}
      {unlockedPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <p className="text-[11px] text-white/40 uppercase tracking-widest">
            Page {currentPage} / {unlockedPages}
          </p>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {Array.from({ length: unlockedPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-10 h-10 rounded-xl font-black text-sm transition-all active:scale-95 ${
                  page === currentPage
                    ? "text-[#2C1A0E] shadow-lg"
                    : "bg-white/10 border border-white/10 text-white/60"
                }`}
                style={page === currentPage ? { background: "linear-gradient(135deg, #C9963A, #E8B96A)" } : {}}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === unlockedPages}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <p className="text-[10px] text-[#C9963A]/60">
            Solde : {credits} crédit{credits > 1 ? "s" : ""}
          </p>

          {/* Bouton générer encore plus */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerateMore}
            className="mt-2 px-6 py-3 rounded-2xl font-bold text-sm relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #3D2616, #4A2E1A)",
              border: "1.5px solid rgba(201,150,58,0.4)",
            }}
          >
            <span className="flex items-center gap-2 text-[#C9963A]">
              ✨ Voir 3 autres styles
              <span className="text-[9px] bg-[#C9963A]/20 border border-[#C9963A]/40 text-[#C9963A] px-1.5 py-0.5 rounded-full font-black">
                -1 crédit
              </span>
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* ── MODALE VIRTUAL TRY-ON — Coming Soon ── */}
      <AnimatePresence>
        {showVirtualTryOnModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-8"
            style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(12px)" }}
            onClick={() => setShowVirtualTryOnModal(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="w-full max-w-sm rounded-[2.5rem] p-8 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
                border: "2px solid rgba(201,150,58,0.5)",
                boxShadow: "0 0 60px rgba(201,150,58,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Particules décoratives */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {["✨","🪞","👑","💛","✨","🌟","👑","✨"].map((emoji, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-base"
                    style={{ left: `${8 + i * 12}%` }}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: [0, 1, 0], y: -70 }}
                    transition={{ delay: i * 0.2, duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-5xl mb-4"
              >
                🪞
              </motion.div>

              <span
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#2C1A0E" }}
              >
                Bientôt disponible
              </span>

              <h2 className="text-2xl font-black text-white mt-3 mb-2 leading-tight">
                Virtual Try-On ✨
              </h2>

              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Vois-toi <span className="text-[#C9963A] font-bold">réellement</span> avec la coiffure grâce à notre IA de transformation photo — disponible très bientôt !
              </p>

              <div className="flex flex-col gap-3 mb-6">
                {[
                  { icon: "📸", text: "Superposition IA sur ton selfie" },
                  { icon: "🎨", text: "Rendu réaliste en quelques secondes" },
                  { icon: "💾", text: "Sauvegarde & partage facilement" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-left"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-white/70 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={() => setShowVirtualTryOnModal(false)}
                className="w-full py-4 rounded-2xl font-black text-[#2C1A0E] text-base"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
              >
                J'ai hâte ! 🔥
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setZoomImage(null)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <motion.div
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              >
                <OptimizedImage
                  src={zoomImage}
                  alt="Zoom"
                  className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/10"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ objectFit: 'contain', userSelect: 'none', WebkitUserSelect: 'none' }}
                />
              </motion.div>
              <div className="absolute inset-0 rounded-3xl"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()} />
            </div>
            <div className="mt-10 flex gap-4 w-full max-w-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const saved = handleSave();
                  if (!saved) return; // 🚫 0 crédit = pas de download
                  const l = document.createElement("a");
                  l.href = zoomImage;
                  l.download = `afrotresse-${Date.now()}.jpg`;
                  l.click();
                }}
                className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl"
              >
                📥 Sauvegarder
              </button>
              <button onClick={() => setZoomImage(null)}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10">
                ✕
              </button>
            </div>
            <p className="text-[10px] text-white/40 mt-4 uppercase font-bold tracking-widest">3 saves = 1 crédit</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOUTONS FLOTTANTS */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-2">

        {/* BOUTON SOLDE */}
        <motion.div
          initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={() => navigate("/credits")}
          className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-lg flex flex-col items-center justify-center shadow-lg border border-[#2C1A0E]/20 active:scale-95 transition-all cursor-pointer"
        >
          <div className="text-[5px] font-black uppercase opacity-60 leading-tight">Solde</div>
          <div className="text-xl font-black leading-none">{credits}</div>
        </motion.div>
      </div>

    </div>
  );
}

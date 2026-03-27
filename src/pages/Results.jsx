import { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getCredits, consumeCredits, consumeTransform, canTransform,
  addSeenStyleId, getSeenStyleIds
} from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";
import { addShare } from "../services/stats.js";

// Regles : pas d'accents directs dans les strings JS
const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C\u2019est une structure tr\u00e8s \u00e9quilibr\u00e9e qui s\u2019adapte \u00e0 presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carr\u00e9e. Les tresses avec du volume adoucissent ta m\u00e2choire.",
  heart:   "Ton visage est en forme de C\u0153ur. Les tresses avec du volume en bas \u00e9quilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses lat\u00e9rales cr\u00e9ent l\u2019harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
}

const RESULT_MSGS = [
  "Waouh \uD83D\uDE0D, tu es splendide !",
  "Regarde cette Reine ! \u2728",
  "Le style parfait pour toi. \uD83D\uDC51",
]

const PAGE_SIZE = 3;
const KEY_PAGES = "afrotresse_result_pages";

function getStoredPages() {
  try {
    const raw = sessionStorage.getItem(KEY_PAGES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function storePages(pages) {
  try { sessionStorage.setItem(KEY_PAGES, JSON.stringify(pages)); } catch {}
}

export default function Results() {
  const navigate = useNavigate();

  const [zoomImage, setZoomImage]     = useState(null);
  const [credits, setCredits]         = useState(getCredits());
  const [saveCount, setSaveCount]     = useState(0);
  const [loadingId, setLoadingId]     = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultMsg, setResultMsg]     = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const resultRef                     = useRef(null);

  // Pagination : historique des pages g\u00e9n\u00e9r\u00e9es
  const [pages, setPages]     = useState(() => {
    const stored = getStoredPages();
    if (stored.length > 0) return stored;
    // Premi\u00e8re visite : g\u00e9n\u00e9rer la page 1 sans consommer de cr\u00e9dit
    const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
    const seen      = getSeenStyleIds();
    const available = BRAIDS_DB
      .filter(s => s.faceShapes.includes(faceShape) && !seen.includes(s.id))
      .sort(() => 0.5 - Math.random());
    const first = available.slice(0, PAGE_SIZE);
    const initial = [{ styles: first }];
    storePages(initial);
    return initial;
  });
  const [pageIdx, setPageIdx] = useState(() => {
    const stored = getStoredPages();
    return stored.length > 0 ? stored.length - 1 : 0;
  });

  const userName  = localStorage.getItem("afrotresse_user_name") || "Reine";
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_selfie");

  const currentStyles = pages[pageIdx]?.styles || [];
  const totalPages    = pages.length;

  // Tous les IDs d\u00e9j\u00e0 utilis\u00e9s dans les pages existantes
  const usedIds = useMemo(
    () => pages.flatMap(p => (p.styles || []).map(s => s.id)),
    [pages]
  );

  // G\u00e9n\u00e9rer 3 nouveaux styles (1 cr\u00e9dit)
  const handleGetNewStyles = useCallback(() => {
    if (credits < 1) { navigate("/credits"); return; }

    const seen      = getSeenStyleIds();
    const available = BRAIDS_DB.filter(s =>
      s.faceShapes.includes(faceShape) &&
      !seen.includes(s.id) &&
      !usedIds.includes(s.id)
    ).sort(() => 0.5 - Math.random());

    if (available.length === 0) {
      setErrorMsg("Tu as explor\u00e9 tous les styles disponibles pour ton visage !");
      return;
    }

    consumeCredits(1);
    setCredits(getCredits());
    setErrorMsg("");

    const newStyles = available.slice(0, PAGE_SIZE);
    const newPages  = [...pages, { styles: newStyles }];
    storePages(newPages);
    setPages(newPages);
    setPageIdx(newPages.length - 1);
    setResultImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [credits, navigate, faceShape, usedIds, pages]);

  // Transformation Fal.ai
  const handleTryStyle = async (style) => {
    if (!canTransform()) { navigate("/credits"); return; }
    setErrorMsg("");
    setResultImage(null);
    setLoadingId(style.id);

    try {
      const selfieBase64 = selfieUrl?.split(",")[1] || null;
      const selfieType   = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";

      let styleImageUrl;
      if (style.localImage) {
        styleImageUrl = window.location.origin + "/styles/" + style.localImage;
      } else if (style.image) {
        styleImageUrl = style.image.startsWith("http")
          ? style.image
          : window.location.origin + style.image;
      } else {
        throw new Error("Image de coiffure introuvable.");
      }

      if (!selfieBase64) throw new Error("Selfie introuvable. Prends une photo d\u2019abord.");

      const res  = await fetch("/api/falGenerate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          selfieBase64,
          selfieType,
          styleImageUrl,
          faceShape,
          styleId: style.id,
          type: "transform",
        }),
      });

      const data = await res.json();
      if (res.status === 429) { setErrorMsg(data.error || "Attends quelques secondes."); return; }
      if (!res.ok)             { setErrorMsg(data.error || "La g\u00e9n\u00e9ration a \u00e9chou\u00e9."); return; }

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 400);

    } catch (err) {
      setErrorMsg(err.message || "Connexion impossible. Reessaie.");
    } finally {
      setLoadingId(null);
    }
  };

  // Sauvegarde image (3 saves = 1 cr\u00e9dit)
  const handleSave = (imageUrl) => {
    if (credits < 1 && saveCount === 0) { navigate("/credits"); return; }
    const link = document.createElement("a");
    link.href     = imageUrl;
    link.download = "afrotresse-" + Date.now() + ".jpg";
    link.click();
    const next = saveCount + 1;
    if (next >= 3) { consumeCredits(1); setCredits(getCredits()); setSaveCount(0); }
    else setSaveCount(next);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "AfroTresse", text: "Regarde ce style !", url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Lien copi\u00e9 !");
      }
    } catch {}
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 overflow-x-hidden relative">

      {/* BOUTON GENERER NOUVEAUX STYLES */}
      <div className="fixed top-24 left-0 right-0 z-[60] flex justify-center pointer-events-none">
        <motion.button
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={handleGetNewStyles}
          className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#C9963A]/50 bg-[#2C1A0E]/90 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] active:scale-95 transition-all"
        >
          <span className="text-base">\u2728</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black text-[#C9963A] uppercase tracking-widest">3 autres styles</span>
            <span className="text-[8px] opacity-60 font-bold mt-1">1 cr\u00e9dit</span>
          </div>
          <div className="bg-[#C9963A] text-[#2C1A0E] text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full ml-1">
            -1
          </div>
        </motion.button>
      </div>

      {/* HEADER */}
      <div className="mb-10 mt-16 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="relative shrink-0">
          {selfieUrl ? (
            <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px]">Photo</div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md shadow-lg">MOI</div>
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-display font-bold text-2xl text-[#C9963A]">
            R\u00e9sultats pour <span className="text-[#FAF4EC]">{userName}</span>
          </h1>
          <p className="text-[10px] opacity-70 italic leading-tight mt-1">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {/* BARRE PAGINATION \u2014 visible si 2+ pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-[#3D2616] rounded-xl px-3 py-2 mb-6"
          style={{ border: "1px solid rgba(201,150,58,0.3)" }}>
          <button
            onClick={() => { setPageIdx(i => i - 1); setResultImage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={pageIdx === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold disabled:opacity-30"
            style={{ color: "#C9963A", background: "rgba(201,150,58,0.12)", fontSize: 14, minWidth: 110 }}>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Pr\u00e9c\u00e9dent</span>
          </button>
          <span style={{ color: "

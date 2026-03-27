import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getCredits, consumeCredits, consumeTransform, canTransform,
  addSeenStyleId, getSeenStyleIds
} from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

// --- COMPOSANT ICÔNE PERSONNALISÉE : CYCLE + ÉTINCELLE ---
const IconRefreshMagic = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
    {/* Étincelle au centre */}
    <path d="M12 10l.5 1.5 1.5.5-1.5.5L12 14l-.5-1.5-1.5-.5 1.5-.5z" fill="currentColor" stroke="none" />
  </svg>
);

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C’est une structure très équilibrée qui s’adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Cœur. Les tresses avec du volume en bas équilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses latérales créent l’harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
}

const RESULT_MSGS = [
  "Waouh 😍, tu es splendide !",
  "Regarde cette Reine ! ✨",
  "Le style parfait pour toi. 👑",
]

const PAGE_SIZE = 3;
const KEY_PAGES = "afrotresse_result_pages";

function getStoredPages() {
  try { return JSON.parse(sessionStorage.getItem(KEY_PAGES) || "[]"); }
  catch { return []; }
}
function storePages(p) {
  try { sessionStorage.setItem(KEY_PAGES, JSON.stringify(p)); } catch {}
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
  
  const resultRef = useRef(null);
  const errorRef  = useRef(null);

  const userName  = localStorage.getItem("afrotresse_user_name") || "Reine";
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_selfie");

  // Scroll auto si erreur
  useEffect(() => {
    if (errorMsg) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errorMsg]);

  const [pages, setPages] = useState(() => {
    const stored = getStoredPages();
    if (stored.length > 0) return stored;
    const seen      = getSeenStyleIds();
    const available = BRAIDS_DB
      .filter(s => s.faceShapes.includes(faceShape) && !seen.includes(s.id))
      .sort(() => 0.5 - Math.random());
    const first = [{ styles: available.slice(0, PAGE_SIZE) }];
    storePages(first);
    return first;
  });

  const [pageIdx, setPageIdx] = useState(() => {
    const stored = getStoredPages();
    return stored.length > 0 ? stored.length - 1 : 0;
  });

  const currentStyles = pages[pageIdx]?.styles || [];
  const totalPages    = pages.length;

  const usedIds = useMemo(
    () => pages.flatMap(p => (p.styles || []).map(s => s.id)),
    [pages]
  );

  function imgUrl(style, view) {
    return (view && style.views?.[view]) || "/styles/" + (style.localImage || style.image || "");
  }

  const handleGetNewStyles = useCallback(() => {
    if (credits < 1) { navigate("/credits"); return; }
    const seen      = getSeenStyleIds();
    const available = BRAIDS_DB
      .filter(s => s.faceShapes.includes(faceShape) && !seen.includes(s.id) && !usedIds.includes(s.id))
      .sort(() => 0.5 - Math.random());

    if (available.length === 0) {
      setErrorMsg("Tu as exploré tous les styles disponibles pour ton visage !");
      return;
    }
    consumeCredits(1);
    setCredits(getCredits());
    setErrorMsg("");
    const newPages = [...pages, { styles: available.slice(0, PAGE_SIZE) }];
    storePages(newPages);
    setPages(newPages);
    setPageIdx(newPages.length - 1);
    setResultImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [credits, navigate, faceShape, usedIds, pages]);

  const handleTryStyle = async (style) => {
    if (!canTransform()) { navigate("/credits"); return; }
    setErrorMsg("");
    setResultImage(null);
    setLoadingId(style.id);

    // On scroll immédiatement vers la zone de résultat pour montrer le chargement
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);

    try {
      const selfieBase64 = selfieUrl?.split(",")[1] || null;
      const selfieType   = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";
      const styleImageUrl = window.location.origin + imgUrl(style, "face");

      if (!selfieBase64) throw new Error("Selfie introuvable. Prends une photo d’abord.");

      const res  = await fetch("/api/falGenerate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ selfieBase64, selfieType, styleImageUrl, faceShape, styleId: style.id, type: "transform" }),
      });
      
      const data = await res.json();
      if (res.status === 429) { setErrorMsg(data.error || "Attends quelques secondes."); return; }
      if (!res.ok)             { setErrorMsg(data.error || "La génération a échoué."); return; }

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      
      // Scroll final vers l'image générée
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 400);

    } catch (err) {
      setErrorMsg(err.message || "Connexion impossible. Réessaie.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 overflow-x-hidden relative">

      {/* BOUTON GÉNÉRER FLOTTANT (DESIGN MIS À JOUR) */}
      <div className="fixed top-24 left-0 right-0 z-[60] flex justify-center pointer-events-none">
        <motion.button
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={handleGetNewStyles}
          className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#C9963A]/50 bg-[#2C1A0E]/95 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] active:scale-95 transition-all text-[#C9963A]">
          <IconRefreshMagic />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black uppercase tracking-widest">3 nouveaux styles</span>
            <span className="text-[8px] opacity-60 font-bold mt-1 text-[#FAF4EC]">1 crédit</span>
          </div>
          <div className="bg-[#C9963A] text-[#2C1A0E] text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full ml-1">-1</div>
        </motion.button>
      </div>

      {/* HEADER */}
      <div className="mb-6 mt-16 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="relative shrink-0">
          <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md shadow-lg">MOI</div>
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-display font-bold text-2xl text-[#C9963A]">
            Tes Résultats ✨ <span className="text-[#FAF4EC]">{userName}</span>
          </h1>
          <p className="text-[10px] opacity-70 italic leading-tight mt-1">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {/* ERREUR (Avec Ref pour scroll) */}
      <div ref={errorRef}>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-red-900/30 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-red-100 text-sm font-bold">{errorMsg}</p>
          </motion.div>
        )}
      </div>

      {/* RÉSULTAT TRANSFORMATION */}
      <div ref={resultRef}>
        <AnimatePresence>
          {resultImage && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mb-10 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="p-6">
                <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg}</h3>
                <p className="text-[11px] mt-1 opacity-70 text-[#FAF4EC]">Montre ce résultat à ta coiffeuse pour la réalisation !</p>
              </div>
              <img src={resultImage} alt="Transformation" className="w-full object-cover" />
              <div className="p-6">
                <button onClick={() => window.open(resultImage, '_blank')}
                  className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E]">
                  Enregistrer l'image
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LISTE DES STYLES */}
      <div className="space-y-12">
        {currentStyles.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20">
            <div className="h-72 bg-black/40 overflow-hidden">
               <img src={imgUrl(style, "face")} className="w-full h-full object-cover object-top" alt={style.name} />
            </div>
            <div className="p-6">
              <h3 className="font-display font-bold text-xl mb-4">{style.name}</h3>
              <button
                onClick={() => handleTryStyle(style)}
                disabled={!!loadingId}
                className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-95 disabled:opacity-50 bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E] shadow-lg">
                {loadingId === style.id ? "Génération magique... ⏳" : "Essayer virtuellement ✨"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

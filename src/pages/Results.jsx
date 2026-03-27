import { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getCredits, consumeCredits, consumeTransform, canTransform,
  addSeenStyleId, getSeenStyleIds
} from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

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
  try { return JSON.parse(sessionStorage.getItem(KEY_PAGES) || "[]"); }
  catch { return []; }
}
function storePages(p) {
  try { sessionStorage.setItem(KEY_PAGES, JSON.stringify(p)); } catch {}
}

export default function Results() {
  const navigate = useNavigate();

  const [zoomImage, setZoomImage]     = useState(null);
  const [zoomStyle, setZoomStyle]     = useState(null);
  const [credits, setCredits]         = useState(getCredits());
  const [saveCount, setSaveCount]     = useState(0);
  const [loadingId, setLoadingId]     = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultMsg, setResultMsg]     = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const resultRef                     = useRef(null);

  const userName  = localStorage.getItem("afrotresse_user_name") || "Reine";
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_selfie");

  // Pagination : pages stock\u00e9es en sessionStorage
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

  // Helper URL image style
  function imgUrl(style, view) {
    return (view && style.views?.[view])
      || "/styles/" + (style.localImage || style.image || "");
  }

  // G\u00e9n\u00e9rer 3 nouveaux styles — 1 cr\u00e9dit
  const handleGetNewStyles = useCallback(() => {
    if (credits < 1) { navigate("/credits"); return; }
    const seen      = getSeenStyleIds();
    const available = BRAIDS_DB
      .filter(s =>
        s.faceShapes.includes(faceShape) &&
        !seen.includes(s.id) &&
        !usedIds.includes(s.id)
      )
      .sort(() => 0.5 - Math.random());

    if (available.length === 0) {
      setErrorMsg("Tu as explor\u00e9 tous les styles disponibles pour ton visage !");
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

  // Transformation Fal.ai
  const handleTryStyle = async (style) => {
    if (!canTransform()) { navigate("/credits"); return; }
    setErrorMsg("");
    setResultImage(null);
    setLoadingId(style.id);
    try {
      const selfieBase64 = selfieUrl?.split(",")[1] || null;
      const selfieType   = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";
      const styleImageUrl = window.location.origin + imgUrl(style, "face");

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
      setZoomImage(null);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 400);
    } catch (err) {
      setErrorMsg(err.message || "Connexion impossible. Reessaie.");
    } finally {
      setLoadingId(null);
    }
  };

  // Sauvegarde (3 saves = 1 cr\u00e9dit)
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
          initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={handleGetNewStyles}
          className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#C9963A]/50 bg-[#2C1A0E]/90 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] active:scale-95 transition-all">
          <span className="text-base">\u2728</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black text-[#C9963A] uppercase tracking-widest">3 autres styles</span>
            <span className="text-[8px] opacity-60 font-bold mt-1">1 cr\u00e9dit</span>
          </div>
          <div className="bg-[#C9963A] text-[#2C1A0E] text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full ml-1">-1</div>
        </motion.button>
      </div>

      {/* HEADER */}
      <div className="mb-6 mt-16 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="relative shrink-0">
          {selfieUrl
            ? <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
            : <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px]">Photo</div>
          }
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md shadow-lg">MOI</div>
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-display font-bold text-2xl text-[#C9963A]">
            R\u00e9sultats pour <span className="text-[#FAF4EC]">{userName}</span>
          </h1>
          <p className="text-[10px] opacity-70 italic leading-tight mt-1">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {/* BARRE PAGINATION */}
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
          <span style={{ color: "#E8B96A", fontSize: 14, fontWeight: 700 }}>
            {pageIdx + 1} / {totalPages}
          </span>
          <button
            onClick={() => { setPageIdx(i => i + 1); setResultImage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={pageIdx >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold disabled:opacity-30"
            style={{ color: "#C9963A", background: "rgba(201,150,58,0.12)", fontSize: 14, minWidth: 110, justifyContent: "flex-end" }}>
            <span>Suivant</span>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}

      {/* ERREUR */}
      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-900/30 border border-red-500/50 rounded-xl p-3">
          <p className="text-red-200 text-sm">{errorMsg}</p>
        </motion.div>
      )}

      {/* RESULTAT Fal.ai */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-8 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-2xl">
            <div className="p-5">
              <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg || "Magnifique !"}</h3>
              <p className="text-[11px] mt-1 opacity-70">Ce style te met vraiment en valeur. Montre-le \u00e0 ta coiffeuse !</p>
            </div>
            <img src={resultImage} alt="Resultat" className="w-full object-cover"/>
            <div className="p-5 space-y-2">
              <button onClick={handleShare}
                className="w-full py-4 rounded-2xl font-bold text-base"
                style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}>
                Envoyer \u00e0 ma coiffeuse
              </button>
              <button onClick={() => setResultImage(null)}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-white/10 text-white/70 border border-white/10">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE DES 3 STYLES */}
      <div className="space-y-12">
        {currentStyles.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
            <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
              <div className="col-span-2 h-full overflow-hidden">
                <img src={imgUrl(style, "face")} className="w-full h-full object-cover object-top cursor-pointer"
                  onClick={() => { setZoomImage(imgUrl(style, "face")); setZoomStyle(style); }} alt={style.name} />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                <img src={imgUrl(style, "back")} className="w-full h-full object-cover cursor-pointer"
                  onClick={() => { setZoomImage(imgUrl(style, "back")); setZoomStyle(style); }} alt={style.name} />
                <img src={imgUrl(style, "top")} className="w-full h-full object-cover cursor-pointer"
                  onClick={() => { setZoomImage(imgUrl(style, "top")); setZoomStyle(style); }} alt={style.name} />
              </div>
            </div>
            <div className="px-6 py-3 flex gap-5 text-[10px] font-black uppercase tracking-widest text-[#C9963A]/80 border-b border-white/5">
              <span>\uD83D\uDC41\uFE0F 2.4K vues</span>
              <span>\u2764\uFE0F 892 likes</span>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-display font-bold text-xl leading-none">{style.name}</h3>
                <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-md font-black uppercase">{style.duration}</span>
              </div>
              <p className="text-[11px] opacity-70 mb-6 font-body leading-relaxed">{style.description}</p>
              <button
                onClick={() => handleTryStyle(style)}
                disabled={loadingId === style.id}
                className="w-full py-4 rounded-2xl font-display font-bold text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}>
                {loadingId === style.id ? "G\u00e9n\u00e9ration... \u23F3" : "Essayer virtuellement \u2728"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOUTON CREDITS FLOTTANT */}
      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={() => navigate("/credits")}
        className="fixed bottom-28 right-5 z-40 bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-[#2C1A0E]/20 active:scale-95 transition-all">
        <div className="text-[7px] font-black uppercase opacity-60">Solde</div>
        <div className="text-3xl font-display font-black leading-none">{credits}</div>
        <div className="text-[7px] font-bold tracking-tight">CR\u00c9DITS</div>
        {saveCount > 0 && (
          <div className="absolute -top-2 -left-2 bg-[#2C1A0E] text-[#C9963A] text-[8px] font-black px-1.5 py-0.5 rounded-md border border-[#C9963A]/20">
            {saveCount}/3
          </div>
        )}
      </motion.div>

      {/* LIGHTBOX ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setZoomImage(null)}>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={zoomImage} alt="Zoom"
              className="max-w-full max-h-[55vh] rounded-3xl shadow-2xl border border-white/10 object-contain"
              onClick={(e) => e.stopPropagation()} />
            <div className="mt-6 flex flex-col gap-3 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
              {zoomStyle && (
                <button
                  onClick={() => handleTryStyle(zoomStyle)}
                  disabled={loadingId === zoomStyle.id}
                  className="w-full py-4 rounded-2xl font-bold text-base shadow-xl disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}>
                  {loadingId === zoomStyle.id ? "G\u00e9n\u00e9ration... \u23F3" : "Essayer virtuellement \u2728"}
                </button>
              )}
              <div className="flex gap-3">
                <button onClick={(e) => { e.stopPropagation(); handleSave(zoomImage); }}
                  className="flex-1 py-3 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl flex items-center justify-center gap-2">
                  \uD83D\uDCE5 Sauvegarder
                </button>
                <button onClick={() => setZoomImage(null)}
                  className="px-6 py-3 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10">
                  \u2715
                </button>
              </div>
            </div>
            <p className="text-[10px] text-white/40 mt-4 uppercase font-bold tracking-widest">3 saves = 1 cr\u00e9dit</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

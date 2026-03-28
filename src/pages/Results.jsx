import { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getCredits, consumeCredits, consumeTransform, canTransform,
  addSeenStyleId, getSeenStyleIds
} from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

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

function imgUrl(style, view) {
  return (view && style.views && style.views[view])
    || "/styles/" + (style.localImage || style.image || "");
}

const IconGenerate = () => (
  <div className="relative w-6 h-6">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full opacity-80">
      <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.99 6.57 2.57L21 8M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="absolute -top-1 -right-1 text-[10px]">✨</span>
  </div>
);

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

  const currentStyles = pages[pageIdx] ? pages[pageIdx].styles : [];
  const totalPages    = pages.length;
  const usedIds = useMemo(() => pages.flatMap(p => (p.styles || []).map(s => s.id)), [pages]);

  const handleGetNewStyles = useCallback(() => {
    if (credits < 1) { navigate("/credits"); return; }
    const seen      = getSeenStyleIds();
    const available = BRAIDS_DB
      .filter(s => s.faceShapes.includes(faceShape) && !seen.includes(s.id) && !usedIds.includes(s.id))
      .sort(() => 0.5 - Math.random());

    if (available.length === 0) {
      setErrorMsg("Tu as exploré tous les styles disponibles !");
      return;
    }
    consumeCredits(1);
    setCredits(getCredits());
    setErrorMsg("");
    const newPages = pages.concat([{ styles: available.slice(0, PAGE_SIZE) }]);
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
    try {
      const selfieBase64 = selfieUrl ? selfieUrl.split(",")[1] : null;
      const selfieType   = selfieUrl ? (selfieUrl.match(/:(.*?);/) || [])[1] || "image/jpeg" : "image/jpeg";
      const styleImageUrl = window.location.origin + imgUrl(style, "face");

      if (!selfieBase64) throw new Error("Selfie introuvable.");

      const res = await fetch("/api/falGenerate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ selfieBase64, selfieType, styleImageUrl, faceShape, styleId: style.id, type: "transform" }),
      });
      const data = await res.json();
      
      if (!res.ok) { 
        setErrorMsg(data.error || "La génération a échoué.");
        return; 
      }

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
    } catch (err) {
      setErrorMsg(err.message || "Erreur de connexion.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleSave = (imageUrl) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "afrotresse-" + Date.now() + ".jpg";
    link.click();

    const next = saveCount + 1;
    if (next >= 3) {
      consumeCredits(1);
      setCredits(getCredits());
      setSaveCount(0);
      setErrorMsg("SUCCESS_SAVE"); 
    } else {
      setSaveCount(next);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 overflow-x-hidden relative">
      {/* HEADER */}
      <div className="mb-6 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div className="relative shrink-0">
          <img src={selfieUrl || "/avatar.png"} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md">MOI</div>
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-display font-bold text-2xl text-[#C9963A]">
            Tes Résultats ✨ <span className="text-[#FAF4EC]">{userName}</span>
          </h1>
          <p className="text-[10px] opacity-70 italic leading-tight mt-1">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      {errorMsg !== "" && (
        <div className={`mb-4 rounded-xl p-4 border ${errorMsg === "SUCCESS_SAVE" ? "bg-green-900/20 border-green-500/50" : "bg-red-900/30 border-red-500/50"}`}>
          <p className="text-sm text-center">{errorMsg === "SUCCESS_SAVE" ? "Style sauvegardé !" : errorMsg}</p>
        </div>
      )}

      {/* RÉSULTAT IA */}
      <AnimatePresence>
        {resultImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A]">
            <div className="p-5">
              <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg}</h3>
            </div>
            <img src={resultImage} alt="Resultat" className="w-full object-cover"/>
            <div className="p-5">
              <button onClick={() => setResultImage(null)} className="w-full py-3 bg-white/10 rounded-2xl">Fermer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE DES STYLES */}
      <div className="space-y-12">
        {currentStyles.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20">
            <div className="grid grid-cols-3 gap-0.5 h-72">
              <div className="col-span-2 overflow-hidden">
                <img src={imgUrl(style, "face")} className="w-full h-full object-cover" onClick={() => setZoomImage(imgUrl(style, "face"))} alt={style.name} />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                <img src={imgUrl(style, "back")} className="w-full h-full object-cover" onClick={() => setZoomImage(imgUrl(style, "back"))} alt={style.name} />
                <img src={imgUrl(style, "top")} className="w-full h-full object-cover" onClick={() => setZoomImage(imgUrl(style, "top"))} alt={style.name} />
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display font-bold text-xl mb-2">{style.name}</h3>
              <p className="text-[11px] opacity-70 mb-6">{style.description}</p>
              <button
                onClick={() => handleTryStyle(style)}
                disabled={loadingId === style.id}
                className="w-full py-4 rounded-2xl font-bold"
                style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}
              >
                {loadingId === style.id ? "Génération..." : "Essayer virtuellement ✨"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-10 p-4 bg-[#3D2616] rounded-2xl border border-gold/30">
          <button onClick={() => setPageIdx(i => i - 1)} disabled={pageIdx === 0} className="text-[#C9963A] font-bold">Précédent</button>
          <span className="text-[#E8B96A] font-bold">{pageIdx + 1} / {totalPages}</span>
          <button onClick={() => setPageIdx(i => i + 1)} disabled={pageIdx === totalPages - 1} className="text-[#C9963A] font-bold">Suivant</button>
        </div>
      )}

      {/* BOUTONS FLOTTANTS */}
      <div className="fixed bottom-28 right-5 z-40 flex flex-col gap-2">
        <div onClick={() => navigate("/credits")} className="bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black">
          <span className="text-[7px]">SOLDE</span>
          <span className="text-2xl">{credits}</span>
        </div>
        <button onClick={handleGetNewStyles} className="w-14 h-14 rounded-2xl bg-[#2C1A0E] border-2 border-[#C9963A] flex flex-col items-center justify-center">
          <IconGenerate />
          <span className="text-[7px] text-[#C9963A] font-black">+3</span>
        </button>
      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl">
            <img src={zoomImage} className="max-w-full max-h-[70vh] rounded-3xl" alt="Zoom" />
            <div className="mt-8 flex gap-4 w-full max-w-xs">
              <button onClick={() => handleSave(zoomImage)} className="flex-1 py-4 rounded-2xl font-black bg-[#C9963A] text-[#2C1A0E]">📥 Sauvegarder</button>
              <button onClick={() => setZoomImage(null)} className="px-8 py-4 bg-white/10 rounded-2xl">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

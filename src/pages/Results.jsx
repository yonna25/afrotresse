import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, canDiscover, canTransform, PRICING, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
// Import de la DB avec la nouvelle structure views
import { BRAIDS_DB } from "../services/faceAnalysis.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure tr\u00e8s \u00e9quilibr\u00e9e qui s'adapte \u00e0 presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carr\u00e9e. Les tresses avec du volume sur les c\u00f4t\u00e9s adoucissent ta m\u00e2choire.",
  heart:   "Ton visage est en forme de Coeur. Les tresses avec du volume en bas \u00e9quilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses lat\u00e9rales cr\u00e9ent l'harmonie parfaite pour toi.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment naturellement.",
}

export default function Results() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [resultImage, setResultImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  
  // Etat pour le zoom (Priorit\u00e9 1.3)
  const [zoomImage, setZoomImage] = useState(null);

  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = localStorage.getItem("afrotresse_selfie");

  // Melange et filtrage (Priorit\u00e9 2 - Anti-r\u00e9p\u00e9tition)
  const shuffledStyles = useMemo(() => {
    const seenIds = getSeenStyleIds();
    const available = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape));
    
    // On met les nouveaux styles en premier
    return [...available].sort((a, b) => {
      const aSeen = seenIds.includes(a.id) ? 1 : 0;
      const bSeen = seenIds.includes(b.id) ? 1 : 0;
      return aSeen - bSeen || 0.5 - Math.random();
    });
  }, [faceShape]);

  const currentStyles = shuffledStyles.slice(page * 3, (page + 1) * 3);

  const handleTryStyle = async (style, index) => {
    if (credits < PRICING.TRANSFORM) {
      navigate("/credits");
      return;
    }

    setLoadingIdx(index);
    setErrorMsg("");

    try {
      const selfieBase = selfieUrl.split(",")[1];
      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieBase64: selfieBase,
          styleImageUrl: style.views.top, // Priorit\u00e9 1.4 - Reference TOP
          styleId: style.id
        })
      });

      const data = await res.json();
      if (data.imageUrl) {
        setResultImage(data.imageUrl);
        consumeCredits(PRICING.TRANSFORM);
        setCredits(getCredits());
        addSeenStyleId(style.id);
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (e) {
      setErrorMsg("Une erreur est survenue. R\u00e9essaie plus tard.");
    } finally {
      setLoadingIdx(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-5 pb-24">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl mb-2">Tes R\u00e9sultats</h1>
        <p className="text-sm opacity-80 font-body">{FACE_SHAPE_TEXTS[faceShape]}</p>
      </div>

      {errorMsg && <div className="bg-red-900/30 border border-red-500 p-3 rounded-xl mb-4 text-xs">{errorMsg}</div>}

      <div className="space-y-8">
        {currentStyles.map((style, idx) => (
          <div key={style.id} className="bg-[#3D2616] rounded-3xl overflow-hidden border border-[#C9963A]/20 shadow-2xl">
            
            {/* 1. GRILLE PHOTO (Priorit\u00e9 1.2) */}
            <div className="grid grid-cols-3 gap-0.5 h-64 bg-black/20">
              <div className="col-span-2 h-full overflow-hidden">
                <img 
                  src={style.views.face} 
                  className="w-full h-full object-cover object-top" 
                  onClick={() => setZoomImage(style.views.face)}
                />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                <img 
                  src={style.views.back} 
                  className="w-full h-full object-cover" 
                  onClick={() => setZoomImage(style.views.back)}
                />
                <img 
                  src={style.views.top} 
                  className="w-full h-full object-cover" 
                  onClick={() => setZoomImage(style.views.top)}
                />
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-display font-bold text-xl">{style.name}</h3>
                <span className="text-[10px] bg-[#C9963A]/20 px-2 py-1 rounded-full text-[#C9963A] uppercase font-bold">
                  {style.duration}
                </span>
              </div>
              <p className="text-xs opacity-70 mb-5 font-body line-clamp-2">{style.description}</p>
              
              <button
                onClick={() => handleTryStyle(style, idx)}
                disabled={loadingIdx !== null}
                className="w-full py-4 rounded-full font-display font-bold text-base transition-transform active:scale-95"
                style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
              >
                {loadingIdx === idx ? "G\u00e9n\u00e9ration..." : "Me transformer \u2728"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex gap-3">
        {shuffledStyles.length > (page + 1) * 3 && (
          <button 
            onClick={() => { setPage(p => p + 1); window.scrollTo(0,0); }}
            className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-sm"
          >
            Voir d'autres styles
          </button>
        )}
      </div>

      {/* 2. LIGHTBOX / ZOOM (Priorit\u00e9 1.3) */}
      <AnimatePresence>
        {(zoomImage || resultImage) && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6"
            onClick={() => { setZoomImage(null); setResultImage(null); }}
          >
            <motion.img 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={zoomImage || resultImage} 
              className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border border-white/10"
            />
            <button className="mt-8 px-8 py-3 bg-[#C9963A] text-[#2C1A0E] rounded-full font-bold">
              Fermer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

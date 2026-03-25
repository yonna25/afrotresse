import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, canDiscover, canTransform, PRICING, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Coeur. Les tresses avec du volume en bas équilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses latérales créent l'harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
}

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  const [saveCount, setSaveCount] = useState(0);
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const resultRef = useRef(null);

  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem('afrotresse_photo') || localStorage.getItem('afrotresse_selfie');

  const currentResults = useMemo(() => {
    const seenIds = getSeenStyleIds();
    const available = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape));
    return [...available].sort((a, b) => (seenIds.includes(a.id) ? 1 : -1) || 0.5 - Math.random()).slice(0, 3);
  }, [faceShape]);

  // FONCTION FAL AI RÉTABLIE
  const handleTryStyle = async (style, index) => {
    if (!canTransform()) { navigate('/credits'); return; }
    setLoadingIdx(index);
    try {
      const res = await fetch('/api/falGenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          selfieBase64: selfieUrl?.split(',')[1], 
          styleImageUrl: `${window.location.origin}/styles/${style.localImage}`,
          faceShape 
        }),
      });
      const data = await res.json();
      consumeCredits(PRICING.transformCost);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      alert("Erreur de connexion avec l'IA. Réessaie.");
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleSave = (imageUrl) => {
    const link = document.createElement('a'); link.href = imageUrl; link.download = `afrotresse-${Date.now()}.jpg`; link.click();
    const nextCount = saveCount + 1;
    if (nextCount >= 3) { consumeCredits(1); setCredits(getCredits()); setSaveCount(0); } else { setSaveCount(nextCount); }
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-40 relative overflow-x-hidden">
      
      {/* HEADER CORRECT */}
      <div className="mb-10 flex gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-3xl text-[#C9963A] leading-tight">
            Tes résultats<br/>
            <span className="text-white">{userName} ✨</span>
          </h1>
          <p className="text-[11px] opacity-70 italic mt-1">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {/* RÉSULTAT IA (SI GÉNÉRÉ) */}
      {resultImage && (
        <div ref={resultRef} className="mb-12 rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-2xl bg-[#3D2616]">
          <img src={resultImage} className="w-full h-auto" alt="Ton essai" />
          <div className="p-6 text-center">
            <button onClick={() => handleSave(resultImage)} className="w-full py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black mb-3">📥 Sauvegarder mon look</button>
            <button onClick={() => setResultImage(null)} className="text-sm opacity-50">Fermer l'aperçu</button>
          </div>
        </div>
      )}

      {/* LISTE DES STYLES */}
      <div className="space-y-12">
        {currentResults.map((style, idx) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
            <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
              <img src={style.views.face} className="col-span-2 w-full h-full object-cover" onClick={() => setZoomImage(style.views.face)} />
              <div className="grid grid-rows-2 gap-0.5">
                <img src={style.views.back} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.back)} />
                <img src={style.views.top} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.top)} />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{style.name}</h3>
              <button
                disabled={loadingIdx === idx}
                onClick={() => handleTryStyle(style, idx)}
                className="w-full py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-xl"
                style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
              >
                {loadingIdx === idx ? "Transformation en cours... ✨" : "Essayer virtuellement ce style ✨"}
              </button>
            </div>
          </div>
        ))}
      </div>

      [span_2](start_span){/* BOUTON FLOTTANT : REGLAGE VISIBLE (bottom-28)[span_2](end_span) */}
      <motion.div 
        onClick={() => navigate("/credits")}
        className="fixed bottom-28 right-5 z-40 bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-[#2C1A0E]/20"
      >
        <div className="text-[7px] font-black uppercase opacity-60">Solde</div>
        <div className="text-2xl font-black leading-none">{credits}</div>
        <div className="text-[7px] font-bold">CRÉDITS</div>
        {saveCount > 0 && (
          <div className="absolute -top-2 -left-2 bg-[#2C1A0E] text-[#C9963A] text-[8px] font-black px-1.5 py-0.5 rounded-md">{saveCount}/3</div>
        )}
      </motion.div>

      {/* ZOOM LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6" onClick={() => setZoomImage(null)}>
            <img src={zoomImage} className="max-w-full max-h-[70vh] rounded-3xl" onClick={e => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); handleSave(zoomImage); }} className="mt-8 px-10 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl">📥 Sauvegarder</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

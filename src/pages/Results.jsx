import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner tes traits, les tresses hautes sont parfaites.",
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

  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem('afrotresse_photo') || localStorage.getItem('afrotresse_selfie');

  const currentResults = useMemo(() => {
    const seenIds = getSeenStyleIds();
    const available = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape));
    const sorted = [...available].sort((a, b) => (seenIds.includes(a.id) ? 1 : -1) || 0.5 - Math.random());
    return sorted.slice(0, 3);
  }, [faceShape]);

  const handleSave = (imageUrl) => {
    if (credits < 1 && saveCount === 0) { navigate("/credits"); return; }
    const link = document.createElement('a'); link.href = imageUrl; link.download = `afrotresse-${Date.now()}.jpg`; link.click();
    const nextCount = saveCount + 1;
    if (nextCount >= 3) { consumeCredits(1); setCredits(getCredits()); setSaveCount(0); } else { setSaveCount(nextCount); }
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 overflow-x-hidden relative">
      
      {/* HEADER RESPONSIVE */}
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/10 shadow-xl">
        <div className="relative shrink-0">
          {selfieUrl ? (
            <img src={selfieUrl} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          ) : (
            <div className="w-16 h-16 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px]">Photo</div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-[#C9963A] text-[#2C1A0E] text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">Moi</div>
        </div>
        
        <div className="flex flex-col min-w-0">
          <h1 className="font-display font-bold leading-tight">
            <span className="text-lg sm:text-xl text-[#C9963A]">Tes résultats</span>
            <br />
            <span className="text-2xl sm:text-3xl text-white font-black truncate">{userName} ✨</span>
          </h1>
          <p className="text-[10px] sm:text-[11px] opacity-70 italic line-clamp-2 mt-1">
            {FACE_SHAPE_TEXTS[faceShape]}
          </p>
        </div>
      </div>

      {/* STYLES GRID */}
      <div className="space-y-8 max-w-2xl mx-auto">
        {currentResults.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl transition-transform active:scale-[0.99]">
            <div className="grid grid-cols-3 gap-0.5 aspect-[4/3] sm:aspect-video bg-black/20">
              <div className="col-span-2 h-full overflow-hidden">
                <img src={style.views.face} className="w-full h-full object-cover object-top" onClick={() => setZoomImage(style.views.face)} alt="Vue face" />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                <img src={style.views.back} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.back)} alt="Vue dos" />
                <img src={style.views.top} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.top)} alt="Vue haut" />
              </div>
            </div>
            
            <div className="p-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-xl truncate pr-2">{style.name}</h3>
                <span className="shrink-0 text-[9px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-full font-black uppercase">{style.duration}</span>
              </div>
              <button
                onClick={() => navigate('/camera')}
                className="w-full py-4 rounded-xl font-display font-bold text-sm shadow-lg"
                style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
              >
                Essayer ce style ✨
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* STICKER CRÉDIT : POSITION BAS DROITE DESCENDUE */}
      <motion.div 
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        onClick={() => navigate("/credits")}
        className="fixed bottom-32 right-5 z-40 bg-[#C9963A] text-[#2C1A0E] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-[#2C1A0E]/20 active:scale-90 transition-transform"
      >
        <span className="text-[7px] font-black uppercase opacity-60">Solde</span>
        <span className="text-2xl sm:text-3xl font-display font-black leading-none">{credits}</span>
        <span className="text-[7px] font-bold">CRÉDITS</span>
        {saveCount > 0 && (
          <div className="absolute -top-2 -left-2 bg-[#2C1A0E] text-[#C9963A] text-[8px] font-black px-1.5 py-0.5 rounded-md border border-[#C9963A]/20 shadow-lg">
            {saveCount}/3
          </div>
        )}
      </motion.div>

      {/* LIGHTBOX ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setZoomImage(null)}
          >
            <img src={zoomImage} className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} alt="Zoom" />
            <div className="mt-8 flex gap-3 w-full max-w-xs">
              <button onClick={(e) => { e.stopPropagation(); handleSave(zoomImage); }} className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-xl font-black shadow-xl">📥 Sauvegarder</button>
              <button onClick={() => setZoomImage(null)} className="px-6 py-4 bg-white/10 text-white rounded-xl font-bold border border-white/10">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getNextBatch, FACE_SHAPE_NAMES } from "../services/faceAnalysis.js";
import { getCredits, consumeTransform, hasCredits, canTransform } from "../services/credits.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure équilibrée qui s'adapte à tout.",
  round:   "Ton visage est de forme Ronde. Les styles en hauteur allongeront tes traits.",
  square:  "Ton visage est de forme Carrée. Les volumes adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Cœur. Le volume en bas équilibre ton menton.",
  long:    "Ton visage est de forme Allongée. Les tresses latérales créent l'harmonie.",
  diamond: "Ton visage est de forme Diamant. Les styles encadrant le visage te subliment.",
};

export default function Results() {
  const navigate = useNavigate();
  const [faceShape, setFaceShape] = useState('oval');
  const [selfieUrl, setSelfieUrl] = useState(null);
  
  const [unlockedStyles, setUnlockedStyles] = useState([]);
  const [hasMoreInDb, setHasMoreInDb] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 3;

  const [credits, setCredits] = useState(getCredits());
  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';

  useEffect(() => {
    const raw = sessionStorage.getItem('afrotresse_results');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFaceShape(parsed.faceShape || 'oval');
        const firstBatch = parsed.recommendations.slice(0, 3);
        setUnlockedStyles(firstBatch);
        setHasMoreInDb(parsed.recommendations.length > 3);
      } catch (e) { console.error(e); }
    }
    const photo = sessionStorage.getItem('afrotresse_photo');
    if (photo) setSelfieUrl(photo);
  }, []);

  const handleUnlockMore = () => {
    if (!hasCredits()) {
      navigate('/credits');
      return;
    }

    consumeTransform();
    setCredits(getCredits());

    const seenIds = unlockedStyles.map(s => s.id);
    const { batch, hasMore } = getNextBatch(faceShape, seenIds);

    if (batch.length > 0) {
      const updatedList = [...unlockedStyles, ...batch];
      setUnlockedStyles(updatedList);
      setHasMoreInDb(hasMore);
      setPage(Math.floor((updatedList.length - 1) / PAGE_SIZE));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTransform = async (style) => {
    if (!hasCredits()) { 
      navigate('/credits');
      return; 
    }
    // Logique de transformation FAL...
  };

  const totalPages = Math.ceil(unlockedStyles.length / PAGE_SIZE);
  const currentBatch = unlockedStyles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!unlockedStyles.length) return null;

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-44">
      
      {/* HEADER */}
      <div className="mb-10 flex gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10">
        <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" />
        <div>
          <h1 className="font-bold text-2xl text-[#C9963A]">{userName} ✨</h1>
          <p className="text-[11px] opacity-80">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {/* GRILLE D'IMAGES (TA STRUCTURE D'ORIGINE) */}
      <div className="flex flex-col gap-8">
        {currentBatch.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20">
             <div className="p-6">
                <h3 className="font-bold text-2xl mb-4 text-[#C9963A]">{style.name}</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="col-span-2">
                    <img src={style.views.face} className="w-full h-64 object-cover rounded-[2rem]" alt="Vue face" />
                  </div>
                  <img src={style.views.back} className="w-full h-40 object-cover rounded-[1.5rem]" alt="Vue arrière" />
                  <img src={style.views.top} className="w-full h-40 object-cover rounded-[1.5rem]" alt="Vue dessus" />
                </div>

                <button 
                  onClick={() => handleTransform(style)}
                  className="w-full py-5 rounded-2xl font-black bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E] uppercase tracking-wider shadow-xl transition-transform active:scale-95">
                  Essayer ce style ✨
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* PAGINATION CENTRALE (CONSERVÉE) */}
      <div className="mt-10 flex flex-col items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            disabled={page === 0} 
            onClick={() => setPage(p => p - 1)}
            className="p-4 bg-white/5 rounded-2xl disabled:opacity-20 text-[#C9963A]">←</button>
          
          <span className="font-bold text-[#C9963A]">Lot {page + 1} / {totalPages}</span>

          <button 
            disabled={page >= totalPages - 1} 
            onClick={() => setPage(p => p + 1)}
            className="p-4 bg-white/5 rounded-2xl disabled:opacity-20 text-[#C9963A]">→</button>
        </div>

        <button onClick={() => navigate('/')} className="text-xs opacity-40 underline mb-4">
          Refaire un scan complet
        </button>
      </div>

      {/* ACTIONS FLOTTANTES À DROITE (EMPILÉES) */}
      <div className="fixed bottom-8 right-5 flex flex-col items-center gap-4 z-50">
        
        {/* SOLDE (EN HAUT) */}
        <div 
          onClick={() => navigate('/credits')} 
          className="w-16 h-16 bg-[#2C1A0E] border-2 border-[#C9963A] text-[#FAF4EC] rounded-2xl flex flex-col items-center justify-center shadow-2xl cursor-pointer"
        >
          <span className="text-[9px] opacity-60 uppercase font-bold mb-1">Solde</span>
          <span className="font-black text-lg text-[#C9963A]">{credits}</span>
        </div>

        {/* GÉNÉRER (EN BAS) */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleUnlockMore}
          className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-2xl relative border border-white/10"
          style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
        >
          <span className="text-[9px] font-black text-[#2C1A0E] mb-1 leading-none text-center uppercase">Générer</span>
          <span className="text-xl">✨</span>
          <div className="absolute -top-1 -right-1 bg-[#2C1A0E] text-[#C9963A] text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-[#C9963A]">
            -1
          </div>
        </motion.button>
      </div>

    </div>
  );
}

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
}

export default function Results() {
  const navigate = useNavigate();
  const [faceShape, setFaceShape] = useState('oval');
  const [selfieUrl, setSelfieUrl] = useState(null);
  
  // LOGIQUE DES LOTS
  const [unlockedStyles, setUnlockedStyles] = useState([]);
  const [hasMoreInDb, setHasMoreInDb] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 3;

  const [loadingIdx, setLoadingIdx] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  const [zoomImage, setZoomImage] = useState(null);
  const resultRef = useRef(null);
  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';

  // 1. CHARGEMENT INITIAL (LOT 1)
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

  // 2. DÉBLOQUER 3 NOUVEAUX STYLES (-1 CRÉDIT)
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

  // 3. TRANSFORMATION IA (ESSAYAGE VIRTUEL)
  const handleTransform = async (style, index) => {
    if (!hasCredits()) { navigate('/credits'); return; }
    // Logique de transformation FAL...
  };

  const totalPages = Math.ceil(unlockedStyles.length / PAGE_SIZE);
  const currentBatch = unlockedStyles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!unlockedStyles.length) return null;

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-40">
      
      {/* HEADER : IDENTITÉ & FORME */}
      <div className="mb-10 flex gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10">
        <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" />
        <div>
          <h1 className="font-bold text-2xl text-[#C9963A]">{userName} ✨</h1>
          <p className="text-[11px] opacity-80">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {/* AFFICHAGE DU LOT ACTUEL */}
      <div className="flex flex-col gap-8">
        {currentBatch.map((style, idx) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20">
             <div className="p-6">
                <h3 className="font-bold text-xl mb-2">{style.name}</h3>
                <button 
                  onClick={() => handleTransform(style, idx)}
                  className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E]">
                  Essayer ce style ✨
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* PAGINATION CENTRALE */}
      <div className="mt-10 flex flex-col items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            disabled={page === 0} 
            onClick={() => setPage(p => p - 1)}
            className="p-4 bg-white/5 rounded-2xl disabled:opacity-20">←</button>
          
          <span className="font-bold text-[#C9963A]">Lot {page + 1} / {totalPages}</span>

          <button 
            disabled={page >= totalPages - 1} 
            onClick={() => setPage(p => p + 1)}
            className="p-4 bg-white/5 rounded-2xl disabled:opacity-20">→</button>
        </div>

        <button onClick={() => navigate('/')} className="text-xs opacity-40 underline">
          Refaire un scan complet
        </button>
      </div>

      {/* ACTIONS FLOTTANTES (À DROITE) */}
      <div className="fixed bottom-10 right-5 flex flex-col items-center gap-3 z-50">
        
        {/* BOUTON SOLDE FLOTTANT */}
        <div 
          onClick={() => navigate('/credits')} 
          className="w-14 h-14 bg-[#C9963A] text-[#2C1A0E] rounded-2xl flex flex-col items-center justify-center font-black shadow-2xl cursor-pointer"
        >
          <span className="text-[10px] opacity-60">SOLDE</span>
          {credits}
        </div>

        {/* BOUTON GÉNÉRER (SOUS LE SOLDE) */}
        {hasMoreInDb && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleUnlockMore}
            className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl relative border border-white/10"
            style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
          >
            <span className="text-[8px] font-black text-[#2C1A0E] mb-1 leading-none text-center uppercase">Générer</span>
            <span className="text-lg">✨</span>
            <div className="absolute -top-1 -right-1 bg-[#2C1A0E] text-[#C9963A] text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-[#C9963A]">
              -1
            </div>
          </motion.button>
        )}
      </div>

    </div>
  );
}

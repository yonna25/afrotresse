import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getNextBatch, FACE_SHAPE_NAMES, FACE_SHAPE_DESCRIPTIONS } from "../services/faceAnalysis.js";
import { getCredits, consumeTransform, hasCredits } from "../services/credits.js";

export default function Results() {
  const navigate = useNavigate();
  const [faceShape, setFaceShape] = useState('oval');
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [unlockedStyles, setUnlockedStyles] = useState([]);
  const [hasMoreInDb, setHasMoreInDb] = useState(true);
  const [page, setPage] = useState(0);
  const [credits, setCredits] = useState(getCredits());
  const PAGE_SIZE = 3;

  useEffect(() => {
    const raw = sessionStorage.getItem('afrotresse_results');
    const photo = sessionStorage.getItem('afrotresse_photo');
    if (photo) setSelfieUrl(photo);

    if (raw) {
      const parsed = JSON.parse(raw);
      setFaceShape(parsed.faceShape || 'oval');
      const firstBatch = parsed.recommendations.slice(0, 3);
      setUnlockedStyles(firstBatch);
      setHasMoreInDb(parsed.recommendations.length > 3);
    }
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

  const totalPages = Math.ceil(unlockedStyles.length / PAGE_SIZE);
  const currentBatch = unlockedStyles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-40">
      
      {/* HEADER */}
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
        <img src={selfieUrl} className="w-16 h-16 rounded-xl object-cover border-2 border-[#C9963A]" />
        <div>
          <h2 className="text-[#C9963A] font-bold">Visage {FACE_SHAPE_NAMES[faceShape]}</h2>
          <p className="text-[10px] opacity-70 leading-tight">{FACE_SHAPE_DESCRIPTIONS[faceShape]}</p>
        </div>
      </div>

      {/* LISTE DES STYLES */}
      <div className="space-y-8">
        {currentBatch.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] p-4 border border-white/5">
            <h3 className="text-xl font-bold mb-4 ml-2">{style.name}</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
               <img src={style.views.face} className="rounded-2xl aspect-square object-cover bg-black/20" />
               <img src={style.views.back} className="rounded-2xl aspect-square object-cover bg-black/20" />
               <img src={style.views.top} className="rounded-2xl aspect-square object-cover bg-black/20" />
            </div>
            <button className="w-full py-4 bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E] rounded-2xl font-black">
              Essayer ce style ✨
            </button>
          </div>
        ))}
      </div>

      {/* NAVIGATION BAS DE PAGE */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-3 disabled:opacity-20 text-[#C9963A]">←</button>
          <span className="text-sm font-bold">Lot {page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-3 disabled:opacity-20 text-[#C9963A]">→</button>
        </div>
        <button onClick={() => navigate('/')} className="text-[10px] opacity-30 underline">Scanner un autre selfie</button>
      </div>

      {/* ACTIONS FLOTTANTES (À DROITE) */}
      <div className="fixed bottom-10 right-5 flex flex-col items-center gap-3 z-50">
        {/* BOUTON GÉNÉRER */}
        {hasMoreInDb && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleUnlockMore}
            className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-2xl relative border border-white/10"
            style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
          >
            <span className="text-[9px] font-black text-[#2C1A0E] mb-1">GÉNÉRER</span>
            <span className="text-xl">✨</span>
            <div className="absolute -top-1 -right-1 bg-[#2C1A0E] text-[#C9963A] text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-[#C9963A]">
              -1
            </div>
          </motion.button>
        )}

        {/* BOUTON SOLDE */}
        <motion.div 
          onClick={() => navigate('/credits')}
          className="w-16 h-16 bg-[#2C1A0E] border-2 border-[#C9963A] text-[#FAF4EC] rounded-2xl flex flex-col items-center justify-center shadow-2xl cursor-pointer"
        >
          <span className="text-[8px] opacity-50 font-bold">SOLDE</span>
          <span className="font-black text-lg text-[#C9963A]">{credits}🪙</span>
        </motion.div>
      </div>

    </div>
  );
}

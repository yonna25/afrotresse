import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getNextBatch, FACE_SHAPE_NAMES, FACE_SHAPE_DESCRIPTIONS } from "../services/faceAnalysis.js";
import { getCredits, consumeTransform, hasCredits } from "../services/credits.js";

export default function Results() {
  const navigate = useNavigate();
  const [faceShape, setFaceShape] = useState('oval');
  const [selfieUrl, setSelfieUrl] = useState(null);
  
  // LOGIQUE DES LOTS
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
      // On initialise avec le premier lot de 3
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
      // On passe au nouveau lot débloqué
      setPage(Math.floor((updatedList.length - 1) / PAGE_SIZE));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const totalPages = Math.ceil(unlockedStyles.length / PAGE_SIZE);
  const currentBatch = unlockedStyles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-40">
      
      {/* HEADER (CONSERVÉ) */}
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
        <img src={selfieUrl} className="w-16 h-16 rounded-xl object-cover border-2 border-[#C9963A]" />
        <div>
          <h2 className="text-[#C9963A] font-bold">Visage {FACE_SHAPE_NAMES[faceShape]}</h2>
          <p className="text-[10px] opacity-70 leading-tight">{FACE_SHAPE_DESCRIPTIONS[faceShape]}</p>
        </div>
      </div>

      {/* TA GRILLE D'ORIGINE (GRID) */}
      <div className="space-y-8">
        {currentBatch.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-white/5">
            <div className="p-6">
              <h3 className="text-2xl font-black mb-4">{style.name}</h3>
              
              {/* C'est ici que je remets ton Grid initial */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="col-span-2">
                  <img src={style.views.face} className="w-full h-64 object-cover rounded-[2rem]" />
                </div>
                <img src={style.views.back} className="w-full h-40 object-cover rounded-[1.5rem]" />
                <img src={style.views.top} className="w-full h-40 object-cover rounded-[1.5rem]" />
              </div>

              <button className="w-full py-5 bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E] rounded-[1.5rem] font-black text-lg shadow-xl uppercase tracking-tighter">
                Essayer ce style ✨
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION ENTRE LOTS */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6 bg-white/5 p-3 rounded-2xl border border-white/10">
          <button 
            disabled={page === 0} 
            onClick={() => setPage(p => p - 1)} 
            className="text-2xl disabled:opacity-20 text-[#C9963A]">
            ←
          </button>
          <span className="text-sm font-black tracking-widest uppercase text-[#C9963A]">
            Lot {page + 1} / {totalPages}
          </span>
          <button 
            disabled={page >= totalPages - 1} 
            onClick={() => setPage(p => p + 1)} 
            className="text-2xl disabled:opacity-20 text-[#C9963A]">
            →
          </button>
        </div>
      </div>

      {/* ZONE FLOTTANTE (GÉNÉRER + SOLDE) */}
      <div className="fixed bottom-10 right-5 flex flex-col items-center gap-3 z-50">
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

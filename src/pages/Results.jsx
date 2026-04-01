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
  
  [span_4](start_span)// LOGIQUE DES LOTS[span_4](end_span)
  const [unlockedStyles, setUnlockedStyles] = useState([]);
  const [hasMoreInDb, setHasMoreInDb] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 3;

  const [credits, setCredits] = useState(getCredits());
  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';

  [span_5](start_span)// 1. CHARGEMENT INITIAL (LOT 1)[span_5](end_span)
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

  [span_6](start_span)// 2. DÉBLOQUER 3 NOUVEAUX STYLES AVEC REDIRECTION SI 0 CRÉDIT[span_6](end_span)
  const handleUnlockMore = () => {
    if (!hasCredits()) {
      navigate('/credits'); [span_7](start_span)// Redirection vers les packs[span_7](end_span)
      return;
    }

    consumeTransform(); [span_8](start_span)// Consommation du crédit[span_8](end_span)
    setCredits(getCredits());

    const seenIds = unlockedStyles.map(s => s.id);
    const { batch, hasMore } = getNextBatch(faceShape, seenIds);

    if (batch.length > 0) {
      const updatedList = [...unlockedStyles, ...batch];
      setUnlockedStyles(updatedList);
      setHasMoreInDb(hasMore);
      setPage(Math.floor((updatedList.length - 1) / PAGE_SIZE));
      [span_9](start_span)window.scrollTo({ top: 0, behavior: 'smooth' });[span_9](end_span)
    }
  };

  [span_10](start_span)// 3. ESSAYAGE VIRTUEL AVEC REDIRECTION SI 0 CRÉDIT[span_10](end_span)
  const handleTransform = async (style) => {
    if (!hasCredits()) { 
      navigate('/credits'); [span_11](start_span)// Redirection vers les packs[span_11](end_span)
      return; 
    }
    // Ta logique de transformation FAL ici...
  };

  const totalPages = Math.ceil(unlockedStyles.length / PAGE_SIZE);
  [span_12](start_span)const currentBatch = unlockedStyles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);[span_12](end_span)

  [span_13](start_span)if (!unlockedStyles.length) return null;[span_13](end_span)

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-44">
      
      [span_14](start_span){/* HEADER : IDENTITÉ & FORME[span_14](end_span) */}
      <div className="mb-10 flex gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10">
        <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" />
        <div>
          <h1 className="font-bold text-2xl text-[#C9963A]">{userName} ✨</h1>
          <p className="text-[11px] opacity-80">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      [span_15](start_span){/* AFFICHAGE DES TRESSES[span_15](end_span) */}
      <div className="flex flex-col gap-8">
        {currentBatch.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20">
             <div className="p-6">
                <h3 className="font-bold text-2xl mb-4 text-[#C9963A]">{style.name}</h3>
                
                [span_16](start_span){/* GRILLE D'IMAGES (TA STRUCTURE)[span_16](end_span) */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="col-span-2">
                    <img src={style.views.face} className="w-full h-64 object-cover rounded-[2rem]" />
                  </div>
                  <img src={style.views.back} className="w-full h-40 object-cover rounded-[1.5rem]" />
                  <img src={style.views.top} className="w-full h-40 object-cover rounded-[1.5rem]" />
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

      [span_17](start_span){/* PAGINATION CENTRALE[span_17](end_span) */}
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
          [span_18](start_span)Refaire un scan complet[span_18](end_span)
        </button>
      </div>

      [span_19](start_span){/* ACTIONS FLOTTANTES À DROITE[span_19](end_span) */}
      <div className="fixed bottom-8 right-5 flex flex-col items-center gap-4 z-50">
        
        [span_20](start_span){/* BOUTON SOLDE (HAUT)[span_20](end_span) */}
        <div 
          onClick={() => navigate('/credits')} 
          className="w-16 h-16 bg-[#2C1A0E] border-2 border-[#C9963A] text-[#FAF4EC] rounded-2xl flex flex-col items-center justify-center shadow-2xl cursor-pointer"
        >
          <span className="text-[9px] opacity-60 uppercase font-bold mb-1">Solde</span>
          <span className="font-black text-lg text-[#C9963A]">{credits}</span>
        </div>

        [span_21](start_span){/* BOUTON GÉNÉRER (BAS - Toujours visible pour permettre la redirection si 0 crédit)[span_21](end_span) */}
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

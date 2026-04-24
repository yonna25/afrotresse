import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, hasCredits, syncCreditsFromServer } from "../services/credits.js";
import Seo from "../components/Seo.jsx";

// ── HELPERS INTERNES (Pour éviter l'erreur d'import) ──
const getGeneratedStyles = () => {
  try {
    return JSON.parse(localStorage.getItem("afrotresse_generated_styles") || "[]");
  } catch (e) {
    return [];
  }
};

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(getCredits());

  useEffect(() => {
    const initResults = async () => {
      // Synchronisation initiale
      const updatedCredits = await syncCreditsFromServer();
      setCredits(updatedCredits);

      const generated = getGeneratedStyles();
      setStyles(generated);
      setLoading(false);
    };
    initResults();
  }, []);

  const handleNext = () => {
    if (currentIndex < styles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleGenerateMore = async () => {
    if (!hasCredits()) {
      navigate("/credits");
      return;
    }

    const success = await consumeCredits();
    if (success) {
      const newBalance = getCredits();
      setCredits(newBalance);
      navigate("/camera");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A0A00] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#C9963A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <Seo title="Vos Résultats — AfroTresse" />
      <div className="min-h-screen bg-[#1A0A00] text-white flex flex-col items-center pb-20">
        
        {/* HEADER & SOLDE */}
        <div className="w-full px-6 pt-10 flex justify-between items-center">
          <button onClick={() => navigate("/profile")} className="text-2xl font-bold">←</button>
          <div className="bg-[#C9963A]/20 px-4 py-2 rounded-full border border-[#C9963A]/50">
            <span className="text-[#C9963A] font-black text-xs uppercase tracking-widest">
              {credits} Crédits
            </span>
          </div>
        </div>

        <div className="mt-8 px-6 text-center">
          <h1 className="text-2xl font-black uppercase">Tes Styles</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">
            {styles.length > 0 ? `Style ${currentIndex + 1} sur ${styles.length}` : "Aucun résultat"}
          </p>
        </div>

        {/* AFFICHAGE DES RÉSULTATS */}
        <div className="mt-10 w-full max-w-sm px-6 relative">
          {styles.length > 0 ? (
            <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden border-2 border-[#C9963A]/30 shadow-2xl">
              <img 
                src={styles[currentIndex].url || styles[currentIndex]} 
                className="w-full h-full object-cover" 
                alt="Résultat coiffure" 
              />
              
              <div className="absolute inset-0 flex justify-between items-center px-4">
                <button 
                  onClick={handlePrev}
                  className={`w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                  ←
                </button>
                <button 
                  onClick={handleNext}
                  className={`w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center ${currentIndex === styles.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                  →
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-[3/4] rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-10 text-center">
              <p className="opacity-40 text-sm italic">Lance ta première analyse pour voir tes recommandations ici.</p>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-10 flex flex-col gap-4 w-full max-w-sm px-6">
          <button 
            onClick={handleGenerateMore}
            className="w-full py-4 rounded-2xl font-black text-[#1A0A00] bg-[#C9963A] shadow-xl active:scale-95 transition-transform"
          >
            {credits > 0 ? "GÉNÉRER UN AUTRE STYLE" : "RECHARGER DES CRÉDITS"}
          </button>
          
          <button 
            onClick={() => navigate("/camera")}
            className="w-full py-4 rounded-2xl font-black bg-white/5 border border-white/10 active:scale-95 transition-transform"
          >
            NOUVEAU SELFIE
          </button>
        </div>

      </div>
    </>
  );
}

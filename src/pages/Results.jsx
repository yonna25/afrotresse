import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

export default function Results() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  
  // Récupère les styles correspondants à la forme du visage
  const results = useMemo(() => {
    return BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape)).slice(0, 3);
  }, [faceShape]);

  const totalPages = results.length;

  const nextPage = () => setCurrentPage((prev) => (prev + 1) % totalPages);
  const prevPage = () => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);

  // Si on arrive sur la page sans analyse préalable
  if (totalPages === 0) {
    return (
      <div className="min-h-screen bg-brown flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gold mb-4 text-sm font-bold uppercase tracking-widest">Aucun résultat trouvé</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-gold text-brown rounded-xl font-bold">Refaire une analyse</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brown p-6 text-cream">
      <header className="flex justify-between items-center mb-10 pt-4">
        <button onClick={() => navigate('/profile')} className="text-gold font-bold text-sm">← PROFIL</button>
        <h1 className="text-xl font-display font-bold text-gold tracking-tighter italic">Tes Styles</h1>
        <div className="w-10"></div>
      </header>

      <main className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="bg-mid rounded-[2.5rem] p-10 border border-gold/10 shadow-2xl text-center min-h-[350px] flex flex-col justify-center"
          >
            <div className="text-4xl mb-6">✨</div>
            <h2 className="text-2xl font-bold text-gold mb-4">{results[currentPage]?.name}</h2>
            <p className="text-warm/80 text-sm leading-relaxed italic px-2">
              "{results[currentPage]?.description}"
            </p>
          </motion.div>
        </AnimatePresence>

        {/* --- NAVIGATION (Correction ligne 247) --- */}
        <div className="flex items-center justify-between mt-12 px-2">
          <button 
            onClick={prevPage}
            className="px-6 py-4 rounded-2xl bg-mid border border-gold/20 text-gold font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
          >
            Précédent
          </button>
          
          <span style={{ color: "#C9963A" }} className="font-black font-mono text-sm tracking-tighter">
            {currentPage + 1} / {totalPages}
          </span>

          <button 
            onClick={nextPage}
            className="px-6 py-4 rounded-2xl bg-gold text-brown font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform shadow-lg shadow-gold/20"
          >
            Suivant
          </button>
        </div>
      </main>
    </div>
  );
}

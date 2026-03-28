import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

export default function Results() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  
  const results = useMemo(() => {
    return BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape)).slice(0, 3);
  }, [faceShape]);

  const totalPages = results.length;

  const nextPage = () => setCurrentPage((prev) => (prev + 1) % totalPages);
  const prevPage = () => setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);

  if (totalPages === 0) return null;

  return (
    <div className="min-h-screen bg-brown p-6 text-cream">
      <header className="flex justify-between items-center mb-8">
        <button onClick={() => navigate('/profile')} className="text-gold font-bold">← Profil</button>
        <h1 className="text-xl font-display font-bold text-gold">Tes Styles</h1>
        <div className="w-10"></div>
      </header>

      <main className="max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-mid rounded-3xl p-6 border border-gold/20 shadow-xl text-center min-h-[300px] flex flex-col justify-center"
          >
            <h2 className="text-2xl font-bold text-gold mb-4">{results[currentPage]?.name}</h2>
            <p className="text-warm text-sm leading-relaxed italic">
              "{results[currentPage]?.description}"
            </p>
          </motion.div>
        </AnimatePresence>

        {/* --- NAVIGATION CORRIGÉE --- */}
        <div className="flex items-center justify-between mt-8 px-2">
          <button 
            onClick={prevPage}
            className="px-6 py-3 rounded-xl bg-mid border border-gold/30 text-gold font-bold text-xs uppercase"
          >
            Précédent
          </button>
          
          <span style={{ color: "#C9963A" }} className="font-bold">
            {currentPage + 1} / {totalPages}
          </span>

          <button 
            onClick={nextPage}
            className="px-6 py-3 rounded-xl bg-gold text-brown font-bold text-xs uppercase"
          >
            Suivant
          </button>
        </div>
      </main>
    </div>
  );
}

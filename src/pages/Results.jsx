import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BRAIDS_DB, FACE_SHAPE_NAMES } from '../services/faceAnalysis.js';

export default function Results() {
  const [results, setResults] = useState([]);
  const [shape, setShape] = useState('oval');

  useEffect(() => {
    // Récupération de la forme détectée stockée lors de l'analyse
    const savedShape = localStorage.getItem('afrotresse_face_shape') || 'oval';
    setShape(savedShape);
    
    // Filtrage des tresses correspondantes
    const filtered = BRAIDS_DB.filter(b => b.faceShapes.includes(savedShape));
    setResults(filtered);
  }, []);

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#C9963A]">Tes Styles Idéaux</h1>
        <p className="text-sm opacity-70">
          Adaptés à ton visage <span className="font-bold text-[#E8B96A]">{FACE_SHAPE_NAMES[shape]}</span>
        </p>
      </header>

      <div className="grid gap-6">
        {results.map((style) => (
          <motion.div 
            key={style.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 rounded-3xl overflow-hidden border border-white/10"
          >
            {/* Image de la tresse */}
            <div className="h-48 bg-gray-800 relative">
               <img src={style.views.face} alt={style.name} className="w-full h-full object-cover" 
                    onError={(e) => e.target.src = "https://via.placeholder.com/400x300?text=Style+Afro"} />
               <div className="absolute top-4 right-4 bg-[#C9963A] text-[#2C1A0E] text-xs font-bold px-2 py-1 rounded-lg">
                 {style.matchScore}% Match
               </div>
            </div>

            <div className="p-5">
              <h3 className="text-xl font-bold text-[#E8B96A] mb-2">{style.name}</h3>
              <p className="text-sm opacity-80 mb-4 line-clamp-2">{style.description}</p>
              
              <div className="flex gap-2 mb-6">
                {style.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase tracking-widest border border-white/20 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              {/* LE BOUTON TESTER */}
              <button 
                onClick={() => window.location.href = `/try-on?id=${style.id}`}
                className="w-full py-4 bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E] rounded-2xl font-bold shadow-lg shadow-[#C9963A]/20 active:scale-95 transition-transform"
              >
                Essayer virtuellement 🤳
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

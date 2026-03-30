import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BRAIDS_DB, FACE_SHAPE_NAMES } from '../services/faceAnalysis.js';
import { getSavedStyles, unsaveStyle } from '../services/credits.js';

export default function Library() {
  const [savedStyles, setSavedStyles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les styles sauvegardés au mount
    const saved = getSavedStyles();
    setSavedStyles(saved);
    setLoading(false);
  }, []);

  const handleRemove = (styleId) => {
    unsaveStyle(styleId);
    setSavedStyles(savedStyles.filter(s => s.id !== styleId));
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-28">
      
      {/* HEADER */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10">
        <h1 className="text-3xl font-bold text-[#C9963A] mb-2">📚 Ma Bibliothèque</h1>
        <p className="text-sm opacity-70">Tes styles favoris et tes analyses passées.</p>
      </motion.header>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-20">
          <p className="opacity-60">Chargement...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && savedStyles.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 opacity-60">
          <p className="text-lg mb-2">📭 Aucun style enregistré pour le moment.</p>
          <p className="text-sm">Sauvegarde tes styles favoris pour les retrouver ici!</p>
        </motion.div>
      )}

      {/* SAVED STYLES GRID */}
      {!loading && savedStyles.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedStyles.map((style, index) => {
            const styleKey = style.id?.replace(/-/g, '') || style.id;
            const faceImg = style.views?.face || `/styles/${styleKey}-face.jpg`;

            return (
              <motion.div
                key={style.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#3D2616] rounded-2xl overflow-hidden border border-[#C9963A]/20 shadow-lg hover:shadow-xl transition-all">
                
                {/* IMAGE */}
                <div className="h-48 overflow-hidden bg-black/40">
                  <img 
                    src={faceImg} 
                    alt={style.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.target.src = '/styles/boxbraids-face.jpg';
                    }}
                  />
                </div>

                {/* INFO */}
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2">{style.name}</h3>
                  
                  {/* Duration */}
                  {style.duration && (
                    <p className="text-xs text-[#C9963A]/80 mb-2">
                      ⏱️ {style.duration}
                    </p>
                  )}

                  {/* Face shapes */}
                  {style.faceShapes && (
                    <p className="text-xs opacity-70 mb-4">
                      👤 Idéal pour : {style.faceShapes.map(shape => FACE_SHAPE_NAMES[shape] || shape).join(', ')}
                    </p>
                  )}

                  {/* Description */}
                  {style.description && (
                    <p className="text-xs opacity-60 mb-4 line-clamp-2">
                      {style.description}
                    </p>
                  )}

                  {/* Tags */}
                  {style.tags && (
                    <div className="flex gap-2 flex-wrap mb-4">
                      {style.tags.slice(0, 2).map((tag, i) => (
                        <span 
                          key={i} 
                          className="text-[10px] bg-[#C9963A]/20 text-[#C9963A] px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(style.id)}
                    className="w-full py-2 rounded-lg text-sm font-semibold bg-red-900/30 text-red-300 hover:bg-red-900/50 transition-colors border border-red-500/30">
                    Retirer de la bibliothèque
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

    </div>
  );
}

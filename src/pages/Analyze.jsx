import React, { useState, useEffect } from 'react'
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { analyzeFace } from "../services/faceAnalysis.js";
import { consumeAnalysis } from "../services/credits.js";

const STEPS = [
  "Analyse des traits uniques...",
  "Étude de la structure osseuse...",
  "Calcul des proportions idéales...",
  "Sélection des tresses royales..."
];

export default function Analyze() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const selfieUrl = sessionStorage.getItem("afrotresse_photo");

  useEffect(() => {
    if (!selfieUrl) { navigate("/"); return; }

    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + 1));
    }, 45);

    const stepInterval = setInterval(() => {
      setStepIdx(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    const run = async () => {
      try {
        // 1. Analyser le selfie
        const result = await analyzeFace(selfieUrl);
        
        // 2. SAUVEGARDER LE RÉSULTAT COMPLET dans sessionStorage ✅
        sessionStorage.setItem("afrotresse_results", JSON.stringify(result));
        
        // 3. Sauvegarder aussi la forme du visage dans localStorage
        localStorage.setItem("afrotresse_face_shape", result.faceShape);
        
        // 4. Consommer un crédit d'analyse
        consumeAnalysis();
        
        // 5. Naviguer vers /results
        setShowResults(true);
        setTimeout(() => navigate("/results"), 2000);
      } catch (err) {
        console.error("Analysis error:", err);
        // Fallback: envoyer quand même à /results (Analyze.js a un fallback)
        const fallback = {
          faceShape: "oval",
          faceShapeName: "Ovale",
          recommendations: []
        };
        sessionStorage.setItem("afrotresse_results", JSON.stringify(fallback));
        setShowResults(true);
        setTimeout(() => navigate("/results"), 2000);
      }
    };

    run();
    return () => { clearInterval(interval); clearInterval(stepInterval); };
  }, [navigate, selfieUrl]);

  return (
    <div className="min-h-screen bg-[#2C1A0E] flex flex-col items-center justify-center p-10 text-[#FAF4EC]">
      
      {/* ÉTINCELLES + TITRE "VOICI TES RÉSULTATS" */}
      {showResults && (
        <>
          {/* Étincelles dorées traversant l'écran */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="fixed text-4xl pointer-events-none z-50"
              initial={{ 
                opacity: 0, 
                x: -100, 
                y: Math.random() * window.innerHeight 
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                x: window.innerWidth + 100 
              }}
              transition={{ 
                delay: i * 0.15, 
                duration: 1.8, 
                ease: "easeInOut" 
              }}
            >
              ✨
            </motion.div>
          ))}

          {/* Titre "Voici tes résultats ✨" */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="fixed inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
          >
            <h1 className="font-display text-5xl font-black text-center text-white mb-4">
              Voici tes résultats
            </h1>
            <p className="text-6xl">✨</p>
          </motion.div>
        </>
      )}

      {/* SCANNING (caché si résultats affichés) */}
      {!showResults && (
        <>
          <div className="relative w-64 h-64 mb-12">
            <div className="relative w-full h-full rounded-full border-4 border-[#C9963A] overflow-hidden z-10 shadow-2xl">
              <img src={selfieUrl} className="w-full h-full object-cover" alt="Scan" />
              <motion.div 
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-[#E8B96A] shadow-[0_0_15px_#C9963A] z-20"
              />
            </div>
          </div>
          <div className="w-full max-w-xs text-center">
            <h2 className="text-[#C9963A] font-bold text-3xl mb-2">{progress}%</h2>
            <p className="text-xs opacity-70 mb-8 uppercase tracking-widest">{STEPS[stepIdx]}</p>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-[#C9963A]" animate={{ width: `${progress}%` }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

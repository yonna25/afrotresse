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
        setTimeout(() => navigate("/results"), 1000);
      } catch (err) {
        console.error("Analysis error:", err);
        // Fallback: envoyer quand même à /results (Analyze.js a un fallback)
        const fallback = {
          faceShape: "oval",
          faceShapeName: "Ovale",
          recommendations: []
        };
        sessionStorage.setItem("afrotresse_results", JSON.stringify(fallback));
        navigate("/results");
      }
    };

    run();
    return () => { clearInterval(interval); clearInterval(stepInterval); };
  }, [navigate, selfieUrl]);

  return (
    <div className="min-h-screen bg-[#2C1A0E] flex flex-col items-center justify-center p-10 text-[#FAF4EC]">
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
    </div>
  );
}

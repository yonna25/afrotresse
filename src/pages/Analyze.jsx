import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from "framer-motion";
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
  const navigate   = useNavigate();
  const [progress, setProgress]       = useState(0);
  const [stepIdx, setStepIdx]         = useState(0);
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("afrotresse_user_name") || ""
  );

  // Formulaire 60%
  const [showForm, setShowForm]   = useState(false);
  const [formDone, setFormDone]   = useState(
    () => !!localStorage.getItem("afrotresse_user_name")
  );
  const [prenom, setPrenom]       = useState(
    () => localStorage.getItem("afrotresse_user_name") || ""
  );
  const formShownRef = useRef(false);
  const countdownRef = useRef(null);
  const [countdown, setCountdown] = useState(10);

  const selfieUrl = sessionStorage.getItem("afrotresse_photo");

  // Déclencher le formulaire à 60%
  useEffect(() => {
    if (progress >= 60 && !formShownRef.current && !formDone) {
      formShownRef.current = true;
      setCountdown(10);
      setShowForm(true);
    }
  }, [progress, formDone]);

  // Countdown 10s → auto-dismiss
  useEffect(() => {
    if (!showForm) {
      clearInterval(countdownRef.current);
      return;
    }
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setShowForm(false);
          setFormDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [showForm]);

  const handleFormSubmit = () => {
    clearInterval(countdownRef.current);
    const name = prenom.trim() || "Reine";
    localStorage.setItem("afrotresse_user_name", name);
    setDisplayName(name);
    setFormDone(true);
    setShowForm(false);
  };

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
        const result = await analyzeFace(selfieUrl);
        sessionStorage.setItem("afrotresse_results", JSON.stringify(result));
        localStorage.setItem("afrotresse_face_shape", result.faceShape);
        consumeAnalysis();
        const prevTrials = parseInt(localStorage.getItem('afrotresse_ai_trials') || '0', 10);
        localStorage.setItem('afrotresse_ai_trials', String(prevTrials + 1));
        sessionStorage.setItem("afrotresse_fresh_results", "1");
        navigate("/results");
      } catch (err) {
        console.error("Analysis error:", err);
        const fallback = { faceShape: "oval", faceShapeName: "Ovale", recommendations: [] };
        sessionStorage.setItem("afrotresse_results", JSON.stringify(fallback));
        sessionStorage.setItem("afrotresse_fresh_results", "1");
        navigate("/results");
      }
    };

    run();
    return () => { clearInterval(interval); clearInterval(stepInterval); };
  }, [navigate, selfieUrl]);

  return (
    <div className="min-h-screen bg-[#2C1A0E] flex flex-col items-center justify-center p-10 text-[#FAF4EC]">

      {/* SCANNING */}
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

      {/* MINI FORMULAIRE à 60% — bottom sheet fixe */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-8 pt-1"
            style={{ background: "linear-gradient(to top, #1A0800 80%, transparent)" }}
          >
            <div
              className="w-full max-w-sm mx-auto rounded-[2rem] p-5"
              style={{
                background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
                border: "1.5px solid rgba(201,150,58,0.5)",
                boxShadow: "0 -8px 48px rgba(0,0,0,0.7)",
              }}
            >
              {/* Countdown bar */}
              <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-[#C9963A] rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 10, ease: "linear" }}
                />
              </div>

              <div className="flex items-start justify-between mb-1">
                <p className="font-black text-base text-white leading-tight">
                  Sauvegarder tes résultats 💾
                </p>
                <span className="text-[10px] text-white/30 font-bold ml-2 mt-0.5 shrink-0">
                  {countdown}s
                </span>
              </div>
              <p className="text-[11px] text-white/50 mb-4">
                Retrouve tes favoris sur n'importe quel appareil.
              </p>

              <div className="flex flex-col gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Ton prénom..."
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none"
                  style={{
                    background: "rgba(92,51,23,0.55)",
                    border: "1px solid rgba(201,150,58,0.3)",
                    color: "#FAF4EC",
                  }}
                />
              </div>

              <button
                onClick={handleFormSubmit}
                className="w-full py-3 rounded-xl font-black text-sm text-[#2C1A0E]"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
              >
                Sauvegarder mes résultats ✨
              </button>

              <button
                onClick={() => { clearInterval(countdownRef.current); setShowForm(false); setFormDone(true); }}
                className="w-full py-2 mt-1 text-xs text-center"
                style={{ color: "rgba(250,244,236,0.3)" }}
              >
                Pas maintenant
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

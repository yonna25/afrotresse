import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
  const [analysisDone, setAnalysisDone] = useState(false);

  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("afrotresse_user_name") || ""
  );

  const [showForm, setShowForm] = useState(false);
  const [formDone, setFormDone] = useState(
    () => !!localStorage.getItem("afrotresse_user_name")
  );

  const [prenom, setPrenom] = useState(
    () => localStorage.getItem("afrotresse_user_name") || ""
  );

  const formShownRef = useRef(false);
  const countdownRef = useRef(null);
  const [countdown, setCountdown] = useState(10);

  const selfieUrl = sessionStorage.getItem("afrotresse_photo");

  // Déclenchement formulaire à 60%
  useEffect(() => {
    if (progress >= 60 && !formShownRef.current && !formDone) {
      formShownRef.current = true;
      setCountdown(10);
      setShowForm(true);
    }
  }, [progress, formDone]);

  // Countdown
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

  // Progression UI
  useEffect(() => {
    if (!selfieUrl) {
      navigate("/");
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 100 : prev + 1));
    }, 45);

    const stepInterval = setInterval(() => {
      setStepIdx(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [navigate, selfieUrl]);

  // 🔐 Analyse API SÉCURISÉE (via serveur)
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ selfieUrl })
        });

        if (!res.ok) {
          throw new Error("Erreur serveur");
        }

        const result = await res.json();

        sessionStorage.setItem("afrotresse_results", JSON.stringify(result));
        localStorage.setItem("afrotresse_face_shape", result.faceShape);

        const prevTrials = parseInt(localStorage.getItem('afrotresse_ai_trials') || '0', 10);
        localStorage.setItem('afrotresse_ai_trials', String(prevTrials + 1));

        sessionStorage.setItem("afrotresse_fresh_results", "1");

        setAnalysisDone(true);

      } catch (err) {
        console.error(err);

        const fallback = {
          faceShape: "oval",
          faceShapeName: "Ovale",
          recommendations: []
        };

        sessionStorage.setItem("afrotresse_results", JSON.stringify(fallback));
        sessionStorage.setItem("afrotresse_fresh_results", "1");

        setAnalysisDone(true);
      }
    };

    run();
  }, [selfieUrl]);

  // ✅ Redirection sécurisée (replace pour éviter retour bug)
  useEffect(() => {
    if (progress >= 100 && analysisDone && !showForm) {
      navigate("/results", { replace: true });
    }
  }, [progress, analysisDone, showForm, navigate]);

  return (
    <div className="min-h-screen bg-[#2C1A0E] flex flex-col items-center justify-center p-10 text-[#FAF4EC]">

      {/* SCAN */}
      <div className="relative w-64 h-64 mb-12">
        <div className="relative w-full h-full rounded-full border-4 border-[#C9963A] overflow-hidden shadow-2xl">
          <img src={selfieUrl} className="w-full h-full object-cover" alt="Scan visage utilisateur" />

          <motion.div
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-[#E8B96A]"
          />
        </div>
      </div>

      {/* PROGRESS */}
      <div className="w-full max-w-xs text-center">
        <h2 className="text-[#C9963A] font-bold text-3xl mb-2">{progress}%</h2>
        <p className="text-xs opacity-70 mb-8 uppercase tracking-widest">
          {STEPS[stepIdx]}
        </p>

        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-[#C9963A]" animate={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* FORMULAIRE */}
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
              <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-[#C9963A]"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 10, ease: "linear" }}
                />
              </div>

              <div className="flex justify-between items-start mb-2">
                <p className="font-black text-white">Sauvegarde ton résultat</p>
                <span className="text-xs text-white/40">{countdown}s</span>
              </div>

              <p className="text-xs text-white/50 mb-4">
                Ajoute ton prénom pour personnaliser ton résultat.
              </p>

              <input
                type="text"
                placeholder="Ton prénom..."
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleFormSubmit()}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none mb-3"
                style={{
                  background: "rgba(92,51,23,0.55)",
                  border: "1px solid rgba(201,150,58,0.3)",
                  color: "#FAF4EC",
                }}
              />

              <button
                onClick={handleFormSubmit}
                className="w-full py-3 rounded-xl font-black text-sm text-[#2C1A0E]"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
              >
                Sauvegarder ✨
              </button>

              <button
                onClick={() => {
                  clearInterval(countdownRef.current);
                  setShowForm(false);
                  setFormDone(true);
                }}
                className="w-full py-2 mt-2 text-xs text-white/40"
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

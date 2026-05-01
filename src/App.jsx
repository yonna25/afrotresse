import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Routes, Route } from 'react-router-dom';
import CameraCapture from './components/CameraCapture';
import Analyse from './pages/Analyse'; 
import { getCredits, consumeCredits, syncCreditsFromServer } from "./services/credits.js";

export default function App() {
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());

  // 1. Gestion de la capture photo
  const handleCapture = (data) => {
    setCapturedImage(data.url);
    sessionStorage.setItem("afrotresse_photo", data.url);
  };

  // 2. Logique du bouton "Générer mon style" avec déduction de crédit
  const handleStartAnalysis = async () => {
    const freshCredits = getCredits();
    
    if (freshCredits <= 0) {
      navigate('/credits');
      return;
    }

    // Déduction du crédit pour l'analyse
    const ok = await consumeCredits(1);
    
    if (ok) {
      setCredits(getCredits()); // Mise à jour locale du solde
      navigate('/analyse');
    } else {
      // Tentative de resynchronisation en cas d'échec de communication
      const synced = await syncCreditsFromServer().catch(() => 0);
      if (synced > 0) {
        await consumeCredits(1);
        setCredits(getCredits());
        navigate('/analyse');
      } else {
        navigate('/credits');
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] overflow-hidden">
      <Routes>
        <Route path="/" element={
          <div className="relative h-full w-full">
            {!capturedImage ? (
              <CameraCapture 
                onCapture={handleCapture} 
                onClose={() => navigate('/home')} 
              />
            ) : (
              <div className="relative h-[100dvh] w-full bg-black">
                <img 
                  src={capturedImage} 
                  className="h-full w-full object-cover" 
                  alt="Selfie de l'utilisatrice" 
                />
                
                {/* Bouton pour annuler et reprendre la photo */}
                <button 
                  onClick={() => setCapturedImage(null)}
                  className="absolute top-6 right-6 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center z-50 text-white border border-white/20 active:scale-90 transition-transform"
                >
                  ✕
                </button>

                {/* BOUTON FLOTTANT GÉNÉRER */}
                <AnimatePresence>
                  <motion.button
                    initial={{ y: 100, x: '-50%', opacity: 0 }}
                    animate={{ y: 0, x: '-50%', opacity: 1 }}
                    onClick={handleStartAnalysis}
                    className="fixed bottom-12 left-1/2 z-50 bg-[#C9963A] text-[#1A0A00] px-14 py-5 rounded-full font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-[#E8B96A]/30 active:scale-95 transition-transform whitespace-nowrap"
                  >
                    Générer mon style
                  </motion.button>
                </AnimatePresence>
              </div>
            )}
          </div>
        } />

        <Route path="/analyse" element={<Analyse />} />
      </Routes>
    </div>
  );
}

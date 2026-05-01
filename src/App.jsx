import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Routes, Route } from 'react-router-dom';
import CameraCapture from './components/CameraCapture';
import Analyze from './pages/Analyze'; 
import { useSupabaseCredits } from './hooks/useSupabaseCredits';

export default function App() {
  const navigate = useNavigate();
  const { credits, deductCredit } = useSupabaseCredits();
  const [capturedImage, setCapturedImage] = useState(null);

  // 1. Quand la photo est prise
  const handleCapture = (data) => {
    setCapturedImage(data.url);
    sessionStorage.setItem("afrotresse_photo", data.url);
  };

  // 2. Quand on clique sur le bouton flottant "Générer"
  const handleStartAnalysis = async () => {
    if (credits <= 0) {
      navigate('/credits');
      return;
    }

    // ON DÉDUIT LE CRÉDIT ICI
    const success = await deductCredit();

    if (success) {
      navigate('/analyze');
    } else {
      alert("Erreur lors de l'utilisation du crédit.");
    }
  };

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC]">
      <Routes>
        <Route path="/" element={
          <div className="relative h-screen w-full overflow-hidden">
            {!capturedImage ? (
              <CameraCapture onCapture={handleCapture} onClose={() => navigate('/home')} />
            ) : (
              <div className="relative h-full w-full bg-black">
                <img src={capturedImage} className="h-full w-full object-cover" alt="Capture" />
                
                {/* Bouton Fermer pour reprendre une photo */}
                <button 
                  onClick={() => setCapturedImage(null)}
                  className="absolute top-6 right-6 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center z-50 text-white border border-white/20"
                >
                  ✕
                </button>

                {/* LE BOUTON FLOTTANT GÉNÉRÉ */}
                <AnimatePresence>
                  <motion.button
                    initial={{ y: 100, x: '-50%' }}
                    animate={{ y: 0, x: '-50%' }}
                    onClick={handleStartAnalysis}
                    className="fixed bottom-12 left-1/2 z-50 bg-[#C9963A] text-[#1A0A00] px-14 py-5 rounded-full font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-gold/30 active:scale-95 transition-transform"
                  >
                    Générer mon style
                  </motion.button>
                </AnimatePresence>
              </div>
            )}
          </div>
        } />

        <Route path="/analyze" element={<Analyze />} />
      </Routes>
    </div>
  );
}

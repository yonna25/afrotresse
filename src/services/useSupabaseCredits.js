import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Routes, Route } from 'react-router-dom';
import CameraCapture from './components/CameraCapture';
import Analyze from './pages/Analyze'; 
import { consumeCredits, syncCreditsFromServer } from './services/credits.js';
import { 
  getCurrentUser, 
  getSupabaseCredits, 
  ensureUserExists, 
  addSupabaseCredits 
} from './services/useSupabaseCredits.js';

export default function App() {
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState(null);

  // Initialisation de l'utilisateur au montage
  useEffect(() => {
    const initUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        await ensureUserExists(user);
        await syncCreditsFromServer();
      }
    };
    initUser();
  }, []);

  const handleCapture = (data) => {
    setCapturedImage(data.url);
    sessionStorage.setItem("afrotresse_photo", data.url);
  };

  const handleStartAnalysis = async () => {
    // On passe par le serveur pour la déduction
    const success = await consumeCredits(1);
    
    if (success) {
      navigate('/analyze');
    } else {
      // Si pas assez de crédits ou erreur serveur
      navigate('/credits');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] overflow-hidden">
      <Routes>
        <Route path="/" element={
          <div className="relative h-full w-full">
            {!capturedImage ? (
              <CameraCapture onCapture={handleCapture} onClose={() => navigate('/home')} />
            ) : (
              <div className="relative h-[100dvh] w-full bg-black">
                <img src={capturedImage} className="h-full w-full object-cover" alt="Capture" />
                
                <button 
                  onClick={() => setCapturedImage(null)}
                  className="absolute top-6 right-6 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center z-50 text-white border border-white/20"
                >
                  ✕
                </button>

                <AnimatePresence>
                  <motion.button
                    initial={{ y: 100, x: '-50%', opacity: 0 }}
                    animate={{ y: 0, x: '-50%', opacity: 1 }}
                    onClick={handleStartAnalysis}
                    className="fixed bottom-12 left-1/2 z-50 bg-[#C9963A] text-[#1A0A00] px-14 py-5 rounded-full font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-[#E8B96A]/30 active:scale-95 transition-transform"
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CameraCapture from './components/CameraCapture';
import AnalysisOverlay from './components/AnalysisOverlay'; // Ton composant d'analyse
import { useSupabaseCredits } from './hooks/useSupabaseCredits';
import { useNavigate } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();
  const { credits, deductCredit, loading: creditsLoading } = useSupabaseCredits();
  
  const [view, setView] = useState('home'); // home, camera, results
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // 1. GESTION DE LA CAPTURE
  const handleCapture = (data) => {
    setCapturedImage(data.url);
    setView('preview'); // On reste sur une vue de prévisualisation avant de générer
  };

  // 2. LOGIQUE DE DÉFALCATION ET GÉNÉRATION
  const handleStartAnalysis = async () => {
    if (credits <= 0) {
      setView('credits');
      return;
    }

    setIsAnalyzing(true);

    try {
      // APPEL À LA DÉDUCTION (Retire -1 dans Supabase et Local)
      const success = await deductCredit();

      if (success) {
        setShowAnalysis(true);
        // Simuler le délai de l'IA ou appeler ton API ici
        setTimeout(() => {
          setIsAnalyzing(false);
          setShowAnalysis(false);
          setView('results');
        }, 5000);
      } else {
        alert("Erreur lors de l'utilisation du crédit.");
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A0A00] text-cream overflow-hidden">
      
      {/* VUE : ACCUEIL */}
      {view === 'home' && (
        <div className="flex flex-col items-center justify-center h-screen p-6">
          <h1 className="text-4xl font-black text-gold mb-8">AFROTRESSE</h1>
          <button 
            onClick={() => setView('camera')}
            className="bg-gold text-brown px-10 py-4 rounded-full font-bold uppercase"
          >
            Commencer l'expérience
          </button>
        </div>
      )}

      {/* VUE : CAMÉRA */}
      {view === 'camera' && (
        <CameraCapture 
          onCapture={handleCapture} 
          onClose={() => setView('home')} 
        />
      )}

      {/* VUE : PRÉVISUALISATION (Après Capture) */}
      {view === 'preview' && capturedImage && (
        <div className="relative h-screen w-full bg-black">
          <img 
            src={capturedImage} 
            className="h-full w-full object-cover" 
            alt="Capture" 
          />
          
          {/* BOUTON FERMER LE ZOOM */}
          <button 
            onClick={() => { setCapturedImage(null); setView('camera'); }}
            className="absolute top-6 right-6 w-10 h-10 glass rounded-full flex items-center justify-center z-50"
          >
            ✕
          </button>

          {/* BOUTON FLOTTANT GÉNÉRÉ (Apparaît si pas en cours d'analyse) */}
          <AnimatePresence>
            {!isAnalyzing && (
              <motion.button
                initial={{ y: 100, x: '-50%' }}
                animate={{ y: 0, x: '-50%' }}
                exit={{ y: 100, x: '-50%' }}
                onClick={handleStartAnalysis}
                className="fixed bottom-10 left-1/2 z-50 bg-[#C9963A] text-[#1A0A00] px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.6)] active:scale-95"
              >
                Générer mon style
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* OVERLAY D'ANALYSE (L'animation qui tourne) */}
      <AnimatePresence>
        {showAnalysis && (
          <AnalysisOverlay image={capturedImage} />
        )}
      </AnimatePresence>

      {/* VUE : RÉSULTATS (Après Analyse) */}
      {view === 'results' && (
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gold">Tes styles suggérés</h2>
          {/* Ton mapping de styles ici */}
          <button onClick={() => setView('home')} className="mt-8 text-cream/50 underline">
            Refaire un essai
          </button>
        </div>
      )}

    </div>
  );
}

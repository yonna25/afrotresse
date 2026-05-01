import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// imports de tes composants
import CameraCapture from './components/CameraCapture';
import Analysis from './components/Analysis'; // Vérifie bien le nom du fichier ici
import { useSupabaseCredits } from './hooks/useSupabaseCredits';

export default function App() {
  const navigate = useNavigate();
  const { credits, deductCredit } = useSupabaseCredits();
  
  // États de navigation et de processus
  const [view, setView] = useState('home'); // home, camera, preview, results
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. GESTION DE LA CAPTURE (Sortie de la caméra)
  const handleCapture = (data) => {
    setCapturedImage(data.url);
    setView('preview');
  };

  // 2. LOGIQUE DE DÉFALCATION DÉFINITIVE
  const handleStartAnalysis = async () => {
    // Sécurité 1 : Vérification locale
    if (credits <= 0) {
      navigate('/credits');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Sécurité 2 : Appel Serveur (DEDUCT CREDIT)
      // Cette fonction retire -1 dans Supabase et met à jour le state 'credits'
      const success = await deductCredit();

      if (success) {
        // Le crédit est déduit, on laisse l'overlay d'analyse faire son travail
        // On attend la fin de l'animation pour passer aux résultats
        setTimeout(() => {
          setIsAnalyzing(false);
          setView('results');
        }, 6000); 
      } else {
        // Si problème serveur, on annule tout
        setIsAnalyzing(false);
        alert("Erreur de synchronisation des crédits.");
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#F5F5F0] font-body">
      
      {/* VUE : ACCUEIL */}
      {view === 'home' && (
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
          <h1 className="text-5xl font-black text-[#C9963A] mb-4 tracking-tighter italic">AFROTRESSE</h1>
          <p className="text-cream/60 mb-10 max-w-xs text-sm">Trouvez la tresse parfaite grâce à notre IA d'analyse faciale.</p>
          <button 
            onClick={() => setView('camera')}
            className="bg-[#C9963A] text-[#1A0A00] px-12 py-4 rounded-full font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
          >
            Scanner mon visage
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

      {/* VUE : PRÉVISUALISATION + BOUTON FLOTTANT */}
      {view === 'preview' && capturedImage && (
        <div className="relative h-screen w-full bg-black">
          <img src={capturedImage} className="h-full w-full object-cover" alt="Capture" />
          
          {/* Bouton pour recommencer */}
          {!isAnalyzing && (
            <button 
              onClick={() => { setCapturedImage(null); setView('camera'); }}
              className="absolute top-6 right-6 w-12 h-12 glass rounded-full flex items-center justify-center z-50 text-white"
            >
              ✕
            </button>
          )}

          {/* LE BOUTON FLOTTANT GÉNÉRÉ */}
          <AnimatePresence>
            {!isAnalyzing && (
              <motion.button
                initial={{ y: 100, x: '-50%' }}
                animate={{ y: 0, x: '-50%' }}
                exit={{ y: 100, x: '-50%' }}
                onClick={handleStartAnalysis}
                className="fixed bottom-12 left-1/2 z-50 bg-[#C9963A] text-[#1A0A00] px-14 py-5 rounded-full font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-gold/30"
              >
                Générer mon style
              </motion.button>
            )}
          </AnimatePresence>

          {/* L'OVERLAY D'ANALYSE (S'affiche pendant la déduction) */}
          {isAnalyzing && (
            <Analysis image={capturedImage} />
          )}
        </div>
      )}

      {/* VUE : RÉSULTATS */}
      {view === 'results' && (
        <div className="p-6 pt-20 flex flex-col items-center">
          <h2 className="text-3xl font-black text-[#C9963A] uppercase italic">Analyses Terminées</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
            {/* Ici tes résultats de tresses */}
            <div className="aspect-[3/4] bg-brown rounded-2xl animate-pulse"></div>
            <div className="aspect-[3/4] bg-brown rounded-2xl animate-pulse"></div>
          </div>
          <button onClick={() => setView('home')} className="mt-12 text-[#C9963A] font-bold uppercase tracking-widest text-sm border-b border-[#C9963A]">
            Nouvel essai
          </button>
        </div>
      )}
    </div>
  );
}

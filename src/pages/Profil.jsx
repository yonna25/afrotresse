import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits } from "../services/credits.js";

export default function Profile() {
  const navigate = useNavigate();
  
  // États pour rendre les données dynamiques
  const [credits, setCredits] = useState(0);
  const [userName, setUserName] = useState("Ma Reine");
  const [analysesCount, setAnalysesCount] = useState(0);

  useEffect(() => {
    // Récupération des vraies données au chargement
    setCredits(getCredits());
    
    const savedName = localStorage.getItem('afrotresse_user_name');
    if (savedName) setUserName(savedName);

    // On peut compter les analyses passées dans le stockage
    const history = sessionStorage.getItem('afrotresse_results');
    if (history) setAnalysesCount(1); 
  }, []);

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-white flex flex-col items-center px-4 py-6 pb-24">

      {/* HEADER : AVATAR & NOM */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-[#C9963A] overflow-hidden bg-[#2a1a14] flex items-center justify-center">
            {/* Si tu as une photo de profil en stock, on l'affiche, sinon icône */}
            <span className="text-4xl">👑</span>
          </div>
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#C9963A] text-[#1a0f0a] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
            Premium
          </span>
        </div>

        <h1 className="text-2xl font-bold mt-2">{userName} 👑</h1>
        <p className="text-sm text-gray-400 italic">
          Ta couronne commence par tes cheveux
        </p>
      </div>

      {/* STATS DYNAMIQUES */}
      <div className="flex justify-between w-full max-w-xs mt-8 text-center bg-white/5 p-4 rounded-3xl border border-white/10">
        <div>
          <p className="text-xl font-black text-[#C9963A]">{analysesCount}</p>
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Analyses</p>
        </div>
        <div className="border-x border-white/10 px-6">
          <p className="text-xl font-black text-[#C9963A]">0</p>
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Favoris</p>
        </div>
        <div>
          <p className="text-xl font-black text-[#C9963A]">{credits}</p>
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Crédits</p>
        </div>
      </div>

      {/* BOUTON D'ACTION PRINCIPAL */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className="mt-8 bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#1a0f0a] px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 uppercase text-sm tracking-tight"
      >
        🔍 Analyser une coiffure
      </motion.button>

      {/* ONGLETS (TABS) */}
      <div className="flex bg-[#2a1a14] rounded-2xl mt-10 p-1 w-full max-w-sm border border-white/5">
        <button className="flex-1 bg-[#C9963A] text-[#1a0f0a] py-3 rounded-xl text-xs font-bold uppercase">
          Styles
        </button>
        <button onClick={() => navigate('/history')} className="flex-1 text-gray-400 py-3 text-xs font-bold uppercase">
          Essais
        </button>
        <button onClick={() => navigate('/credits')} className="flex-1 text-gray-400 py-3 text-xs font-bold uppercase">
          Crédits
        </button>
      </div>

      {/* ÉTAT VIDE / CONTENU */}
      <div className="flex flex-col items-center justify-center mt-12 text-center px-6">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-gray-300 font-medium">Aucun style enregistré</p>
        <p className="text-xs text-gray-500 mt-2">
          Tes coiffures préférées apparaîtront ici après tes analyses.
        </p>
      </div>

      {/* BOUTON FLOTTANT (APPAREIL PHOTO) */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => navigate('/')}
        className="fixed bottom-8 bg-[#C9963A] text-[#1a0f0a] w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl text-2xl border-4 border-[#1a0f0a] z-50"
      >
        📸
      </motion.button>

    </div>
  );
}

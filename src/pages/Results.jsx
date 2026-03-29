import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BRAIDS_DB } from "../services/faceAnalysis.js"; //
import { getCredits } from "../services/credits.js"; //

export default function Results() {
  const [debugInfo, setDebugInfo] = useState({});
  const [error, setError] = useState(null);

  // 1. PHASE DE DIAGNOSTIC AU CHARGEMENT
  useEffect(() => {
    try {
      const shape = localStorage.getItem("afrotresse_face_shape");
      const photo = sessionStorage.getItem("afrotresse_photo");
      const credits = getCredits();

      setDebugInfo({
        shapeDetected: shape || "NON DÉTECTÉE",
        photoPresent: photo ? "OUI (OK)" : "NON (VIDE)",
        dbSize: BRAIDS_DB ? BRAIDS_DB.length : 0,
        credits: credits
      });

      if (!shape) setError("Aucune forme de visage trouvée dans le stockage.");
      if (!BRAIDS_DB || BRAIDS_DB.length === 0) setError("La base de données BRAIDS_DB est vide ou mal importée.");
      
    } catch (err) {
      setError("Erreur système : " + err.message);
    }
  }, []);

  // 2. FILTRAGE DES STYLES
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const filteredStyles = BRAIDS_DB ? BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape)) : [];

  // 3. AFFICHAGE DE SÉCURITÉ (SI ERREUR)
  if (error) {
    return (
      <div className="min-h-screen bg-[#2C1A0E] text-red-400 p-10 flex flex-col gap-4">
        <h1 className="text-2xl font-bold border-b border-red-900 pb-2">🆘 Diagnostic d'Erreur</h1>
        <pre className="bg-black/50 p-4 rounded text-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        <p className="bg-red-900/20 p-4 rounded border border-red-500/50 text-white">
          {error}
        </p>
        <button onClick={() => window.location.href='/'} className="bg-white/10 text-white p-4 rounded-xl">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  // 4. AFFICHAGE RÉEL (DESIGN ROYAL)
  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-6 pb-24">
      <header className="mb-10 text-center">
        <h1 className="text-[#C9963A] text-2xl font-bold uppercase tracking-tighter">Tes Recommandations</h1>
        <p className="text-[10px] opacity-50">Morphologie détectée : <span className="text-[#C9963A]">{faceShape}</span></p>
      </header>

      <div className="space-y-8">
        {filteredStyles.length > 0 ? (
          filteredStyles.map((style) => (
            <motion.div 
              key={style.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#3D2616] rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl"
            >
              {/* Affichage de l'image principale depuis /public/styles/ */}
              <img 
                src={style.views?.face || "/styles/placeholder.jpg"} 
                className="w-full h-64 object-cover" 
                alt={style.name} 
                onError={(e) => { e.target.src = "https://via.placeholder.com/400x500?text=Image+Introuvable"; }}
              />
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold">{style.name}</h3>
                  <span className="bg-[#C9963A] text-[#2C1A0E] text-[10px] px-2 py-1 rounded-full font-black">
                    {style.matchScore}% MATCH
                  </span>
                </div>
                <p className="text-xs opacity-60 leading-relaxed mb-6">{style.description}</p>
                <button className="w-full py-4 bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E] font-black rounded-2xl active:scale-95 transition-transform">
                  ESSAYER CE STYLE ✨
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center p-10 border-2 border-dashed border-white/10 rounded-3xl opacity-50">
            <p>Aucun style trouvé pour ta forme de visage dans la base de données.</p>
          </div>
        )}
      </div>

      {/* Indicateur de crédits fixe */}
      <div className="fixed bottom-10 right-6 bg-[#C9963A] text-[#2C1A0E] px-4 py-2 rounded-xl font-black shadow-2xl">
        {debugInfo.credits} CRÉDITS
      </div>
    </div>
  );
}

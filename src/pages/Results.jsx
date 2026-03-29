import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  getCredits, 
  consumeCredits, 
  consumeTransform, 
  canTransform 
} from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

// --- COMPOSANT CÉLÉBRATION (DESIGN 9,5/10) ---
const Celebration = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 0] }}
    transition={{ duration: 2 }}
    className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-[#C9963A]/30 to-transparent" />
    {[...Array(25)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: 0, x: 0, opacity: 1, scale: 0 }}
        animate={{ 
          y: (Math.random() - 0.5) * 800, 
          x: (Math.random() - 0.5) * 500, 
          opacity: 0,
          scale: Math.random() * 2 
        }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="absolute w-2 h-2 bg-[#E8B96A] rounded-full shadow-[0_0_12px_#C9963A]"
      />
    ))}
  </motion.div>
);

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  const [loadingId, setLoadingId] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Récupération des infos utilisateur
  const userName = localStorage.getItem("afrotresse_user_name") || "Reine";
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || "/avatar.png";

  // LOGIQUE DE FILTRAGE SYNCHRONISÉE AVEC BRAIDS_DB
  const [pages, setPages] = useState(() => {
    const filtered = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape));
    // Sécurité : si aucun style ne match, on affiche tout le catalogue par défaut
    const displayList = filtered.length > 0 ? filtered : BRAIDS_DB;
    return [{ styles: displayList.slice(0, 3) }];
  });

  const [pageIdx, setPageIdx] = useState(0);
  const currentStyles = pages[pageIdx]?.styles || [];

  const handleTryStyle = async (style) => {
    if (!canTransform()) {
      setErrorMsg("Crédits insuffisants pour l'essai virtuel.");
      return;
    }
    setLoadingId(style.id);
    try {
      // Simulation d'appel API FAL AI
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Ici, on simule un résultat. En production, utilisez votre endpoint Fal.ai
      setResultImage("/styles/result-preview.jpg"); 
      consumeTransform();
      setCredits(getCredits());
    } catch (e) {
      setErrorMsg("Erreur lors de la génération. Réessaie !");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-5 pb-32 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/10"
      >
        <div className="relative">
          <img src={selfieUrl} className="w-14 h-14 rounded-xl border-2 border-[#C9963A] object-cover" alt="Profil" />
          <div className="absolute -bottom-1 -right-1 bg-[#C9963A] text-[#2C1A0E] text-[8px] font-bold px-1 rounded">MOI</div>
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#C9963A]">Tes Tresses Idéales</h1>
          <p className="text-[10px] opacity-60 uppercase tracking-widest">Morphologie : {faceShape}</p>
        </div>
      </motion.header>

      {/* RÉSULTAT IA */}
      <AnimatePresence>
        {resultImage && (
          <>
            <Celebration />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="mb-10 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-2xl"
            >
              <div className="p-4 flex justify-between items-center border-b border-white/5">
                <span className="text-[#C9963A] font-bold text-sm">Rendu Virtuel 👑</span>
                <button onClick={() => setResultImage(null)} className="text-xs opacity-50 italic">Fermer</button>
              </div>
              <img src={resultImage} alt="Transformation" className="w-full h-auto" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CARTES DE STYLES */}
      <div className="space-y-8">
        {currentStyles.map((style) => (
          <motion.div 
            key={style.id}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden shadow-xl"
          >
            {/* GRILLE D'IMAGES (Vues Face, Dos, Dessus) */}
            <div className="grid grid-cols-3 gap-1 h-60">
              <img 
                src={style.views.face} 
                className="col-span-2 w-full h-full object-cover" 
                alt={style.name}
                onClick={() => setZoomImage(style.views.face)}
              />
              <div className="grid grid-rows-2 gap-1">
                <img src={style.views.back} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.back)} />
                <img src={style.views.top} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.top)} />
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold">{style.name}</h3>
                <span className="text-[10px] text-[#C9963A] font-bold px-2 py-1 bg-[#C9963A]/10 rounded-lg">
                  Score: {style.matchScore}%
                </span>
              </div>
              <p className="text-xs opacity-70 mb-6 leading-relaxed">{style.description}</p>
              
              <button
                onClick={() => handleTryStyle(style)}
                disabled={loadingId === style.id}
                className="w-full py-4 rounded-2xl font-black transition-all active:scale-95 shadow-lg"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#2C1A0E" }}
              >
                {loadingId === style.id ? "ANALYSE EN COURS..." : "ESSAYER SUR MOI ✨"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* BOUTON DE CRÉDITS FLOTTANT */}
      <div className="fixed bottom-28 right-6 flex flex-col items-center">
        <div className="bg-[#C9963A] text-[#2C1A0E] px-4 py-2 rounded-2xl font-black shadow-2xl border-2 border-white/20">
          {credits} <span className="text-[10px]">PTS</span>
        </div>
      </div>

      {/* ZOOM LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-md"
            onClick={() => setZoomImage(null)}
          >
            <img src={zoomImage} className="max-w-full max-h-[70vh] rounded-3xl border border-[#C9963A]" alt="Zoom" />
            <p className="mt-6 text-xs opacity-50 uppercase tracking-widest">Appuie pour fermer</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

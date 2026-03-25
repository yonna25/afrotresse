import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, PRICING, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

// Utilisation de textes normaux - React gère l'UTF-8 nativement si le fichier est bien enregistré en UTF-8
const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume sur les côtés adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Coeur. Les tresses avec du volume en bas équilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses latérales créent l'harmonie parfaite pour toi.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment naturellement.",
}

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  const [downloadCount, setDownloadCount] = useState(0);

  // Correction : On récupère la photo depuis sessionStorage ou localStorage selon ton app
  const selfieUrl = sessionStorage.getItem('afrotresse_photo') || localStorage.getItem('afrotresse_selfie');
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";

  const handleDownload = (imageUrl) => {
    if (credits < 1 && downloadCount === 0) { navigate("/credits"); return; }
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `afrotresse-${Date.now()}.jpg`;
    link.click();

    const nextCount = downloadCount + 1;
    if (nextCount >= 3) {
      consumeCredits(1);
      setCredits(getCredits());
      setDownloadCount(0);
    } else {
      setDownloadCount(nextCount);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] flex flex-col md:flex-row overflow-x-hidden">
      
      <div className="flex-1 p-5 pb-24">
        
        {/* HEADER CORRIGÉ : Selfie + Titre sans codes bizarres */}
        <div className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2rem] border border-white/10 shadow-2xl">
          <div className="relative shrink-0">
            {selfieUrl ? (
              <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover shadow-lg" alt="Mon Selfie" />
            ) : (
              <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-center px-2">Photo absente</div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md shadow-lg uppercase">Moi</div>
          </div>
          
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-3xl text-[#C9963A]">Résultats</h1>
            <p className="text-[11px] opacity-80 font-body leading-tight mt-1 max-w-xs">
              {FACE_SHAPE_TEXTS[faceShape]}
            </p>
          </div>
        </div>

        {/* GRILLE DE STYLES */}
        <div className="space-y-12">
          {BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape)).map((style) => (
            <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl relative">
              
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40 relative">
                <div className="col-span-2 h-full overflow-hidden">
                  <img src={style.views.face} className="w-full h-full object-cover object-top" onClick={() => setZoomImage(style.views.face)} />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <img src={style.views.back} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.back)} />
                  <img src={style.views.top} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.top)} />
                </div>
                
                {/* Icône de téléchargement propre */}
                <button onClick={() => handleDownload(style.views.face)} className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 active:scale-90 transition-transform shadow-xl">
                  📥
                </button>
              </div>

              {/* STATS COMMUNAUTÉ PROPRES */}
              <div className="px-6 py-3 flex gap-5 text-[11px] font-bold uppercase tracking-wider text-[#C9963A]/90 bg-white/5">
                <span className="flex items-center gap-1.5 font-black">👁️ 2.4K VUES</span>
                <span className="flex items-center gap-1.5 font-black">❤️ 892 LIKES</span>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-display font-bold text-xl">{style.name}</h3>
                  <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2 py-0.5 rounded-md font-black uppercase">{style.duration}</span>
                </div>
                <p className="text-[11px] opacity-70 mb-6 font-body leading-relaxed">{style.description}</p>
                
                <button
                  className="w-full py-4 rounded-2xl font-display font-bold text-base shadow-xl active:scale-[0.97] transition-all"
                  style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
                >
                  Me transformer ✨
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BANDE DE CRÉDIT (Conservée) */}
      <div className="fixed bottom-0 left-0 right-0 md:relative md:w-24 z-50 bg-[#C9963A] md:h-screen shadow-2xl">
        <div className="flex md:flex-col items-center justify-between md:justify-center p-4 md:h-full gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase font-black text-[#2C1A0E]/60">Solde</span>
            <div className="text-2xl font-display font-black text-[#2C1A0E] leading-none">{credits}</div>
            <span className="text-[7px] font-bold text-[#2C1A0E]">Crédits</span>
          </div>
          <button onClick={() => navigate("/credits")} className="bg-[#2C1A0E] text-[#C9963A] text-[9px] px-4 py-2 rounded-xl font-black uppercase shadow-lg">+ Pack</button>
        </div>
      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setZoomImage(null)}
          >
            <img src={zoomImage} className="max-w-full max-h-[75vh] rounded-3xl shadow-2xl border border-white/20" />
            <button className="mt-10 px-10 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-full font-black shadow-2xl text-sm">Fermer</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

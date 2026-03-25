import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, PRICING, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure tr\u00e8s \u00e9quilibr\u00e9e qui s'adapte \u00e0 presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carr\u00e9e. Les tresses avec du volume sur les c\u00f4t\u00e9s adoucissent ta m\u00e2choire.",
  heart:   "Ton visage est en forme de Coeur. Les tresses avec du volume en bas \u00e9quilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses lat\u00e9rales cr\u00e9ent l'harmonie parfaite pour toi.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment naturellement.",
}

export default function Results() {
  const navigate = useNavigate();
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [zoomImage, setZoomImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  const [downloadCount, setDownloadCount] = useState(0); // Suivi pour 1 credit = 3 downloads

  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = localStorage.getItem("afrotresse_selfie");

  // Logique de sauvegarde/telechargement
  const handleDownload = (imageUrl) => {
    if (credits < 1 && downloadCount === 0) {
      navigate("/credits");
      return;
    }

    // Logique de telechargement reel ici (FileSaver ou simple a.click)
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `afrotresse-${Date.now()}.jpg`;
    link.click();

    // Gestion de la consommation : 1 credit tous les 3 downloads
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
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] flex flex-col md:flex-row">
      
      {/* SECTION PRINCIPALE */}
      <div className="flex-1 p-5 pb-24">
        
        {/* HEADER : Titre + Selfie + Analyse */}
        <div className="mb-10 flex flex-col md:flex-row gap-6 items-center md:items-start bg-white/5 p-6 rounded-3xl border border-white/10">
          {selfieUrl && (
            <img src={selfieUrl} className="w-24 h-24 rounded-full border-2 border-[#C9963A] object-cover shadow-lg" alt="Selfie" />
          )}
          <div>
            <h1 className="font-display font-bold text-3xl mb-2 text-[#C9963A]">R\u00e9sultats</h1>
            <p className="text-sm opacity-90 font-body leading-relaxed max-w-xl">
              {FACE_SHAPE_TEXTS[faceShape]}
            </p>
          </div>
        </div>

        {/* GRILLE DE STYLES */}
        <div className="space-y-10">
          {BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape)).map((style, idx) => (
            <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
              
              {/* Grille 3 photos avec Bouton Save */}
              <div className="grid grid-cols-3 gap-0.5 h-72 relative bg-black/20">
                <div className="col-span-2 h-full overflow-hidden">
                  <img src={style.views.face} className="w-full h-full object-cover object-top" onClick={() => setZoomImage(style.views.face)} />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <img src={style.views.back} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.back)} />
                  <img src={style.views.top} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.top)} />
                </div>
                
                {/* Bouton de sauvegarde rapide (Affiche le coût de 1/3 credit) */}
                <button 
                  onClick={() => handleDownload(style.views.face)}
                  className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 active:scale-90 transition-transform"
                >
                  \ud83d\udce5
                </button>
              </div>

              {/* BARRE DE STATS (Likes / Vues) */}
              <div className="px-6 py-3 flex gap-4 text-[11px] font-bold uppercase tracking-widest text-[#C9963A]/80 border-b border-white/5">
                <span className="flex items-center gap-1.5">\ud83d\udc41 1.2k vues</span>
                <span className="flex items-center gap-1.5">\u2764\ufe0f 458 likes</span>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-display font-bold text-xl">{style.name}</h3>
                  <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-3 py-1 rounded-full font-bold">
                    {style.duration}
                  </span>
                </div>
                <p className="text-xs opacity-70 mb-6 font-body line-clamp-2">{style.description}</p>
                
                <button
                  onClick={() => {/* Logique Generation */}}
                  className="w-full py-4 rounded-2xl font-display font-bold text-base shadow-lg active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
                >
                  Essayer virtuellement \u2728
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BANDE DE CREDIT (Flottante sur mobile, Bande a droite sur Desktop) */}
      <div className="fixed bottom-6 right-6 md:relative md:bottom-auto md:right-auto md:w-64 z-40">
        <div className="bg-[#C9963A] text-[#2C1A0E] p-4 md:p-6 rounded-3xl md:rounded-none md:h-full shadow-2xl flex flex-col items-center justify-center border-2 border-[#2C1A0E]/20 md:border-none">
          <span className="text-[10px] uppercase font-bold tracking-tighter opacity-80">Ton Solde</span>
          <div className="text-3xl font-display font-black">{credits}</div>
          <span className="text-[9px] font-bold">CR\u00c9DITS</span>
          
          {downloadCount > 0 && (
            <div className="mt-2 text-[10px] font-bold bg-black/10 px-2 py-1 rounded-lg">
              Save: {downloadCount}/3
            </div>
          )}
          
          <button onClick={() => navigate("/credits")} className="mt-4 bg-[#2C1A0E] text-white text-[10px] px-4 py-2 rounded-full font-bold uppercase">
            Recharger
          </button>
        </div>
      </div>

      {/* LIGHTBOX ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6"
            onClick={() => setZoomImage(null)}
          >
            <img src={zoomImage} className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border border-white/10" />
            <div className="mt-8 flex gap-4">
              <button onClick={() => handleDownload(zoomImage)} className="px-8 py-3 bg-[#C9963A] text-[#2C1A0E] rounded-full font-bold shadow-xl">
                Sauvegarder (1/3 cr\u00e9dit)
              </button>
              <button className="px-8 py-3 bg-white/10 text-white rounded-full font-bold backdrop-blur-md">Fermer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

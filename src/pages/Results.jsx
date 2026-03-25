import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
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
  const [zoomImage, setZoomImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  const [saveCount, setSaveCount] = useState(0);

  // UX : Récupération du prénom de l'utilisatrice
  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem('afrotresse_photo') || localStorage.getItem('afrotresse_selfie');

  // Logique : Strictement 3 styles par analyse
  const currentResults = useMemo(() => {
    const seenIds = getSeenStyleIds();
    const available = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape));
    const sorted = [...available].sort((a, b) => {
      const aSeen = seenIds.includes(a.id) ? 1 : 0;
      const bSeen = seenIds.includes(b.id) ? 1 : 0;
      return aSeen - bSeen || 0.5 - Math.random();
    });
    return sorted.slice(0, 3);
  }, [faceShape]);

  // Logique : Sauvegarde (1 crédit = 3 images)
  const handleSave = (imageUrl) => {
    if (credits < 1 && saveCount === 0) { navigate("/credits"); return; }
    const link = document.createElement('a'); link.href = imageUrl; link.download = `afrotresse-${Date.now()}.jpg`; link.click();
    const nextCount = saveCount + 1;
    if (nextCount >= 3) { consumeCredits(1); setCredits(getCredits()); setSaveCount(0); } else { setSaveCount(nextCount); }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-5 pb-36 overflow-x-hidden relative">
      
      {/* HEADER OPTIMISÉ VISUELLEMENT : Selfie + Prénom + Analyse */}
      <div className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2rem] border border-white/10 shadow-2xl relative">
        <div className="relative shrink-0">
          {selfieUrl ? (
            <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px]">Photo</div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md shadow-lg uppercase">Moi</div>
        </div>
        
        <div className="flex flex-col flex-1">
          {/* CORRECTION HEADER : UTF-8 pur, Nom sur deux lignes */}
          <h1 className="font-display font-bold text-3xl text-[#C9963A]">
            Tes r\u00e9sultats
            <br/>
            <span className="text-[#FAF4EC]">{userName} \u2728</span>
          </h1>
          <p className="text-[11px] opacity-80 font-body leading-tight mt-1 max-w-xs italic">
            {FACE_SHAPE_TEXTS[faceShape]}
          </p>
        </div>
      </div>

      {/* LISTE DES 3 STYLES */}
      <div className="space-y-10">
        {currentResults.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl relative">
            <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40 relative">
              <div className="col-span-2 h-full overflow-hidden">
                <img src={style.views.face} className="w-full h-full object-cover object-top" onClick={() => setZoomImage(style.views.face)} />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                <img src={style.views.back} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.back)} />
                <img src={style.views.top} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views.top)} />
              </div>
              {/* Bouton Save individuel */}
              <button onClick={() => handleDownload(style.views.face)} className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 active:scale-90 transition-transform text-lg shadow-xl">
                  📥
              </button>
            </div>
            
            <div className="px-6 py-3 flex gap-5 text-[10px] font-bold uppercase tracking-wider text-[#C9963A]/90 bg-white/5 border-b border-white/5">
              <span>👁️ 2.4K VUES</span> <span>❤️ 892 LIKES</span>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-display font-bold text-xl">{style.name}</h3>
                <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2 py-1 rounded-md font-black uppercase">{style.duration}</span>
              </div>
              <p className="text-[11px] opacity-70 mb-6 font-body leading-relaxed">{style.description}</p>
              <button
                onClick={() => navigate('/camera')}
                className="w-full py-4 rounded-2xl font-display font-bold text-base shadow-xl active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
              >
                Essayer ce style virtuellement ✨
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* STICKER CRÉDIT : Descendu légèrement (Point 1.1) */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={() => navigate("/credits")}
        className="fixed bottom-28 right-4 z-40 bg-[#C9963A] text-[#2C1A0E] w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-[#2C1A0E]/20 active:scale-95 transition-all"
      >
        <div className="text-[8px] font-black uppercase opacity-60 tracking-wider">Solde</div>
        <div className="text-3xl font-display font-black leading-none">{credits}</div>
        <div className="text-[7px] font-bold tracking-tight">CR\u00c9DITS</div>
        
        {saveCount > 0 && (
          <div className="absolute -bottom-2 -left-2 bg-[#2C1A0E] text-[#C9963A] text-[8px] font-black px-1.5 py-0.5 rounded-md border border-[#C9963A]/20">
            Save: {saveCount}/3
          </div>
        )}
      </motion.div>

      {/* LIGHTBOX ZOOM (InclAngée) */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setZoomImage(null)}
          >
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={zoomImage} className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/10 object-contain" onClick={(e) => e.stopPropagation()} />
            <div className="mt-10 flex gap-4 w-full max-w-xs">
              <button onClick={(e) => { e.stopPropagation(); handleSave(zoomImage); }} className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl flex items-center justify-center gap-2">📥 Sauvegarder</button>
              <button onClick={() => setZoomImage(null)} className="px-6 py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10">✕</button>
            </div>
            <p className="text-[10px] text-white/40 mt-4 uppercase font-bold tracking-widest">3 saves = 1 cr\u00e9dit</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

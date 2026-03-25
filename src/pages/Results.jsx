import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

// ✅ CORRECTION 1: Accents UTF-8 corrigés (pas d'échappement Unicode)
const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Coeur. Les tresses avec du volume en bas équilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses latérales créent l'harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
}

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  const [saveCount, setSaveCount] = useState(0);
  const [loadingStyleId, setLoadingStyleId] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [generatedImageId, setGeneratedImageId] = useState(null);

  // UX : Prénom de l'utilisatrice
  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem('afrotresse_photo') || localStorage.getItem('afrotresse_selfie');

  // ✅ CORRECTION 2: Ajouter structure views à chaque style
  const currentResults = useMemo(() => {
    const seenIds = getSeenStyleIds();
    const available = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape)).map(style => ({
      ...style,
      views: {
        face: `/styles/${style.localImage.replace('.jpg', '')}-face.jpg`,
        back: `/styles/${style.localImage.replace('.jpg', '')}-back.jpg`,
        top: `/styles/${style.localImage}`,
      }
    }));
    const sorted = [...available].sort((a, b) => (seenIds.includes(a.id) ? 1 : -1) || 0.5 - Math.random());
    return sorted.slice(0, 3);
  }, [faceShape]);

  const handleSave = (imageUrl) => {
    if (credits < 1 && saveCount === 0) { navigate("/credits"); return; }
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `afrotresse-${Date.now()}.jpg`;
    link.click();
    const nextCount = saveCount + 1;
    if (nextCount >= 3) {
      consumeCredits(1);
      setCredits(getCredits());
      setSaveCount(0);
    } else {
      setSaveCount(nextCount);
    }
  };

  // ✅ CORRECTION 3: Fonction pour déclencher Fal.ai
  const handleTryStyle = async (style) => {
    setLoadingStyleId(style.id);

    try {
      const selfieBase64 = selfieUrl?.split(",")[1] || null;
      const selfieType = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";

      if (!selfieBase64) {
        alert("Prends d'abord une photo!");
        setLoadingStyleId(null);
        return;
      }

      const styleImageUrl = `${window.location.origin}${style.views.top}`;

      console.log("🎨 Appel Fal.ai avec:");
      console.log("  - Style:", style.name);
      console.log("  - Image référence:", styleImageUrl);

      // Appeler Fal.ai
      const response = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieBase64,
          selfieType,
          styleImageUrl,
          faceShape,
          styleId: style.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erreur Fal.ai:", data);
        alert("Erreur: " + (data.error || "Impossible de générer l'image"));
        setLoadingStyleId(null);
        return;
      }

      console.log("✅ Image générée:", data.imageUrl);
      setGeneratedImage(data.imageUrl);
      setGeneratedImageId(style.id);
      addSeenStyleId(style.id);

    } catch (error) {
      console.error("Erreur lors de l'appel Fal.ai:", error);
      alert("Une erreur s'est produite. Réessaie!");
    } finally {
      setLoadingStyleId(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 overflow-x-hidden relative">
      
      {/* HEADER : Selfie + Prénom + Analyse */}
      <div className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
        <div className="relative shrink-0">
          {selfieUrl ? (
            <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px]">Photo</div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md shadow-lg uppercase">Moi</div>
        </div>
        
        <div className="flex flex-col flex-1">
          <h1 className="font-display font-bold text-3xl text-[#C9963A]">
            Tes résultats
            <br/>
            <span className="text-[#FAF4EC] font-black">{userName} ✨</span>
          </h1>
          <p className="text-[11px] opacity-80 font-body leading-tight mt-1 max-w-xs italic">
            {FACE_SHAPE_TEXTS[faceShape]}
          </p>
        </div>
      </div>

      {/* IMAGE GÉNÉRÉE PAR FAL.AI */}
      {generatedImage && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="mb-8 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-2xl"
        >
          <img src={generatedImage} className="w-full h-auto" alt="Résultat Fal.ai" />
          <div className="p-6 flex gap-4">
            <button 
              onClick={() => handleSave(generatedImage)}
              className="flex-1 py-3 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl"
            >
              📥 Sauvegarder
            </button>
            <button 
              onClick={() => setGeneratedImage(null)}
              className="px-6 py-3 bg-white/10 text-white rounded-2xl font-bold"
            >
              ✕ Fermer
            </button>
          </div>
        </motion.div>
      )}

      {/* LISTE DES STYLES (Grid 3 photos) */}
      <div className="space-y-12">
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
            </div>
            
            {/* Barre Sociale */}
            <div className="px-6 py-3 flex gap-5 text-[10px] font-black uppercase tracking-widest text-[#C9963A]/80 border-b border-white/5">
              <span>👁️ 2.4K vues</span> <span>❤️ 892 likes</span>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-display font-bold text-xl leading-none">{style.name}</h3>
                <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-md font-black uppercase">{style.duration}</span>
              </div>
              <p className="text-[11px] opacity-70 mb-6 font-body leading-relaxed">{style.description}</p>
              
              {/* ✅ CORRECTION 3: Bouton appelle handleTryStyle au lieu de navigate */}
              <button
                onClick={() => handleTryStyle(style)}
                disabled={loadingStyleId === style.id}
                className="w-full py-4 rounded-2xl font-display font-bold text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait"
                style={{ background: 'linear-gradient(135deg,#C9963A,#E8B96A)', color: '#2C1A0E' }}
              >
                {loadingStyleId === style.id ? "⏳ Génération..." : "Essayer virtuellement ce style ✨"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton Crédits flottant */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={() => navigate("/credits")}
        className="fixed bottom-28 right-5 z-40 bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-[#2C1A0E]/20 active:scale-95 transition-all"
      >
        <div className="text-[7px] font-black uppercase opacity-60">Solde</div>
        <div className="text-3xl font-display font-black leading-none">{credits}</div>
        <div className="text-[7px] font-bold tracking-tight">CRÉDITS</div>
        
        {saveCount > 0 && (
          <div className="absolute -top-2 -left-2 bg-[#2C1A0E] text-[#C9963A] text-[8px] font-black px-1.5 py-0.5 rounded-md border border-[#C9963A]/20">
            {saveCount}/3
          </div>
        )}
      </motion.div>

      {/* LIGHTBOX ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setZoomImage(null)}
          >
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={zoomImage} className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/10 object-contain" onClick={(e) => e.stopPropagation()} />
            <div className="mt-10 flex gap-4 w-full max-w-xs">
              <button onClick={(e) => { e.stopPropagation(); handleSave(zoomImage); }} className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl flex items-center justify-center gap-2">📥 Sauvegarder</button>
              <button onClick={() => setZoomImage(null)} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10">✕</button>
            </div>
            <p className="text-[10px] text-white/40 mt-4 uppercase font-bold tracking-widest">3 saves = 1 crédit</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

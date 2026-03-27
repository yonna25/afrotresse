import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';
import { getCredits, consumeCredits, consumeTransform, canTransform, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";
import { addShare } from "../services/stats.js";

// Initialisation de Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Cœur. Les tresses avec du volume en bas équilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses latérales créent l'harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
}

const RESULT_MSGS = [
  "Waouh 😍, tu es splendide !",
  "Regarde cette Reine ! ✨",
  "Le style parfait pour toi. 👑",
]

const PAGE_SIZE = 3;

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage]     = useState(null);
  const [credits, setCredits]         = useState(getCredits());
  const [saveCount, setSaveCount]     = useState(0);
  const [loadingId, setLoadingId]     = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultMsg, setResultMsg]     = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const resultRef                     = useRef(null);
  const errorRef                      = useRef(null);
  
  // État pour forcer le rafraîchissement des recommandations
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const userName  = localStorage.getItem("afrotresse_user_name") || "Reine";
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_selfie");

  // --- LOGIQUE D'UNICITÉ : EXCLURE LES STYLES DÉJÀ VUS ---
  const allResults = useMemo(() => {
    const seenIds = getSeenStyleIds();
    const available = BRAIDS_DB.filter(s => 
      s.faceShapes.includes(faceShape) && !seenIds.includes(s.id)
    );
    // On mélange pour avoir de la nouveauté à chaque clic
    return [...available].sort(() => 0.5 - Math.random());
  }, [faceShape, refreshTrigger]);

  const currentResults = allResults.slice(0, PAGE_SIZE);

  // --- ACTION : GÉNÉRER 3 NOUVEAUX STYLES (1 CRÉDIT) ---
  const handleGetNewStyles = useCallback(() => {
    if (credits < 1) {
      navigate("/credits");
      return;
    }

    if (allResults.length <= PAGE_SIZE) {
        setErrorMsg("Tu as exploré tous les styles disponibles pour ton visage !");
        return;
    }

    // Consommation du crédit
    consumeCredits(1);
    setCredits(getCredits());
    setErrorMsg("");

    // On marque les styles actuels comme vus pour ne plus les revoir
    currentResults.forEach(style => addSeenStyleId(style.id));

    // On déclenche le nouveau tirage via le refreshTrigger
    setRefreshTrigger(prev => prev + 1);
    
    // Retour en haut de la liste pour voir les nouveaux styles
    window.scrollTo({ top: 0, behavior: "smooth" });

  }, [credits, navigate, allResults.length, currentResults]);

  const handleSave = (imageUrl) => {
    if (credits < 1 && saveCount === 0) { navigate("/credits"); return; }
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "afrotresse-" + Date.now() + ".jpg";
    link.click();
    const next = saveCount + 1;
    if (next >= 3) { consumeCredits(1); setCredits(getCredits()); setSaveCount(0); }
    else setSaveCount(next);
  };

  const handleTryStyle = async (style) => {
    if (!canTransform()) { navigate("/credits"); return; }
    setErrorMsg("");
    setResultImage(null);
    setLoadingId(style.id);
    try {
      const blob = await fetch(selfieUrl).then(r => r.blob());
      const fileName = `selfie-${Date.now()}.jpg`;
      const { error: upError } = await supabase.storage.from('selfies').upload(fileName, blob);
      if (upError) throw new Error("Échec de l'upload du selfie.");
      const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);
      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieUrl: publicUrl, stylePath: "/styles/" + (style.localImage || style.image) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "La génération a échoué.");
      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 400);
    } catch (err) {
      setErrorMsg(err.message);
    } finally { setLoadingId(null); }
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 overflow-x-hidden relative">
      
      {/* BOUTON GÉNÉRER NOUVEAUX STYLES (FIXED UX) */}
      <div className="fixed top-24 left-0 right-0 z-[60] flex justify-center pointer-events-none">
        <motion.button 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          onClick={handleGetNewStyles}
          className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#C9963A]/50 bg-[#2C1A0E]/90 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] active:scale-95 transition-all"
        >
          <span className="text-base">✨</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black text-[#C9963A] uppercase tracking-widest">
              3 autres styles
            </span>
            <span className="text-[8px] opacity-60 font-bold mt-1">1 crédit</span>
          </div>
          <div className="bg-[#C9963A] text-[#2C1A0E] text-[9px] font-black h-5 w-5 flex items-center justify-center rounded-full ml-1">
            -1
          </div>
        </motion.button>
      </div>

      {/* HEADER */}
      <div className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-2xl relative">
        <div className="relative shrink-0">
          <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md shadow-lg">MOI</div>
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-display font-bold text-2xl text-[#C9963A]">Résultats pour <span className="text-[#FAF4EC]">{userName}</span></h1>
          <p className="text-[10px] opacity-70 italic leading-tight">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {/* ERREUR */}
      {errorMsg && (
        <div className="mb-4 bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm">{errorMsg}</div>
      )}

      {/* RÉSULTAT IA */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-8 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-2xl">
            <div className="p-5">
              <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg}</h3>
              <p className="text-[11px] mt-1 opacity-70 font-body">Sublime ! Partage ce style avec ta coiffeuse.</p>
            </div>
            <img src={resultImage} alt="Résultat" className="w-full object-cover"/>
            <div className="p-5 space-y-2">
              <button onClick={() => addShare("Style AfroTresse", resultImage)} className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E]">Envoyer à ma coiffeuse</button>
              <button onClick={() => setResultImage(null)} className="w-full py-3 rounded-2xl text-sm font-semibold bg-white/10">Fermer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE DES STYLES */}
      <div className="space-y-12">
        {currentResults.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl relative">
            <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
              <div className="col-span-2 h-full overflow-hidden">
                <img src={style.views?.face || "/styles/" + (style.localImage || style.image)} className="w-full h-full object-cover object-top cursor-pointer" onClick={() => setZoomImage(style.views?.face || "/styles/" + (style.localImage || style.image))} alt={style.name} />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                <img src={style.views?.back || "/styles/" + (style.localImage || style.image)} className="w-full h-full object-cover cursor-pointer" onClick={() => setZoomImage(style.views?.back || "/styles/" + (style.localImage || style.image))} />
                <img src={style.views?.top || "/styles/" + (style.localImage || style.image)} className="w-full h-full object-cover cursor-pointer" onClick={() => setZoomImage(style.views?.top || "/styles/" + (style.localImage || style.image))} />
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-display font-bold text-xl leading-none">{style.name}</h3>
                <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-md font-black uppercase">{style.duration}</span>
              </div>
              <p className="text-[11px] opacity-70 mb-6 font-body leading-relaxed">{style.description}</p>
              <button onClick={() => handleTryStyle(style)} disabled={loadingId === style.id} className="w-full py-4 rounded-2xl font-display font-bold text-base shadow-xl bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E] disabled:opacity-50">
                {loadingId === style.id ? "Génération... ⏳" : "Essayer virtuellement ✨"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOUTON CRÉDITS FLOTTANT */}
      <motion.div onClick={() => navigate("/credits")} className="fixed bottom-28 right-5 z-40 bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-[#2C1A0E]/20 active:scale-95 transition-all">
        <div className="text-[7px] font-black uppercase opacity-60">Solde</div>
        <div className="text-3xl font-display font-black leading-none">{credits}</div>
        <div className="text-[7px] font-bold tracking-tight">CRÉDITS</div>
      </motion.div>

      {/* LIGHTBOX ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl" onClick={() => setZoomImage(null)}>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={zoomImage} className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/10 object-contain" />
            <div className="mt-10 flex gap-4 w-full max-w-xs">
              <button onClick={(e) => { e.stopPropagation(); handleSave(zoomImage); }} className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl">📥 Sauvegarder</button>
              <button onClick={() => setZoomImage(null)} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

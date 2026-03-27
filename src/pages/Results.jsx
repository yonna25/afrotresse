import { useState, useEffect, useRef, useMemo } from "react";
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

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage]     = useState(null);
  const [credits, setCredits]         = useState(getCredits());
  const [saveCount, setSaveCount]     = useState(0);
  const [loadingId, setLoadingId]     = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultStyleId, setResultStyleId] = useState(null);
  const [resultMsg, setResultMsg]     = useState("");
  const [isFallback, setIsFallback]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");
  const resultRef                     = useRef(null);

  const userName  = localStorage.getItem("afrotresse_user_name") || "Reine";
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_selfie");

  const currentResults = useMemo(() => {
    const seenIds  = getSeenStyleIds();
    const available = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape));
    const sorted   = [...available].sort((a, b) => (seenIds.includes(a.id) ? 1 : -1) || 0.5 - Math.random());
    return sorted.slice(0, 3);
  }, [faceShape]);

  const handleSave = (imageUrl) => {
    if (credits < 1 && saveCount === 0) { 
      navigate("/credits");
      return; 
    }
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "afrotresse-" + Date.now() + ".jpg";
    link.click();

    const next = saveCount + 1;
    if (next >= 3) { 
      consumeCredits(1); 
      setCredits(getCredits()); 
      setSaveCount(0); 
    }
    else setSaveCount(next);
  };

  const handleTryStyle = async (style) => {
    if (!canTransform()) { 
      navigate("/credits"); 
      return; 
    }

    setErrorMsg("");
    setResultImage(null);
    setLoadingId(style.id);

    try {
      // 1. Préparation du fichier selfie (Blob)
      const blob = await fetch(selfieUrl).then(r => r.blob());
      const fileName = `selfie-${Date.now()}.jpg`;

      // 2. Upload vers Supabase pour obtenir une URL publique
      const { data: upData, error: upError } = await supabase.storage
        .from('selfies')
        .upload(fileName, blob);

      if (upError) throw new Error("Échec de l'upload du selfie vers le serveur.");

      const { data: { publicUrl: selfiePublicUrl } } = supabase.storage
        .from('selfies')
        .getPublicUrl(fileName);

      // 3. Appel de l'API de génération (Backend Replicate)
      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieUrl: selfiePublicUrl,
          stylePath: "/styles/" + (style.localImage || style.image)
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "La génération a échoué.");
      }

      // 4. Succès et mise à jour de l'interface
      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultStyleId(style.id);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Connexion impossible. Réessaie.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleShare = async (text, url) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "AfroTresse", text, url: url || window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Lien copié !");
      }
    } catch {}
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 overflow-x-hidden relative">
      
      {/* HEADER */}
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
            Tes résultats<br/>
            <span className="text-[#FAF4EC] font-black">{userName} ✨</span>
          </h1>
          <p className="text-[11px] opacity-80 font-body leading-tight mt-1 max-w-xs italic">
            {FACE_SHAPE_TEXTS[faceShape]}
          </p>
        </div>
      </div>

      {/* ERREUR */}
      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-900/30 border border-red-500/50 rounded-xl p-3">
          <p className="text-red-200 text-sm">{errorMsg}</p>
        </motion.div>
      )}

      {/* RÉSULTAT IA */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-6 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-2xl">
            <div className="p-5">
              <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg || "Magnifique !"}</h3>
              <p className="text-[11px] mt-1 opacity-70">Ce style te met vraiment en valeur. Montre-le à ta coiffeuse !</p>
            </div>
            <img src={resultImage} alt="Résultat" className="w-full object-cover"/>
            <div className="p-5 space-y-2">
              <button
                onClick={() => handleShare("Regarde le style que j'ai choisi avec AfroTresse !", resultImage)}
                className="w-full py-4 rounded-2xl font-bold text-base shadow-xl"
                style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}>
                Envoyer à ma coiffeuse
              </button>
              <button onClick={() => setResultImage(null)}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-white/10 text-white/70 border border-white/10">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE DES STYLES */}
      <div className="space-y-12">
        {currentResults.map((style) => (

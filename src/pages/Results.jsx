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
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée.",
  round:   "Ton visage est de forme Ronde. Les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent tes traits.",
  heart:   "Ton visage est en forme de Cœur. Le volume en bas équilibre ton visage.",
  long:    "Ton visage est de forme Longue. Les tresses latérales te vont à ravir.",
  diamond: "Ton visage est de forme Diamant. Les tresses encadrant le visage te subliment.",
}

const RESULT_MSGS = ["Waouh 😍 !", "Regarde cette Reine ! ✨", "Le style parfait ! 👑"];

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage]     = useState(null);
  const [credits, setCredits]         = useState(getCredits());
  const [loadingId, setLoadingId]     = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const resultRef                     = useRef(null);

  const userName  = localStorage.getItem("afrotresse_user_name") || "Reine";
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_selfie");

  const currentResults = useMemo(() => {
    const seenIds = getSeenStyleIds();
    const available = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape));
    return [...available].sort((a, b) => (seenIds.includes(a.id) ? 1 : -1)).slice(0, 3);
  }, [faceShape]);

  // Fonction pour garantir que le chemin de l'image est correct
  const getImageUrl = (imgName) => {
    if (!imgName) return "";
    if (imgName.startsWith('http') || imgName.startsWith('/styles/')) return imgName;
    return `/styles/${imgName}`;
  };

  const handleTryStyle = async (style) => {
    if (!canTransform()) { navigate("/credits"); return; }
    if (!selfieUrl) { setErrorMsg("Photo manquante."); return; }

    setErrorMsg("");
    setResultImage(null);
    setLoadingId(style.id);

    try {
      const blob = await fetch(selfieUrl).then(r => r.blob());
      const fileName = `selfie-${Date.now()}.jpg`;

      const { data: upData, error: upError } = await supabase.storage
        .from('selfies').upload(fileName, blob);

      if (upError) throw new Error("Erreur stockage photo.");

      const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);

      const stylePath = getImageUrl(style.localImage || style.image);

      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieUrl: publicUrl, stylePath }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur IA");

      setResultImage(data.imageUrl);
      consumeTransform();
      setCredits(getCredits());
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    } catch (err) {
      setErrorMsg(err.message || "Erreur de connexion.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-40">
      <div className="mb-10 flex items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10">
        <img src={selfieUrl} className="w-16 h-16 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
        <div className="ml-4">
          <h1 className="text-2xl font-bold text-[#C9963A]">{userName} ✨</h1>
          <p className="text-[10px] opacity-70">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {errorMsg && <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-xl text-red-200 text-xs">{errorMsg}</div>}

      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A]">
            <img src={resultImage} className="w-full" alt="Résultat" />
            <div className="p-4">
              <button onClick={() => setResultImage(null)} className="w-full py-3 bg-white/10 rounded-xl">Fermer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-10">
        {currentResults.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-white/5">
            <div className="h-64 overflow-hidden">
              <img src={getImageUrl(style.localImage || style.image)} className="w-full h-full object-cover" alt={style.name} />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">{style.name}</h3>
              <button onClick={() => handleTryStyle(style)} disabled={loadingId === style.id}
                className="w-full py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-bold disabled:opacity-50">
                {loadingId === style.id ? "Création... ⏳" : "Essayer ✨"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div onClick={() => navigate("/credits")} className="fixed bottom-28 right-5 bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-xl">
        <span className="text-[10px] font-bold">{credits}</span>
        <span className="text-[7px]">PTS</span>
      </div>
    </div>
  );
}

import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';
import { getCredits, consumeTransform, canTransform, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const FACE_SHAPE_TEXTS = {
  oval: "Ton visage est de forme Ovale. Une structure très équilibrée.",
  round: "Ton visage est de forme Ronde. Les tresses hautes sont parfaites.",
  square: "Ton visage est de forme Carrée. Le volume adoucit ta mâchoire.",
  heart: "Ton visage est en forme de Cœur. Le volume en bas équilibre ton visage.",
  long: "Ton visage est de forme Longue. Les tresses latérales te vont à ravir.",
  diamond: "Ton visage est de forme Diamant. Les tresses encadrant le visage te subliment.",
};

export default function Results() {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const resultRef = useRef(null);

  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_selfie");

  const currentResults = useMemo(() => {
    const seenIds = getSeenStyleIds ? getSeenStyleIds() : [];
    const available = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape));
    return [...available].sort((a, b) => (seenIds.includes(a.id) ? 1 : -1)).slice(0, 3);
  }, [faceShape]);

  const getImgPath = (img) => {
    if (!img) return "";
    const name = img.split('/').pop();
    return `/styles/${name}`;
  };

  const handleTryStyle = async (style) => {
    if (!canTransform()) return navigate("/credits");
    setLoadingId(style.id);
    setErrorMsg("");

    try {
      const blob = await fetch(selfieUrl).then(r => r.blob());
      const fileName = `selfie-${Date.now()}.jpg`;
      await supabase.storage.from('selfies').upload(fileName, blob);
      const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);

      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieUrl: publicUrl, stylePath: getImgPath(style.localImage || style.image) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur IA");

      consumeTransform();
      setResultImage(data.imageUrl);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err) {
      setErrorMsg("Erreur de génération. Réessaie.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-32">
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-5 rounded-[2.5rem] border border-white/10">
        <img src={selfieUrl} className="w-16 h-16 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#C9963A]">Analyse ✨</h1>
          <p className="text-[10px] opacity-70 leading-tight">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {errorMsg && <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-2xl text-red-200 text-xs text-center">{errorMsg}</div>}

      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-10 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-2xl">
            <img src={resultImage} className="w-full" alt="Résultat" />
            <div className="p-4"><button onClick={() => setResultImage(null)} className="w-full py-4 bg-white/10 rounded-2xl text-sm font-bold">Fermer</button></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {currentResults.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-xl">
            <img src={getImgPath(style.localImage || style.image)} className="w-full h-72 object-cover object-top" alt={style.name} onError={(e) => { e.target.src = "https://placehold.co/400x600?text=Image+Indisponible"; }} />
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold mb-4">{style.name}</h3>
              <button onClick={() => handleTryStyle(style)} disabled={loadingId === style.id} className="w-full py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-lg disabled:opacity-50">
                {loadingId === style.id ? "Création... ⏳" : "Essayer virtuellement ✨"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div onClick={() => navigate("/credits")} className="fixed bottom-10 right-5 bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-white/20 active:scale-95 transition-transform">
        <span className="text-[10px] font-bold">{getCredits()}</span>
        <span className="text-[7px]">PTS</span>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';
import { getCredits, consumeCredits, consumeTransform, canTransform, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export default function Results() {
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const resultRef = useRef(null);

  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_selfie");

  const currentResults = useMemo(() => {
    const available = BRAIDS_DB.filter(s => s.faceShapes.includes(faceShape));
    return available.slice(0, 3);
  }, [faceShape]);

  // FIX IMAGE : Cette fonction nettoie le chemin pour Vercel
  const getFixSrc = (img) => {
    if (!img) return "";
    const name = img.split('/').pop(); // Récupère juste "nom.jpg"
    return `/styles/${name}`;
  };

  const handleTryStyle = async (style) => {
    if (!canTransform()) return navigate("/credits");
    setLoadingId(style.id);
    try {
      const blob = await fetch(selfieUrl).then(r => r.blob());
      const fileName = `selfie-${Date.now()}.jpg`;
      await supabase.storage.from('selfies').upload(fileName, blob);
      const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);

      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieUrl: publicUrl, stylePath: getFixSrc(style.localImage || style.image) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultImage(data.imageUrl);
    } catch (err) { setErrorMsg("Erreur IA. Réessaie."); }
    finally { setLoadingId(null); }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-white p-4 pb-32">
      <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-3xl">
        <img src={selfieUrl} className="w-16 h-16 rounded-xl object-cover border-2 border-[#C9963A]" />
        <h1 className="text-xl font-bold text-[#C9963A]">Tes styles conseillés</h1>
      </div>

      <div className="space-y-8">
        {currentResults.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2rem] overflow-hidden border border-white/5 shadow-xl">
            <img 
              src={getFixSrc(style.localImage || style.image)} 
              className="w-full h-64 object-cover object-top" 
              alt={style.name}
              onError={(e) => { e.target.src = "https://placehold.co/400x600?text=Photo+en+cours..."; }}
            />
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{style.name}</h3>
              <button 
                onClick={() => handleTryStyle(style)}
                disabled={loadingId === style.id}
                className="w-full py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black">
                {loadingId === style.id ? "Génération... ⏳" : "Essayer ce style ✨"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

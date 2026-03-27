import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';
import { getCredits, consumeCredits, consumeTransform, canTransform, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";
import { addShare } from "../services/stats.js";

// Initialisation du client Supabase
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
    if (!canTransform()) { navigate("/credits"); return; }
    if (!selfieUrl) { setErrorMsg("Photo introuvable."); return; }

    setErrorMsg("");
    setResultImage(null);
    setLoadingId(style.id);

    try {
      const response = await fetch(selfieUrl);
      const blob = await response.blob();
      const fileName = `selfie-${Date.now()}.jpg`;

      const { data: upData, error: upError } = await supabase.storage
        .from('selfies')
        .upload(fileName, blob);

      if (upError) throw new Error("Erreur upload Supabase");

      const { data: { publicUrl: selfiePublicUrl } } = supabase.storage
        .from('selfies')
        .getPublicUrl(fileName);

      const imageFile = style.localImage || style.image;
      const cleanStylePath = imageFile.startsWith('/') ? imageFile : `/styles/${imageFile}`;

      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieUrl: selfiePublicUrl,
          stylePath: cleanStylePath
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "IA Error");

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      
      setTimeout(() => { resultRef.current?.scrollIntoView({ behavior: "smooth" }); }, 150);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Erreur de connexion.");
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

      {errorMsg && (
        <div className="mb-4 bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      {/* RÉSULTAT IA */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-6 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-2xl">
            <div className="p-5">
              <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg}</h3>
            </div>
            <img src={resultImage} alt="Résultat" className="w-full object-cover"/>
            <div className="p-5 space-y-2">
              <button onClick={() => handleShare("Mon style AfroTresse !", resultImage)}
                className="w-full py-4 rounded-2xl font-bold bg-[#C9963A] text-[#2C1A0E]">
                Envoyer à ma coiffeuse
              </button>
              <button onClick={() => setResultImage(null)} className="w-full py-3 text-white/50">Fermer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE DES STYLES */}
      <div className="space-y-12">
        {currentResults.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl relative">
            <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
              <div className="col-span-2">
                <img src={"/styles/" + (style.localImage || style.image)} className="w-full h-full object-cover object-top" alt={style.name} />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                <img src={"/styles/" + (style.localImage || style.image)} className="w-full h-full object-cover" alt="Vue 2" />
                <img src={"/styles/" + (style.localImage || style.image)} className="w-full h-full object-cover" alt="Vue 3" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display font-bold text-xl mb-1">{style.name}</h3>
              <p className="text-[11px] opacity-70 mb-6">{style.description}</p>
              <button onClick={() => handleTryStyle(style)} disabled={loadingId === style.id}
                className="w-full py-4 rounded-2xl font-bold bg-[#C9963A] text-[#2C1A0E] disabled:opacity-50">
                {loadingId === style.id ? "Génération... ⏳" : "Essayer virtuellement ✨"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOUTON CRÉDITS */}
      <div onClick={() => navigate("/credits")} className="fixed bottom-28 right-5 z-40 bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-white/20">
        <div className="text-[7px] font-black">SOLDE</div>
        <div className="text-2xl font-black">{credits}</div>
      </div>

      {/* ZOOM LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6" onClick={() => setZoomImage(null)}>
            <img src={zoomImage} className="max-w-full max-h-[75vh] rounded-3xl" alt="Zoom" />
            <button onClick={() => handleSave(zoomImage)} className="mt-6 py-4 px-10 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black">📥 Sauvegarder</button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

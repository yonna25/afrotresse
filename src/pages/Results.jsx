import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';
import { getCredits, consumeCredits, consumeTransform, canTransform, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";
import { addShare } from "../services/stats.js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FACE_SHAPE_TEXTS = {
  oval: "Ovale : Équilibré et polyvalent.",
  round: "Rond : Les tresses hautes affinent tes traits.",
  square: "Carré : Le volume adoucit la mâchoire.",
  heart: "Cœur : Le volume en bas équilibre le menton.",
  long: "Long : Les tresses latérales créent l'harmonie.",
  diamond: "Diamant : Les tresses encadrant le visage te subliment.",
}

const PAGE_SIZE = 3;

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage]     = useState(null);
  const [credits, setCredits]         = useState(getCredits());
  const [saveCount, setSaveCount]     = useState(0);
  const [loadingId, setLoadingId]     = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [page, setPage]               = useState(0); 
  
  const resultRef = useRef(null);

  const userName  = localStorage.getItem("afrotresse_user_name") || "Reine";
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_selfie");

  // --- LOGIQUE DE PAGINATION ET FILTRAGE ---

  // 1. Filtrer les styles par forme de visage
  const compatibleStyles = useMemo(() => {
    return (BRAIDS_DB || []).filter(s => s.faceShapes?.includes(faceShape));
  }, [faceShape]);

  // 2. Trier : Les styles déjà vus (payés) apparaissent dans l'ordre de la pagination, suivis des nouveaux
  const orderedResults = useMemo(() => {
    const seenIds = getSeenStyleIds() || [];
    const seen = compatibleStyles.filter(s => seenIds.includes(s.id));
    const unseen = compatibleStyles.filter(s => !seenIds.includes(s.id));
    return [...seen, ...unseen];
  }, [compatibleStyles, credits]);

  // 3. Calculer les styles de la page actuelle
  const currentResults = useMemo(() => {
    return orderedResults.slice(page * PAGE_SIZE, (page * PAGE_SIZE) + PAGE_SIZE);
  }, [orderedResults, page]);

  // 4. Vérifier l'état de la page suivante pour le bouton
  const nextPack = useMemo(() => {
    return orderedResults.slice((page + 1) * PAGE_SIZE, ((page + 1) * PAGE_SIZE) + PAGE_SIZE);
  }, [orderedResults, page]);

  const isNextAlreadyPaid = useMemo(() => {
    if (nextPack.length === 0) return false;
    const seenIds = getSeenStyleIds() || [];
    return nextPack.every(s => seenIds.includes(s.id));
  }, [nextPack]);

  // --- HANDLERS ---

  const handleNext = () => {
    if (isNextAlreadyPaid) {
      setPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (credits < 1) return navigate("/credits");
      
      // Paiement pour débloquer le pack suivant
      consumeCredits(1);
      setCredits(getCredits());
      nextPack.forEach(s => addSeenStyleId(s.id));
      
      setPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setPage(p => Math.max(0, p - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTryStyle = async (style) => {
    if (!canTransform()) return navigate("/credits");
    setLoadingId(style.id);
    setErrorMsg("");
    try {
      const blob = await fetch(selfieUrl).then(r => r.blob());
      const fileName = `trial-${Date.now()}.jpg`;
      await supabase.storage.from('selfies').upload(fileName, blob);
      const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);
      
      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfieUrl: publicUrl, stylePath: "/styles/" + (style.localImage || style.image) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();

      consumeTransform();
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 400);
    } catch (e) {
      setErrorMsg("Erreur lors de la génération.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-44 relative overflow-x-hidden">
      
      {/* HEADER */}
      <div className="mb-8 flex gap-4 items-center bg-white/5 p-4 rounded-[2rem] border border-white/10">
        <img src={selfieUrl} className="w-16 h-16 rounded-xl border-2 border-[#C9963A] object-cover" alt="Moi" />
        <div>
          <h1 className="font-display font-bold text-lg text-[#C9963A]">Bonjour {userName} ✨</h1>
          <p className="text-[10px] opacity-60 italic">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </div>

      {/* RÉSULTAT IA */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A]">
            <img src={resultImage} alt="Résultat" className="w-full"/>
            <div className="p-4 flex gap-2">
              <button onClick={() => addShare("Mon style", resultImage)} className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-bold">Partager</button>
              <button onClick={() => setResultImage(null)} className="px-6 py-4 bg-white/10 rounded-2xl">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE DES STYLES (3 PAR PAGE) */}
      <div className="space-y-10">
        {currentResults.map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-xl">
             <img src={"/styles/" + (style.localImage || style.image)} className="w-full h-64 object-cover object-top" alt={style.name} />
             <div className="p-6">
                <h3 className="font-display font-bold text-lg mb-4">{style.name}</h3>
                <button onClick={() => handleTryStyle(style)} disabled={loadingId !== null} className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E]">
                  {loadingId === style.id ? "Analyse en cours... ⏳" : "Essayer virtuellement ✨"}
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* BARRE DE NAVIGATION FIXE (PAGINATION) */}
      <div className="fixed bottom-6 left-4 right-4 z-[50] flex flex-col items-center gap-3">
        <div className="w-full max-w-md bg-[#3D2616]/95 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl flex items-center justify-between">
            
            {/* Précédent (Gratuit pour revoir les styles payés) */}
            <button 
                onClick={handlePrev}
                disabled={page === 0}
                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 disabled:opacity-10 text-[#C9963A]"
            >
                ←
            </button>

            {/* Indicateur Pack */}
            <div className="text-center">
                <p className="text-[8px] uppercase tracking-tighter opacity-50 font-bold">Pack</p>
                <p className="font-display font-black text-xl leading-none text-[#C9963A]">{page + 1}</p>
            </div>

            {/* Suivant ou Débloquer */}
            <button 
                onClick={handleNext}
                disabled={nextPack.length === 0}
                className={`px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                    isNextAlreadyPaid 
                    ? "bg-white/10 text-[#FAF4EC]" 
                    : "bg-[#C9963A] text-[#2C1A0E] shadow-[0_0_20px_rgba(201,150,58,0.3)]"
                }`}
            >
                {isNextAlreadyPaid ? "Suivant →" : "Débloquer +3 (1 crédit) ✨"}
            </button>
        </div>

        {/* Solde Flottant */}
        <div onClick={() => navigate("/credits")} className="bg-[#C9963A] text-[#2C1A0E] px-5 py-1.5 rounded-full text-[10px] font-black uppercase cursor-pointer shadow-lg active:scale-95 transition-transform">
            Solde : {credits} Crédits 🪙
        </div>
      </div>

      {errorMsg && <div className="fixed top-4 left-4 right-4 bg-red-600 text-white p-3 rounded-xl text-center text-xs z-[100] font-bold">{errorMsg}</div>}
    </div>
  );
}

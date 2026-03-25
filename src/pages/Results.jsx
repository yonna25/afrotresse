import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, consumeTransform, canTransform, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";
import { addShare } from "../services/stats.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Cœur. Les tresses avec du volume en bas équilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses latérales créent l'harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
};

const RESULT_MSGS = [
  "Waouh 😍, tu es splendide !",
  "Regarde cette Reine ! ✨",
  "Le style parfait pour toi. 👑",
];

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage]     = useState(null);
  const [credits, setCredits]         = useState(getCredits());
  const [saveCount, setSaveCount]     = useState(0);
  const [loadingId, setLoadingId]     = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultMsg, setResultMsg]     = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const waitingIntervalRef            = useRef(null);
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
    if (credits < 1 && saveCount === 0) { navigate("/credits"); return; }
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "afrotresse-" + Date.now() + ".jpg";
    link.click();
    const next = saveCount + 1;
    if (next >= 3) { consumeCredits(1); setCredits(getCredits()); setSaveCount(0); }
    else setSaveCount(next);
  };

  // ✅ FAL AI FIX
  const handleTryStyle = async (style) => {
    if (!canTransform()) { navigate("/credits"); return; }

    setErrorMsg("");
    setResultImage(null);
    setLoadingId(style.id);
    setResultMsg("");

    try {
      const selfieBase64  = selfieUrl?.split(",")[1] || null;
      const selfieType    = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";

      // ✅ UTILISE DIRECTEMENT L’IMAGE EXISTANTE
      const styleImageUrl = style.views?.back;

      if (!styleImageUrl) {
        setErrorMsg("Image de coiffure introuvable.");
        setLoadingId(null);
        return;
      }

      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieBase64,
          selfieType,
          styleImageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Erreur génération");
        return;
      }

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (err) {
      console.error(err);
      setErrorMsg("Connexion impossible. Réessaie.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 pb-40">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4">
        Tes résultats {userName} ✨
      </h1>

      {/* ERREUR */}
      {errorMsg && (
        <div className="mb-4 text-red-400">{errorMsg}</div>
      )}

      {/* RESULTAT */}
      {resultImage && (
        <div ref={resultRef} className="mb-6">
          <img src={resultImage} className="w-full rounded-xl"/>
          <p className="mt-2">{resultMsg}</p>
        </div>
      )}

      {/* STYLES */}
      {currentResults.map((style) => (
        <div key={style.id} className="mb-6">

          <img
            src={style.views?.back}
            className="w-full h-48 object-cover rounded-xl"
          />

          <h3 className="mt-2 font-bold">{style.name}</h3>

          <button
            onClick={() => handleTryStyle(style)}
            disabled={loadingId === style.id}
            className="mt-3 w-full py-3 bg-yellow-500 text-black rounded-xl"
          >
            {loadingId === style.id
              ? "Génération..."
              : "Essayer ce style"}
          </button>

        </div>
      ))}

    </div>
  );
}

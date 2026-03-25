import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, consumeTransform, canTransform, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";
import { addShare } from "../services/stats.js";

// Pas d'accents directs dans les strings JS — Unicode escapes
const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C\u2019est une structure tr\u00e8s \u00e9quilibr\u00e9e qui s\u2019adapte \u00e0 presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carr\u00e9e. Les tresses avec du volume adoucissent ta m\u00e2choire.",
  heart:   "Ton visage est en forme de C\u0153ur. Les tresses avec du volume en bas \u00e9quilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses lat\u00e9rales cr\u00e9ent l\u2019harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
}

const RESULT_MSGS = [
  "Waouh \uD83D\uDE0D, tu es splendide !",
  "Regarde cette Reine ! \u2728",
  "Le style parfait pour toi. \uD83D\uDC51",
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

  // Sauvegarde image (1 cr\u00e9dit = 3 saves)
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

  // Transformation Fal.ai
  const handleTryStyle = async (style) => {
    if (!canTransform()) { navigate("/credits"); return; }

    setErrorMsg("");
    setResultImage(null);
    setResultStyleId(null);
    setIsFallback(false);
    setLoadingId(style.id);
    setResultMsg("");

    waitingIntervalRef.current = setInterval(() => {}, 3000);

    try {
      const selfieBase64  = selfieUrl?.split(",")[1] || null;
      const selfieType    = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";

      // Construire l'URL de l'image de r\u00e9f\u00e9rence du style
      let styleImageUrl;
      if (style.localImage) {
        styleImageUrl = window.location.origin + "/styles/" + style.localImage;
      } else if (style.image) {
        styleImageUrl = style.image.startsWith("http")
          ? style.image
          : window.location.origin + style.image;
      } else {
        setErrorMsg("Image de coiffure introuvable.");
        clearInterval(waitingIntervalRef.current);
        setLoadingId(null);
        return;
      }

      const res  = await fetch("/api/falGenerate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          selfieBase64,
          selfieType,
          styleImageUrl,
          faceShape,
          styleId: style.id,
          type: "transform",
        }),
      });

      const data = await res.json();
      if (res.status === 429) { setErrorMsg(data.error || "Attends quelques secondes."); return; }

      clearInterval(waitingIntervalRef.current);
      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultStyleId(style.id);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      setIsFallback(data.fallback || false);

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

    } catch (err) {
      clearInterval(waitingIntervalRef.current);
      console.error(err);
      setErrorMsg("Connexion impossible. Reessaie.");
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
        alert("Lien copi\u00e9 !");
      }
    } catch {}
  };

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 overflow-x-hidden relative">

      {/* HEADER : Selfie + Pr\u00e9nom + Analyse */}
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
            Tes r\u00e9sultats
            <br/>
            <span className="text-[#FAF4EC] font-black">{userName} \u2728</span>
          </h1>
          <p className="text-[11px] opacity-80 font-body leading-tight mt-1 max-w-xs italic">
            {FACE_SHAPE_TEXTS[faceShape]}
          </p>
        </div>
      </div>

      {/* Erreur */}
      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-900/30 border border-red-500/50 rounded-xl p-3">
          <p className="text-red-200 text-sm">{errorMsg}</p>
        </motion.div>
      )}

      {/* R\u00e9sultat Fal.ai */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-6 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-2xl">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[#C9963A] font-bold text-xl">
                {isFallback ? "Style similaire pour toi" : (resultMsg || "Magnifique !")}
              </h3>
              <p className="text-[11px] mt-1 opacity-70">
                {isFallback
                  ? "Aper\u00e7u bas\u00e9 sur ta forme de visage"
                  : "Ce style te met vraiment en valeur. Montre-le \u00e0 ta coiffeuse !"}
              </p>
            </div>
            <img src={resultImage} alt="R\u00e9sultat" className="w-full object-cover"/>
            <div className="p-5 space-y-2">
              <button
                onClick={() => handleShare("Regarde le style que j\u2019ai choisi avec AfroTresse !", resultImage)}
                className="w-full py-4 rounded-2xl font-bold text-base shadow-xl"
                style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}>
                Envoyer \u00e0 ma coiffeuse
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
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl relative">

            {/* Photos du style */}
            <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40 relative">
              <div className="col-span-2 h-full overflow-hidden">
                <img
                  src={style.views?.face || "/styles/" + (style.localImage || style.image)}
                  className="w-full h-full object-cover object-top cursor-pointer"
                  onClick={() => setZoomImage(style.views?.face || "/styles/" + (style.localImage || style.image))}
                  alt={style.name}
                />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5">
                <img
                  src={style.views?.back || "/styles/" + (style.localImage || style.image)}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setZoomImage(style.views?.back || "/styles/" + (style.localImage || style.image))}
                  alt={style.name}
                />
                <img
                  src={style.views?.top || "/styles/" + (style.localImage || style.image)}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setZoomImage(style.views?.top || "/styles/" + (style.localImage || style.image))}
                  alt={style.name}
                />
              </div>
            </div>

            {/* Barre sociale */}
            <div className="px-6 py-3 flex gap-5 text-[10px] font-black uppercase tracking-widest text-[#C9963A]/80 border-b border-white/5">
              <span>\uD83D\uDC41\uFE0F 2.4K vues</span>
              <span>\u2764\uFE0F 892 likes</span>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-display font-bold text-xl leading-none">{style.name}</h3>
                <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-md font-black uppercase">{style.duration}</span>
              </div>
              <p className="text-[11px] opacity-70 mb-6 font-body leading-relaxed">{style.description}</p>

              {/* Bouton Fal.ai — d\u00e9clenche la transformation */}
              <button
                onClick={() => handleTryStyle(style)}
                disabled={loadingId === style.id}
                className="w-full py-4 rounded-2xl font-display font-bold text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}>
                {loadingId === style.id
                  ? "G\u00e9n\u00e9ration en cours... \u23F3"
                  : "Essayer virtuellement ce style \u2728"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton cr\u00e9dits flottant */}
      <motion.div
        initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        onClick={() => navigate("/credits")}
        className="fixed bottom-28 right-5 z-40 bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-[#2C1A0E]/20 active:scale-95 transition-all">
        <div className="text-[7px] font-black uppercase opacity-60">Solde</div>
        <div className="text-3xl font-display font-black leading-none">{credits}</div>
        <div className="text-[7px] font-bold tracking-tight">CR\u00c9DITS</div>
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
            onClick={() => setZoomImage(null)}>
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={zoomImage}
              className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/10 object-contain"
              onClick={(e) => e.stopPropagation()}
              alt="Zoom"
            />
            <div className="mt-10 flex gap-4 w-full max-w-xs">
              <button
                onClick={(e) => { e.stopPropagation(); handleSave(zoomImage); }}
                className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl flex items-center justify-center gap-2">
                \uD83D\uDCE5 Sauvegarder
              </button>
              <button onClick={() => setZoomImage(null)}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10">
                \u2715
              </button>
            </div>
            <p className="text-[10px] text-white/40 mt-4 uppercase font-bold tracking-widest">3 saves = 1 cr\u00e9dit</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BRAIDS_DB } from "../services/faceAnalysis.js";
import { getCredits, consumeTransform, consumeCredits, hasCredits, canTransform, addSeenStyleId, incrementAnalyses, PRICING } from "../services/credits.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Cœur. Les tresses avec du volume en bas équilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses latérales créent l'harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
};

const WAITING_MSGS = [
  "Préparation de ton nouveau look... ✨",
  "On ajuste la tresse à ton visage... 👑",
  "Presque là... Prépare-toi à briller ! 😍",
];

const RESULT_MSGS = [
  "Waouh 😍, tu es splendide !",
  "Regarde cette Reine ! ✨",
  "Le style parfait pour toi. 👑",
];

const ProtectedImg = ({ src, alt, className, onClick }) => (
  <div className="relative w-full h-full" onClick={onClick}>
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    />
    <div
      className="absolute inset-0"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  </div>
);

export default function Results() {
  const navigate = useNavigate();
  const [faceShape, setFaceShape] = useState("oval");
  const [faceShapeName, setFaceShapeName] = useState("");
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [styles, setStyles] = useState([]);
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultMsg, setResultMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [credits, setCredits] = useState(0);
  const [waitingMsgIdx, setWaitingMsgIdx] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [shownIds, setShownIds] = useState([]);
  const [savesCount, setSavesCount] = useState(0);
  const resultRef = useRef(null);
  const errorRef = useRef(null);
  const waitingIntervalRef = useRef(null);

  const userName = localStorage.getItem("afrotresse_user_name") || "Reine";

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFaceShape(parsed.faceShape || "oval");
        setFaceShapeName(parsed.faceShapeName || "");
        setStyles(parsed.recommendations || []);
        
        // Incrémenter le compteur d'analyses une seule fois au chargement
        incrementAnalyses();
      } catch (e) {
        console.error("Error parsing results:", e);
      }
    }
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    setCredits(getCredits());
  }, []);

  // Calculer les styles à afficher (max 3, excluant ceux déjà vus)
  const remainingStyles = styles.filter((s) => !shownIds.includes(s.id));
  const displayedStyles = remainingStyles.slice(0, 3);
  
  // Vérifier s'il y a d'autres styles à générer
  const hasMoreStyles = remainingStyles.length > 3;
  const canGenerateMore = (displayedStyles.length > 0) && (hasMoreStyles || shownIds.length === 0);

  const handleTransform = async (style, globalIndex) => {
    if (!hasCredits() || !canTransform()) {
      navigate("/credits");
      return;
    }
    setErrorMsg("");
    setResultImage(null);
    setLoadingIdx(globalIndex);
    setWaitingMsgIdx(0);
    setResultMsg("");

    let idx = 0;
    waitingIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % WAITING_MSGS.length;
      setWaitingMsgIdx(idx);
    }, 3000);

    try {
      const selfieBase64 = selfieUrl?.split(",")[1] || null;
      const selfieType = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";
      const styleKey = style.id?.replace(/-/g, "") || style.id;
      const refImage = `${window.location.origin}/styles/${styleKey}-top.jpg`;

      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfieBase64,
          selfieType,
          styleImageUrl: refImage,
          faceShape,
          styleId: style.id,
        }),
      });

      const data = await res.json();
      clearInterval(waitingIntervalRef.current);

      if (!res.ok) {
        setErrorMsg(data.error || "Génération échouée. Réessaie.");
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        return;
      }

      if (!data.imageUrl) {
        setErrorMsg("La génération a échoué. Aucun crédit débité.");
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        return;
      }

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 400);
    } catch (err) {
      clearInterval(waitingIntervalRef.current);
      setErrorMsg("Connexion impossible. Réessaie.");
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } finally {
      setLoadingIdx(null);
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
    } catch (e) {}
  };

  const handleSave = () => {
    const newCount = savesCount + 1;
    setSavesCount(newCount);
    if (newCount % 3 === 0) {
      const debited = consumeCredits(1);
      if (debited) {
        setCredits(getCredits());
        setErrorMsg("✅ 3 sauvegardes = 1 crédit débité!");
      } else {
        setErrorMsg("❌ Pas assez de crédits pour sauvegarder.");
      }
    } else {
      setErrorMsg(`💾 Sauvegarde ${newCount % 3}/3 avant déduction`);
    }
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const handleGenerateMore = () => {
    if (!hasCredits()) {
      navigate("/credits");
      return;
    }
    
    // Marquer les styles actuels comme vus
    const newShown = [...shownIds, ...displayedStyles.map((s) => s.id)];
    setShownIds(newShown);
    
    // Consommer 1 crédit pour la génération
    consumeCredits(1);
    setCredits(getCredits());
    
    setErrorMsg("✨ Nouveaux styles chargés!");
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // DEBUG: Log pour vérifier la pagination
    console.log(`Styles affichés: ${displayedStyles.length}, Styles restants: ${remainingStyles.length - displayedStyles.length}, ShownIds: ${newShown.length}`);
  };

  const faceText = FACE_SHAPE_TEXTS[faceShape] || "";

  if (!styles.length) {
    return (
      <div className="min-h-screen bg-[#2C1A0E] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">💆🏾‍♀️</p>
          <p className="text-white text-xl font-bold mb-2">Quelle tresse aujourd'hui ?</p>
          <p className="text-white/50 text-sm mb-6">Retourne analyser ton visage pour découvrir tes styles.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-full font-bold text-sm text-[#2C1A0E] shadow-lg"
            style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
          >
            Analyser mon visage 🤳🏾
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-white py-6 px-4 pb-32">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full border-2 border-[#C9963A] flex items-center justify-center bg-white/10">
          <span className="text-xs font-bold text-[#C9963A]">AT</span>
        </div>
        <div>
          <h1 className="text-lg font-bold">
            <span className="text-white">Afro</span>
            <span className="text-[#C9963A]">Tresse</span>
          </h1>
          <p className="text-[10px] text-white/40">Résultats pour {userName}</p>
        </div>
      </div>

      {/* FACE SHAPE INFO */}
      <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-[#C9963A]/20">
        <p className="text-sm leading-relaxed">{faceText}</p>
      </div>

      {/* SELFIE DISPLAY */}
      {selfieUrl && (
        <div className="mb-8 rounded-3xl overflow-hidden border-2 border-[#C9963A]/30 bg-black/30">
          <img src={selfieUrl} alt="Ton selfie" className="w-full h-64 object-cover" />
        </div>
      )}

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <motion.div
          ref={errorRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl text-sm bg-white/5 border border-white/10 text-center"
        >
          {errorMsg}
        </motion.div>
      )}

      {/* RESULT IMAGE OVERLAY */}
      <AnimatePresence>
        {resultImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setResultImage(null)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <motion.div
              ref={resultRef}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={resultImage}
                alt="Résultat"
                className="w-full rounded-3xl shadow-2xl"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              <p className="text-center mt-4 text-lg font-bold">{resultMsg}</p>
            </motion.div>

            <div className="mt-10 flex flex-col gap-3 w-full max-w-sm">
              <button
                onClick={() => {
                  const l = document.createElement("a");
                  l.href = resultImage;
                  l.download = `afrotresse-${Date.now()}.jpg`;
                  l.click();
                  handleSave();
                }}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-[#2C1A0E]"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
              >
                📥 Télécharger
              </button>
              <button
                onClick={() => handleShare("Regarde mon nouveau look ! 👑", resultImage)}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-[#2C1A0E]"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
              >
                Envoyer à ma coiffeuse
              </button>
              <button
                onClick={() => setResultImage(null)}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-white/10 text-white/70 border border-white/10"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STYLES */}
      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {
          const styleKey = style.id?.replace(/-/g, "") || style.id;
          const faceImg = style.views?.face || `/styles/${styleKey}-face.jpg`;
          const backImg = style.views?.back || `/styles/${styleKey}-back.jpg`;
          const topImg = style.views?.top || `/styles/${styleKey}-top.jpg`;
          const isLoading = loadingIdx === index;

          return (
            <motion.div
              key={style.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl"
            >
              <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                <div className="col-span-2 h-full overflow-hidden">
                  <ProtectedImg
                    src={faceImg}
                    alt={style.name}
                    className="w-full h-full object-cover object-top"
                    onClick={() => setZoomImage(faceImg)}
                  />
                </div>
                <div className="col-span-1 grid grid-rows-2 gap-0.5">
                  <div className="overflow-hidden">
                    <ProtectedImg
                      src={backImg}
                      alt="dos"
                      className="w-full h-full object-cover"
                      onClick={() => setZoomImage(backImg)}
                    />
                  </div>
                  <div className="overflow-hidden">
                    <ProtectedImg
                      src={topImg}
                      alt="dessus"
                      className="w-full h-full object-cover"
                      onClick={() => setZoomImage(topImg)}
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 flex gap-5 text-[10px] font-black uppercase tracking-widest text-[#C9963A]/80 border-b border-white/5">
                <span>👁️ 2.4K vues</span>
                <span>❤️ 892 likes</span>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl">{style.name}</h3>
                  <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-md font-black uppercase">
                    {style.duration || "3-5h"}
                  </span>
                </div>
                <p className="text-[11px] opacity-70 mb-6 font-body leading-relaxed">
                  {style.description || "Un style unique adapté à ta morphologie"}
                </p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {(style.tags || ["Tendance", "Élégant"]).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-white/10 text-white/80 px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleTransform(style, index)}
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl font-bold text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 text-[#2C1A0E]"
                  style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {WAITING_MSGS[waitingMsgIdx]}
                    </span>
                  ) : (
                    "Essayer virtuellement ce style ✨"
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setZoomImage(null)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={zoomImage}
                className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/10 object-contain"
                alt="Zoom"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
              />
              <div
                className="absolute inset-0 rounded-3xl"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
            <div className="mt-10 flex gap-4 w-full max-w-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                  const l = document.createElement("a");
                  l.href = zoomImage;
                  l.download = `afrotresse-${Date.now()}.jpg`;
                  l.click();
                }}
                className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl"
              >
                📥 Sauvegarder
              </button>
              <button
                onClick={() => setZoomImage(null)}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10"
              >
                ✕
              </button>
            </div>
            <p className="text-[10px] text-white/40 mt-4 uppercase font-bold tracking-widest">
              3 saves = 1 crédit
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOUTONS FLOTTANTS — bottom-24 pour passer au-dessus de la navbar */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-2">

        {/* BOUTON SOLDE */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => navigate("/credits")}
          className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-lg flex flex-col items-center justify-center shadow-lg border border-[#2C1A0E]/20 active:scale-95 transition-all cursor-pointer"
        >
          <div className="text-[5px] font-black uppercase opacity-60 leading-tight">Solde</div>
          <div className="text-xl font-black leading-none">{credits}</div>
        </motion.div>

        {/* BOUTON GÉNÉRER */}
        {canGenerateMore && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateMore}
            className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shadow-lg relative border border-white/10 active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
          >
            <span className="text-[6px] font-black text-[#2C1A0E] uppercase leading-none">Gen</span>
            <span className="text-base">✨</span>
            <div className="absolute -top-1 -right-1 bg-[#2C1A0E] text-[#C9963A] text-[7px] px-1 py-0 rounded-full font-bold border border-[#C9963A]">
              -1
            </div>
          </motion.button>
        )}
      </div>

    </div>
  );
}

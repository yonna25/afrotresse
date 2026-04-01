import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BRAIDS_DB } from "../services/faceAnalysis.js";
import { getCredits, consumeTransform, consumeCredits, hasCredits, canTransform, addSeenStyleId, PRICING } from "../services/credits.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure tr\u00e8s \u00e9quilibr\u00e9e qui s'adapte \u00e0 presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carr\u00e9e. Les tresses avec du volume adoucissent ta m\u00e2choire.",
  heart:   "Ton visage est en forme de C\u0153ur. Les tresses avec du volume en bas \u00e9quilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses lat\u00e9rales cr\u00e9ent l'harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
};

const WAITING_MSGS = [
  "Pr\u00e9paration de ton nouveau look... \u2728",
  "On ajuste la tresse \u00e0 ton visage... \ud83d\udc51",
  "Presque l\u00e0... Pr\u00e9pare-toi \u00e0 briller ! \ud83d\ude0d",
];

const RESULT_MSGS = [
  "Waouh \ud83d\ude0d, tu es splendide !",
  "Regarde cette Reine ! \u2728",
  "Le style parfait pour toi. \ud83d\udc51",
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
      } catch (e) {
        console.error("Error parsing results:", e);
      }
    }
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    setCredits(getCredits());
  }, []);

  const displayedStyles = styles.filter((s) => !shownIds.includes(s.id)).slice(0, 3);
  const canGenerateMore =
    styles.filter((s) => !shownIds.includes(s.id)).length > 3 || shownIds.length > 0;

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
        setErrorMsg(data.error || "G\u00e9n\u00e9ration \u00e9chou\u00e9e. R\u00e9essaie.");
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
        return;
      }

      if (!data.imageUrl) {
        setErrorMsg("La g\u00e9n\u00e9ration a \u00e9chou\u00e9. Aucun cr\u00e9dit d\u00e9bit\u00e9.");
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
      setErrorMsg("Connexion impossible. R\u00e9essaie.");
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
        alert("Lien copi\u00e9 !");
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
        setErrorMsg("\u2705 3 sauvegardes = 1 cr\u00e9dit d\u00e9bit\u00e9!");
      } else {
        setErrorMsg("\u274c Pas assez de cr\u00e9dits pour sauvegarder.");
      }
    } else {
      setErrorMsg(`\ud83d\udcbe Sauvegarde ${newCount % 3}/3 avant d\u00e9duction`);
    }
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const handleGenerateMore = () => {
    if (!hasCredits()) {
      navigate("/credits");
      return;
    }
    const newShown = [...shownIds, ...displayedStyles.map((s) => s.id)];
    setShownIds(newShown);
    consumeCredits(1);
    setCredits(getCredits());
    setErrorMsg("\u2728 Nouveaux styles charg\u00e9s!");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const faceText = FACE_SHAPE_TEXTS[faceShape] || "";

  if (!styles

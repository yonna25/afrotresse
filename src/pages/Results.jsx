import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BRAIDS_DB, FACE_SHAPE_NAMES } from "../services/faceAnalysis.js";
import { getCredits, consumeTransform, hasCredits, canTransform, addSeenStyleId, getSeenStyleIds, PRICING } from "../services/credits.js";

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

// --- COMPOSANT ANIMATION ÉTINCELLES ---
const SparkleEffect = ({ active }) => (
  <AnimatePresence>
    {active && [...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
        animate={{ 
          scale: [0, 1, 0], 
          opacity: 0,
          x: (Math.random() - 0.5) * 140, 
          y: (Math.random() - 0.5) * 140 
        }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="absolute pointer-events-none w-2 h-2 bg-[#C9963A] rounded-full z-50"
        style={{ boxShadow: '0 0 10px #E8B96A' }}
      />
    ))}
  </AnimatePresence>
);

export default function Results() {
  const navigate = useNavigate();
  const [faceShape, setFaceShape] = useState('oval');
  const [faceShapeName, setFaceShapeName] = useState('');
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [styles, setStyles] = useState([]);
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState("");
  const [credits, setCredits] = useState(0);
  const [waitingMsgIdx, setWaitingMsgIdx] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [isSparkling, setIsSparkling] = useState(false);
  const resultRef = useRef(null);
  const waitingIntervalRef = useRef(null);
  const [page, setPage] = useState(0);

  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';

  useEffect(() => {
    const raw = sessionStorage.getItem('afrotresse_results');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFaceShape(parsed.faceShape || 'oval');
        setFaceShapeName(parsed.faceShapeName || '');
        setStyles(parsed.recommendations || []);
      } catch (e) { console.error('Error parsing results:', e); }
    }
    const photo = sessionStorage.getItem('afrotresse_photo');
    if (photo) setSelfieUrl(photo);
    setCredits(getCredits());
  }, []);

  // --- LOGIQUE : NOUVEAUX STYLES (RAFRAÎCHISSEMENT) ---
  const handleGetNewStyles = () => {
    if (!hasCredits()) { navigate('/credits'); return; }

    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 800);

    const seenIds = getSeenStyleIds();
    // Marquer les styles actuels comme "vus"
    styles.forEach(s => addSeenStyleId(s.id)); 

    // Filtrer pour obtenir des styles jamais vus adaptés au visage
    const available = BRAIDS_DB.filter(s => 
      !seenIds.includes(s.id) && 
      (!s.faceShapes || s.faceShapes.includes(faceShape))
    );

    const nextStyles = [...available].sort(() => 0.5 - Math.random()).slice(0, 3);

    if (nextStyles.length > 0) {
      consumeTransform(); // Consomme 1 crédit
      setCredits(getCredits());
      setStyles(nextStyles);
      setPage(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setErrorMsg("Incroyable ! Tu as déjà exploré tous nos styles disponibles.");
    }
  };

  const handleTransform = async (style, index) => {
    if (!hasCredits() || !canTransform()) { navigate('/credits'); return; }
    
    setErrorMsg("");
    setResultImage(null);
    setLoadingIdx(index);
    setWaitingMsgIdx(0);

    let idx = 0;
    waitingIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % WAITING_MSGS.length;
      setWaitingMsgIdx(idx);
    }, 3000);

    try {
      const selfieBase64 = selfieUrl?.split(',')[1] || null;
      const selfieType = selfieUrl?.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const styleKey = style.id?.replace(/-/g, '') || style.id;
      const refImage = `${window.location.origin}/styles/${styleKey}-top.jpg`;

      const res = await fetch('/api/falGenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfieBase64, selfieType, styleImageUrl: refImage, faceShape, styleId: style.id }),
      });

      const data = await res.json();
      clearInterval(waitingIntervalRef.current);

      if (!res.ok) throw new Error(data.error || "Génération échouée");

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      clearInterval(waitingIntervalRef.current);
      setErrorMsg("Connexion impossible. Réessaie.");
    } finally {
      setLoadingIdx(null);
    }
  };

  if (!styles.length) return null;

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">
      
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10">
        {selfieUrl && <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />}
        <div className="flex-1">
          <h1 className="font-bold text-2xl text-[#C9963A]">{userName} ✨</h1>
          <p className="text-[11px] opacity-80 leading-tight mt-1">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </motion.div>

      {/* RESULTAT */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A]">
            <div className="p-5">
              <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg}</h3>
              <img src={resultImage} className="w-full rounded-2xl mt-3 object-cover" alt="Résultat" />
              <button onClick={() => setResultImage(null)} className="w-full py-3 mt-4 text-white/50 text-sm">Fermer</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTE DES STYLES */}
      <div className="flex flex-col gap-8">
        {styles.map((style, index) => {
          const styleKey = style.id?.replace(/-/g, '') || style.id;
          const isL = loadingIdx === index;
          return (
            <motion.div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">
              <div className="h-72 bg-black/40">
                <img src={`/styles/${styleKey}-face.jpg`} className="w-full h-full object-cover object-top" alt={style.name} />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-4">{style.name}</h3>
                <button 
                  onClick={() => handleTransform(style, index)}
                  disabled={isL}
                  className="w-full py-4 rounded-2xl font-bold text-[#2C1A0E] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}
                >
                  {isL ? WAITING_MSGS[waitingMsgIdx] : "Essayer virtuellement ✨"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* GROUPE DE BOUTONS FLOTTANTS */}
      <div className="fixed bottom-6 right-5 z-50 flex flex-col items-center gap-4">
        {/* BOUTON CRÉDITS */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          onClick={() => navigate('/credits')}
          className="bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-[#2C1A0E]/20 cursor-pointer active:scale-95 transition-all"
        >
          <span className="text-[7px] font-black opacity-60">SOLDE</span>
          <span className="text-2xl font-black">{credits}</span>
        </motion.div>

        {/* BOUTON REFRESH (Nouveaux Styles) */}
        <div className="relative">
          <SparkleEffect active={isSparkling} />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleGetNewStyles}
            className="w-14 h-14 rounded-full bg-[#3D2616] border-2 border-[#C9963A] shadow-xl flex flex-col items-center justify-center text-[#C9963A]"
          >
            <motion.span animate={isSparkling ? { rotate: 360 } : {}} className="text-xl">✨</motion.span>
            <span className="text-[7px] font-black uppercase tracking-tighter">Nouveaux</span>
          </motion.button>
        </div>
      </div>

    </div>
  );
}

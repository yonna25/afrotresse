import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BRAIDS_DB, FACE_SHAPE_NAMES } from "../services/faceAnalysis.js";
import { getCredits, consumeTransform, hasCredits, canTransform, addSeenStyleId, getSeenStyleIds } from "../services/credits.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C\u2019est une structure tr\u00e8s \u00e9quilibr\u00e9e qui s\u2019adapte \u00e0 presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carr\u00e9e. Les tresses avec du volume adoucissent ta m\u00e2choire.",
  heart:   "Ton visage est en forme de C\u0153ur. Les tresses avec du volume en bas \u00e9quilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses lat\u00e9rales cr\u00e9ent l\u2019harmonie parfaite.",
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

// --- COMPOSANT SPARKLE ---
const SparkleEffect = ({ active }) => (
  <AnimatePresence>
    {active && [...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
        animate={{
          scale: [0, 1, 0],
          opacity: 0,
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
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
  const [page, setPage] = useState(0);
  const [isSparkling, setIsSparkling] = useState(false);
  const resultRef = useRef(null);
  const waitingIntervalRef = useRef(null);

  const userName = localStorage.getItem('afrotresse_user_name') || 'Reine';

  useEffect(() => {
    const raw = sessionStorage.getItem('afrotresse_results');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFaceShape(parsed.faceShape || 'oval');
        setFaceShapeName(parsed.faceShapeName || '');
        setStyles(parsed.recommendations || []);
      } catch (e) {
        console.error('Error parsing results:', e);
      }
    }
    const photo = sessionStorage.getItem('afrotresse_photo');
    if (photo) setSelfieUrl(photo);
    setCredits(getCredits());
  }, []);

  const handleTransform = async (style, index) => {
    if (!hasCredits() || !canTransform()) { navigate('/credits'); return; }

    setErrorMsg("");
    setResultImage(null);
    setLoadingIdx(index);
    setWaitingMsgIdx(0);
    setResultMsg('');

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

      if (res.status === 429) { setErrorMsg(data.error || "Quota d\u00e9pass\u00e9. R\u00e9essaie plus tard."); return; }
      if (!res.ok)            { setErrorMsg(data.error || "G\u00e9n\u00e9ration \u00e9chou\u00e9e. R\u00e9essaie.");    return; }

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    } catch (err) {
      clearInterval(waitingIntervalRef.current);
      setErrorMsg("Connexion impossible. R\u00e9essaie.");
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleGetNewStyles = () => {
    if (!hasCredits()) { navigate('/credits'); return; }

    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 600);

    const seenIds = getSeenStyleIds();
    styles.forEach(s => addSeenStyleId(s.id));

    const available = BRAIDS_DB.filter(s =>
      !seenIds.includes(s.id) &&
      (!s.faceShapes || s.faceShapes.includes(faceShape))
    );

    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const nextStyles = shuffled.slice(0, 3);

    if (nextStyles.length > 0) {
      setStyles(nextStyles);
      setPage(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert("Tu as explor\u00e9 tous les styles pour le moment ! \u2728");
    }
  };

  const handleShare = async (text, url) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AfroTresse', text, url: url || window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Lien copi\u00e9 !");
      }
    } catch (e) {}
  };

  const faceText = FACE_SHAPE_TEXTS[faceShape] || '';

  if (!styles.length) {
    return (
      <div className="min-h-screen bg-[#2C1A0E] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">\ud83d\udc86\ud83c\udffe\u200d\u2640\ufe0f</p>
          <p className="text-white text-xl font-bold mb-2">Quelle tresse aujourd\u2019hui ?</p>
          <p className="text-gray-400 text-sm mb-6">Prends un selfie pour d\u00e9couvrir les styles qui te conviennent.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-full font-bold text-sm text-[#2C1A0E]"
            style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>
            D\u00e9couvrir ma tresse parfaite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10"
        style={{ boxShadow: '0 0 40px rgba(201,150,58,0.2)' }}>
        <div className="relative shrink-0">
          {selfieUrl ? (
            <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-white/50">
              Photo
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md uppercase">
            Moi
          </div>
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-bold text-3xl text-[#C9963A]">
            Tes r\u00e9sultats<br/>
            <span className="text-[#FAF4EC]">{userName} \u2728</span>
          </h1>
          <p className="text-[11px] opacity-80 font-body leading-tight mt-1 max-w-xs">{faceText}</p>
        </div>
      </motion.div>

      {/* ERROR */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-900/30 border border-red-500/50 rounded-xl p-3">
            <p className="text-red-200 text-sm">\ud83d\udcf7 {errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULT IMAGE */}
      <AnimatePresence>
        {resultImage && (
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-6 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A]"
            style={{ boxShadow: '0 0 40px rgba(201,150,58,0.2)' }}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg || "Magnifique !"}</h3>
              <p className="text-[11px] mt-1 opacity-70">Ce style te met vraiment en valeur. Montre-le \u00e0 ta coiffeuse !</p>
            </div>
            <img src={resultImage} alt="R\u00e9sultat" className="w-full object-cover"/>
            <div className="p-5 space-y-2">
              <button
                onClick={() => handleShare("Regarde le style que j\u2019ai choisi avec AfroTresse !", resultImage)}
                className="w-full py-4 rounded-2xl font-bold text-base shadow-xl text-[#2C1A0E]"
                style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>
                Envoyer \u00e0 ma coiffeuse
              </button>
              <button
                onClick={() => setResultImage(null)}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-white/10 text-white/70 border border-white/10">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STYLES PAGINÉS */}
      {(() => {
        const PAGE_SIZE = 3;
        const totalPages = Math.ceil(styles.length / PAGE_SIZE);
        const paged = styles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        return (
          <>
            <div className="flex flex-col gap-8">
              {paged.map((style, index) => {
                const globalIndex = page * PAGE_SIZE + index;
                const styleKey = style.id?.replace(/-/g, '') || style.id;
                const faceImg = style.views?.face || `/styles/${styleKey}-face.jpg`;
                const backImg = style.views?.back || `/styles/${styleKey}-back.jpg`;
                const topImg  = style.views?.top  || `/styles/${styleKey}-top.jpg`;
                const isLoading = loadingIdx === globalIndex;

                return (
                  <motion.div
                    key={style.id || index}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl">

                    <div className="grid grid-cols-3 gap-0.5 h-72 bg-black/40">
                      <div className="col-span-2 h-full overflow-hidden cursor-pointer" onClick={() => setZoomImage(faceImg)}>
                        <img src={faceImg} alt={style.name} className="w-full h-full object-cover object-top"/>
                      </div>
                      <div className="col-span-1 grid grid-rows-2 gap-0.5">
                        <div className="overflow-hidden cursor-pointer" onClick={() => setZoomImage(backImg)}>
                          <img src={backImg} alt="dos" className="w-full h-full object-cover"/>
                        </div>
                        <div className="overflow-hidden cursor-pointer" onClick={() => setZoomImage(topImg)}>
                          <img src={topImg} alt="dessus" className="w-full h-full object-cover"/>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-3 flex gap-5 text-[10px] font-black uppercase tracking-widest text-[#C9963A]/80 border-b border-white/5">
                      <span>\ud83d\udc41\ufe0f 2.4K vues</span>
                      <span>\u2764\ufe0f 892 likes</span>
                    </div>

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-xl">{style.name}</h3>
                        <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-md font-black uppercase">
                          {style.duration || "3-5h"}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-70 mb-6 font-body leading-relaxed">
                        {style.description || "Un style unique adapt\u00e9 \u00e0 ta morphologie"}
                      </p>
                      <div className="flex gap-2 flex-wrap mb-4">
                        {(style.tags || ["Tendance", "\u00c9l\u00e9gant"]).slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[10px] bg-white/10 text-white/80 px-3 py-1 rounded-full">{tag}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleTransform(style, globalIndex)}
                        disabled={isLoading || !hasCredits() || !canTransform()}
                        className="w-full py-4 rounded-2xl font-bold text-base shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 text-[#2C1A0E]"
                        style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            {WAITING_MSGS[waitingMsgIdx]}
                          </span>
                        ) : "Essayer virtuellement ce style \u2728"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 mb-4">
                <button
                  onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={page === 0}
                  className="px-5 py-3 rounded-2xl font-bold text-sm bg-white/10 text-white/70 border border-white/10 disabled:opacity-30 active:scale-95 transition-all">
                  \u2190 Pr\u00e9c\u00e9dent
                </button>
                <span className="text-[#C9963A] font-black text-sm">{page + 1} / {totalPages}</span>
                <button
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={page >= totalPages - 1}
                  className="px-5 py-3 rounded-2xl font-bold text-sm bg-white/10 text-white/70 border border-white/10 disabled:opacity-30 active:scale-95 transition-all">
                  Suivant \u2192
                </button>
              </div>
            )}
          </>
        );
      })()}

      {/* FLOATING BUTTONS */}
      <div className="fixed bottom-28 right-5 z-40 flex flex-col items-center gap-3">

        {/* CRÉDITS */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          onClick={() => navigate('/credits')}
          className="bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 border-[#2C1A0E]/20 active:scale-95 transition-all cursor-pointer">
          <div className="text-[7px] font-black uppercase opacity-60">Solde</div>
          <div className="text-2xl font-black leading-none">{credits}</div>
          <div className="text-[7px] font-bold tracking-tight">CR\u00c9DITS</div>
        </motion.div>

        {/* NOUVEAUX STYLES */}
        <div className="relative">
          <SparkleEffect active={isSparkling} />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleGetNewStyles}
            className="w-14 h-14 rounded-full bg-[#3D2616] border-2 border-[#C9963A] shadow-[0_0_20px_rgba(201,150,58,0.3)] flex flex-col items-center justify-center text-[#C9963A] relative overflow-hidden">
            <motion.span animate={isSparkling ? { rotate: 360 } : {}} className="text-xl">
              \u2728
            </motion.span>
            <span className="text-[8px] font-black uppercase mt-0.5">Nouveaux</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
          </motion.button>
        </div>

      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setZoomImage(null)}>
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={zoomImage}
              className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/10 object-contain"
              onClick={e => e.stopPropagation()} alt="Zoom"/>
            <div className="mt-10 flex gap-4 w-full max-w-xs">
              <button
                onClick={e => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = zoomImage;
                  link.download = `afrotresse-${Date.now()}.jpg`;
                  link.click();
                }}
                className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl">
                \ud83d\udce5 Sauvegarder
              </button>
              <button
                onClick={() => setZoomImage(null)}
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

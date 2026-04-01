import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BRAIDS_DB } from "../services/faceAnalysis.js";
import { getCredits, consumeTransform, consumeCredits, hasCredits, canTransform, addSeenStyleId, PRICING } from "../services/credits.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
  square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent ta mâchoire.",
  heart:   "Ton visage est en forme de Cœur. Les tresses avec du volume en bas équilibrent ton menton.",
  long:    "Ton visage est de forme Longue. Les tresses latérales créent l'harmonie parfaite.",
  diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
}

const WAITING_MSGS = [
  "Préparation de ton nouveau look... ✨",
  "On ajuste la tresse à ton visage... 👑",
  "Presque là... Prépare-toi à briller ! 😍",
]

const RESULT_MSGS = [
  "Waouh 😍, tu es splendide !",
  "Regarde cette Reine ! ✨",
  "Le style parfait pour toi. 👑",
]

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
  const [shownIds, setShownIds] = useState([]);
  const [savesCount, setSavesCount] = useState(0);
  const resultRef = useRef(null);
  const errorRef = useRef(null);
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

  // 3 styles affichés, jamais les mêmes
  const displayedStyles = styles.filter(s => !shownIds.includes(s.id)).slice(0, 3);
  const canGenerateMore = styles.filter(s => !shownIds.includes(s.id)).length > 3 || shownIds.length > 0;

  const handleTransform = async (style, globalIndex) => {
    // ✅ VÉRIFICATION CRÉDITS — Redirige vers /credits si pas assez
    if (!hasCredits() || !canTransform()) { 
      navigate('/credits'); 
      return; 
    }

    setErrorMsg("");
    setResultImage(null);
    setLoadingIdx(globalIndex);
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

      if (!res.ok) {
        setErrorMsg(data.error || "Génération échouée. Réessaie.");
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        return;
      }

      if (!data.imageUrl) {
        setErrorMsg("La génération a échoué. Aucun crédit débité.");
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        return;
      }

      consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 400);

    } catch (err) {
      clearInterval(waitingIntervalRef.current);
      setErrorMsg("Connexion impossible. Réessaie.");
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleShare = async (text, url) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AfroTresse', text, url: url || window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Lien copié !");
      }
    } catch (e) {}
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE SAVE — Tracking des sauvegardes (3 = 1 crédit)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSave = () => {
    const newCount = savesCount + 1;
    setSavesCount(newCount);

    // Tous les 3 saves, déduire 1 crédit
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
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE GENERATE MORE STYLES
  // ═══════════════════════════════════════════════════════════════════════════
  const handleGenerateMore = () => {
    // ✅ VÉRIFICATION CRÉDITS — Redirige vers /credits si pas assez
    if (!hasCredits()) { 
      navigate('/credits'); 
      return; 
    }

    // Ajouter les styles affichés aux "vus"
    const newShown = [...shownIds, ...displayedStyles.map(s => s.id)];
    setShownIds(newShown);
    
    // Consommer 1 crédit
    consumeCredits(1);
    setCredits(getCredits());
    
    // Message de confirmation
    setErrorMsg("✨ Nouveaux styles chargés!");
    
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faceText = FACE_SHAPE_TEXTS[faceShape] || '';

  if (!styles.length) {
    return (
      <div className="min-h-screen bg-[#2C1A0E] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">💆🏾‍♀️</p>
          <p className="text-white text-xl font-bold mb-2">Quelle tresse aujourd'hui ?</p>
          <p className="text-gray-400 text-sm mb-6">Prends un selfie pour découvrir les styles qui te conviennent.</p>
          <button onClick={() => navigate('/')}
            className="px-6 py-3 rounded-full font-bold text-sm text-[#2C1A0E]"
            style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>
            Découvrir ma tresse parfaite
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4 sm:p-6 pb-40 relative">

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-row gap-5 items-center bg-white/5 p-5 rounded-[2.5rem] border border-white/10"
        style={{ boxShadow: '0 0 40px rgba(201,150,58,0.2)' }}>
        <div className="relative shrink-0">
          {selfieUrl ? (
            <img src={selfieUrl} className="w-20 h-20 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-white/50">Photo</div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-[#C9963A] text-[#2C1A0E] text-[10px] font-black px-2 py-1 rounded-md uppercase">Moi</div>
        </div>
        <div className="flex flex-col flex-1">
          <h1 className="font-bold text-3xl text-[#C9963A]">
            Tes résultats<br/>
            <span className="text-[#FAF4EC]">{userName} ✨</span>
          </h1>
          <p className="text-[11px] opacity-80 font-body leading-tight mt-1 max-w-xs">{faceText}</p>
        </div>
      </motion.div>

      {/* ERROR / MESSAGE */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div ref={errorRef} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-4 border rounded-xl p-3 ${errorMsg.includes('✅') || errorMsg.includes('✨') ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
            <p className={errorMsg.includes('✅') || errorMsg.includes('✨') ? 'text-green-200 text-sm' : 'text-red-200 text-sm'}>{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULT */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mb-6 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A]"
            style={{ boxShadow: '0 0 40px rgba(201,150,58,0.2)' }}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-[#C9963A] font-bold text-xl">{resultMsg || "Magnifique !"}</h3>
              <p className="text-[11px] mt-1 opacity-70">Ce style te met vraiment en valeur. Montre-le à ta coiffeuse !</p>
            </div>
            <img src={resultImage} alt="Résultat" className="w-full object-cover"/>
            <div className="p-5 space-y-2">
              <button onClick={() => handleShare("Regarde le style que j'ai choisi avec AfroTresse !", resultImage)}
                className="w-full py-4 rounded-2xl font-bold text-base shadow-xl text-[#2C1A0E]"
                style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>
                Envoyer à ma coiffeuse
              </button>
              <button onClick={() => setResultImage(null)}
                className="w-full py-3 rounded-2xl text-sm font-semibold bg-white/10 text-white/70 border border-white/10">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STYLES */}
      <div className="flex flex-col gap-8">
        {displayedStyles.map((style, index) => {

          const styleKey = style.id?.replace(/-/g, '') || style.id;
          const faceImg = style.views?.face || `/styles/${styleKey}-face.jpg`;
          const backImg = style.views?.back || `/styles/${styleKey}-back.jpg`;
          const topImg = style.views?.top || `/styles/${styleKey}-top.jpg`;
          const isLoading = loadingIdx === index;

          return (
            <motion.div key={style.id || index}
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
                <span>👁️ 2.4K vues</span>
                <span>❤️ 892 likes</span>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl">{style.name}</h3>
                  <span className="text-[10px] bg-[#C9963A] text-[#2C1A0E] px-2.5 py-1 rounded-md font-black uppercase">{style.duration || "3-5h"}</span>
                </div>
                <p className="text-[11px] opacity-70 mb-6 font-body leading-relaxed">{style.description || "Un style unique adapté à ta morphologie"}</p>
                <div className="flex gap-2 flex-wrap mb-4">
                  {(style.tags || ["Tendance", "Élégant"]).slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-white/10 text-white/80 px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <button
                  onClick={() => handleTransform(style, index)}
                  disabled={isLoading}
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
                  ) : "Essayer virtuellement ce style ✨"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-6 backdrop-blur-xl"
            onClick={() => setZoomImage(null)}>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={zoomImage}
              className="max-w-full max-h-[70vh] rounded-3xl shadow-2xl border border-white/10 object-contain"
              onClick={e => e.stopPropagation()} alt="Zoom"/>
            <div className="mt-10 flex gap-4 w-full max-w-xs">
              <button onClick={e => { 
                e.stopPropagation(); 
                handleSave();
                const l = document.createElement('a'); 
                l.href = zoomImage; 
                l.download = `afrotresse-${Date.now()}.jpg`; 
                l.click(); 
              }}
                className="flex-1 py-4 bg-[#C9963A] text-[#2C1A0E] rounded-2xl font-black shadow-xl">
                📥 Sauvegarder
              </button>
              <button onClick={() => setZoomImage(null)}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold backdrop-blur-md border border-white/10">
                ✕
              </button>
            </div>
            <p className="text-[10px] text-white/40 mt-4 uppercase font-bold tracking-widest">3 saves = 1 crédit</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════════
          BOUTONS FLOTTANTS — Positionnés à droite en bas
          ✅ Bouton Solde (haut) + Bouton Générer (bas) — IDENTIQUES en forme (COMPACT)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-4 z-40 flex flex-col items-center gap-2">
        
        {/* BOUTON SOLDE (HAUT) — w-12 h-12 rounded-lg (COMPACT) */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => navigate('/credits')}
          className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-lg flex flex-col items-center justify-center shadow-lg border border-[#2C1A0E]/20 active:scale-95 transition-all cursor-pointer">
          <div className="text-[5px] font-black uppercase opacity-60 leading-tight">Solde</div>
          <div className="text-xl font-black leading-none">{credits}</div>
        </motion.div>

        {/* BOUTON GÉNÉRER (BAS) — MÊME TAILLE: w-12 h-12 rounded-lg (COMPACT) */}
        {canGenerateMore && (
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerateMore}
            className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shadow-lg relative border border-white/10 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #C9963A, #E8B96A)' }}>
            <span className="text-[6px] font-black text-[#2C1A0E] uppercase leading-none">Gen</span>
            <span className="text-base">✨</span>
            {/* Badge "-1 crédit" */}
            <div className="absolute -top-1 -right-1 bg-[#2C1A0E] text-[#C9963A] text-[7px] px-1 py-0 rounded-full font-bold border border-[#C9963A]">
              -1
            </div>
          </motion.button>
        )}
      </div>

    </div>
  );
}

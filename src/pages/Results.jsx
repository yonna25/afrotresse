import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, hasCredits, useOneTest, PRICING } from "../services/credits.js";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C'est une structure tres equilibree qui s'adapte a presque tous les styles. Pour accentuer ton regard, les tresses degagees vers l'arriere sont ideales.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes et les styles verticaux sont parfaits pour toi.",
  square:  "Ton visage est de forme Carree. Les tresses avec du volume sur les cotes adoucissent ta machoire et creent une harmonie naturelle.",
  heart:   "Ton visage est en forme de Coeur. Les tresses avec du volume en bas equilibrent ton menton et mettent en valeur tes pommettes.",
  long:    "Ton visage est de forme Longue. Les tresses laterales et les styles avec du volume sur les cotes creent l'harmonie parfaite pour toi.",
  diamond: "Ton visage est de forme Diamant. Tes pommettes sont ton atout majeur. Les tresses qui encadrent le visage te subliment naturellement.",
}

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles]           = useState([]);
  const [shuffledStyles, setShuffledStyles] = useState([]);
  const [page, setPage]               = useState(0);
  const [faceShape, setFaceShape]     = useState('oval');
  const [faceShapeName, setFaceShapeName] = useState('');
  const [selfieUrl, setSelfieUrl]     = useState(null);
  const [loadingIdx, setLoadingIdx]   = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isFallback, setIsFallback]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");
  const [credits, setCredits]         = useState(0);
  const resultRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('afrotresse_results');
    if (raw) {
      const parsed = JSON.parse(raw);
      const recs = parsed.recommendations || [];
      setStyles(recs);
      setShuffledStyles(shuffleArray(recs));
      setFaceShape(parsed.faceShape || 'oval');
      setFaceShapeName(parsed.faceShapeName || '');
    }
    const photo = sessionStorage.getItem('afrotresse_photo');
    if (photo) setSelfieUrl(photo);
    setCredits(getCredits());
  }, []);

  const hasPaidCredits = () => getCredits() > (PRICING.freeTests || 2)

  const handleTryStyle = async (style, index) => {
    if (!hasCredits()) { navigate('/credits'); return; }
    if (!hasPaidCredits()) { navigate('/credits'); return; }
    setErrorMsg("");
    setResultImage(null);
    setIsFallback(false);
    setLoadingIdx(index);

    try {
      const selfieBase64 = selfieUrl?.split(',')[1] || null;
      const selfieType   = selfieUrl?.match(/:(.*?);/)?.[1] || 'image/jpeg';
      const styleImageUrl = style.image
        ? `${window.location.origin}${style.image}`
        : `${window.location.origin}/styles/${style.localImage}`;

      const res = await fetch('/api/falGenerate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfieBase64, selfieType, styleImageUrl, faceShape, styleId: style.id }),
      });

      const data = await res.json();
      if (res.status === 429) { setErrorMsg(data.error); return; }
      useOneTest();
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setIsFallback(data.fallback || false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error(err);
      setErrorMsg("Connexion impossible. Reessaie.");
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleShare = async (text, url) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AfroTresse', text, url: url || window.location.href })
      } else {
        await navigator.clipboard.writeText(text)
        alert('Lien copie dans le presse-papier !')
      }
    } catch (e) {
      console.log('Share cancelled or failed')
    }
  }

  const faceText = FACE_SHAPE_TEXTS[faceShape] || ''

  if (!shuffledStyles.length) return (
    <div className="min-h-screen bg-[#2b1810] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-4xl mb-4">💆🏾‍♀️</p>
          <p className="text-white text-xl font-display font-semibold mb-2">Quelle tresse aujourd'hui ?</p>
          <p className="text-gray-400 text-sm mb-6">Prends un selfie pour decouvrir les styles qui sublimeront ton visage.</p>
          <button onClick={() => navigate('/')}
            className="px-6 py-3 rounded-full font-semibold text-sm"
            style={{ background: '#FFC000', color: '#000' }}>
            Decouvrir ma tresse parfaite
          </button>
        </div>
    </div>
  );

  return (
    <div className="px-4 py-6 space-y-5 bg-[#2b1810] min-h-screen pb-28">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-[#3a2118] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h2 className="text-white text-xl font-semibold">Ta selection sur-mesure</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(232,185,106,0.7)" }}>Les styles qui sublimeront naturellement tes traits.</p>
          </div>
        </div>
        <button onClick={() => navigate('/credits')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background:'rgba(255,192,0,0.15)', border:'1px solid rgba(255,192,0,0.3)' }}>
          <span className="text-yellow-400 font-bold text-sm">{credits}</span>
          <span className="text-gray-400 text-xs">credit{credits > 1 ? 's' : ''}</span>
        </button>
      </div>

      {/* Selfie + analyse visage */}
      {selfieUrl && (
        <div className="bg-[#3a2118] rounded-2xl p-4"
          style={{ border: '1px solid rgba(201,150,58,0.2)' }}>
          <div className="flex items-center gap-3 mb-3">
            <img src={selfieUrl} alt="Ton selfie" className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              style={{ border: '2px solid rgba(201,150,58,0.4)' }}/>
            <div>
              <p className="text-white font-semibold text-base">Ta selection est prete ✦</p>
              {faceShapeName && (
                <p className="text-xs mt-0.5" style={{ color: '#C9963A' }}>
                  Visage {faceShapeName} detecte
                </p>
              )}
            </div>
          </div>
          {faceText && (
            <div className="rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(201,150,58,0.08)', border: '1px solid rgba(201,150,58,0.2)' }}>
              <p className="text-sm leading-relaxed" style={{ color: '#FAF4EC' }}>
                {faceText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Message erreur */}
      {errorMsg && (
        <div className="bg-red-900 border border-red-500 text-red-200 text-sm px-4 py-3 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Bannière freemium */}
      {!hasCredits() && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 text-center"
          style={{ background: 'linear-gradient(135deg, #3a2118, #5a3225)', border: '1px solid rgba(255,192,0,0.3)' }}>
          <p className="text-yellow-400 font-bold text-base">Ne prends plus de risques avant d'aller au salon</p>
          <p className="text-gray-300 text-sm mt-1">Visualise le rendu final et gagne du temps avec ta coiffeuse.</p>
          <button onClick={() => navigate('/credits')}
            className="mt-3 px-5 py-2 rounded-full text-sm font-semibold text-black"
            style={{ background: '#FFC000' }}>
            Obtenir des credits
          </button>
        </motion.div>
      )}

      {/* Resultat Fal.ai */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-[#3a2118] rounded-2xl overflow-hidden border-2 border-yellow-400">
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-yellow-400 font-bold text-xl">
                {isFallback ? 'Style similaire pour toi' : 'Magnifique !'}
              </h3>
              <p className="text-sm mt-1 font-medium" style={{ color: '#FAF4EC' }}>
                {isFallback
                  ? 'Apercu base sur ta forme de visage — essaie un vrai selfie pour plus de precision'
                  : 'Ce style te met vraiment en valeur. Montre-le a ta coiffeuse !'}
              </p>
            </div>
            <img src={resultImage} alt="Resultat" className="w-full object-cover"/>
            <div className="p-4 space-y-2">
              <button
                onClick={() => handleShare("Regarde le style que j'ai choisi avec AfroTresse !", resultImage)}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ background: '#FFC000', color: '#000' }}>
                Envoyer a ma coiffeuse
              </button>
              <button
                onClick={() => handleShare("Rejoins AfroTresse et trouve ta tresse parfaite !", window.location.origin)}
                className="w-full py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,192,0,0.1)', color: '#FFC000', border: '1px solid rgba(255,192,0,0.3)' }}>
                Inviter une amie (1 essai offert)
              </button>
              <button onClick={() => setResultImage(null)}
                className="w-full py-2 rounded-xl text-sm text-gray-400 border border-gray-600">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Labels */}
      {page === 0 && (
        <div className="flex gap-2">
          {['Le Choix Ideal', 'Le Style Structurant', 'La Tendance'].map((label, i) => (
            <div key={i} className="flex-1 text-center py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(201,150,58,0.1)', color: '#C9963A', border: '1px solid rgba(201,150,58,0.2)' }}>
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Cartes styles */}
      {shuffledStyles.slice(page * 3, page * 3 + 3).map((style, index) => {
        const imgSrc    = style.generatedImage || style.image || `/styles/${style.localImage}`;
        const isLoading = loadingIdx === index;

        return (
          <motion.div key={style.id || index}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#3a2118] rounded-2xl shadow-lg overflow-hidden">
            <div className="relative">
              <img src={imgSrc} alt={style.name}
                className="w-full h-80 object-cover"
                onError={(e) => { e.target.src = "/styles/napi1.jpg"; }}/>
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                <div className="bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-semibold">
                  {style.matchScore ? `${style.matchScore}% match` : '+100 vues'}
                </div>
                {page === 0 && (
                  <div className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(44,26,14,0.85)', color: '#E8B96A', backdropFilter: 'blur(8px)' }}>
                    {index === 0 ? 'Le Choix Ideal' : index === 1 ? 'Le Style Structurant' : 'La Tendance'}
                  </div>
                )}
              </div>
              {!hasCredits() && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
                  <div className="text-center">
                    <p className="text-3xl">🔒</p>
                    <p className="text-white text-xs font-semibold mt-1">Essai virtuel</p>
                    <p className="text-yellow-400 text-xs">1 credit</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <h3 className="text-white text-lg font-semibold">{style.name}</h3>
              <p className="text-sm text-gray-300">
                {style.description || "Style tendance adapte a ton visage"}
              </p>
              <div className="flex gap-2 flex-wrap">
                {(style.tags || ["Moderne", "Chic", "Populaire"]).slice(0,3).map((tag, i) => (
                  <span key={i} className="bg-[#5a3225] text-xs px-3 py-1 rounded-full text-white">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Message incitatif */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background:'rgba(201,150,58,0.15)', border:'2px solid rgba(201,150,58,0.4)' }}>
                <span className="text-xl">🪞</span>
                <p className="font-semibold text-sm" style={{ color:'#FAF4EC' }}>
                  {!hasCredits()
                    ? "Ne prends plus de risques - achete un pack pour te voir transformee !"
                    : hasPaidCredits()
                    ? "Imagine-toi avec cette tresse... Visualise le rendu avant d'aller au salon !"
                    : "Tes credits gratuits sont pour decouvrir les styles. Achete un pack pour te voir transformee !"}
                </p>
              </div>

              <button
                onClick={() => handleTryStyle(style, index)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm mt-2 transition-all"
                style={{
                  background: !hasCredits()
                    ? '#5a3225'
                    : hasPaidCredits()
                    ? (isLoading ? '#a08000' : '#FFC000')
                    : 'rgba(92,51,23,0.6)',
                  color: !hasCredits() ? '#FFC000' : hasPaidCredits() ? '#000' : '#E8B96A',
                  border: hasPaidCredits() && hasCredits() ? 'none' : '1px solid rgba(255,192,0,0.4)',
                }}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Transformation...
                  </span>
                ) : !hasCredits()
                  ? "Plus de credits"
                  : hasPaidCredits()
                  ? "Me transformer"
                  : "Essayer sur moi"
                }
              </button>
            </div>
          </motion.div>
        );
      })}

      {/* Navigation */}
      <div className="flex gap-3 mt-2">
        <button onClick={() => navigate('/camera')}
          className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ border:'1px solid rgba(255,192,0,0.3)', color:'#FFC000', background:'rgba(255,192,0,0.05)' }}>
          Nouveau selfie
        </button>
        {shuffledStyles.length > (page + 1) * 3 && (
          <button
            onClick={() => { setPage(p => p + 1); setResultImage(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#FFC000', color: '#000' }}>
            3 styles suivants
          </button>
        )}
        {page > 0 && shuffledStyles.length <= (page + 1) * 3 && (
          <button
            onClick={() => { setPage(0); setResultImage(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ border:'1px solid rgba(255,192,0,0.3)', color:'#FFC000' }}>
            Revoir les premiers
          </button>
        )}
      </div>
    </div>
  );
}

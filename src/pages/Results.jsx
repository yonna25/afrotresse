import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, hasCredits, useOneTest } from "../services/credits.js";

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles]           = useState([]);
  const [faceShape, setFaceShape]     = useState('oval');
  const [selfieUrl, setSelfieUrl]     = useState(null);
  const [loadingIdx, setLoadingIdx]   = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isFallback, setIsFallback]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");
  const [credits, setCredits]         = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem('afrotresse_results');
    if (raw) {
      const parsed = JSON.parse(raw);
      setStyles(parsed.recommendations || []);
      setFaceShape(parsed.faceShape || 'oval');
    }
    const photo = sessionStorage.getItem('afrotresse_photo');
    if (photo) setSelfieUrl(photo);
    setCredits(getCredits());
  }, []);

  const handleTryStyle = async (style, index) => {
    // ── Vérifier les crédits ──
    if (!hasCredits()) {
      navigate('/credits');
      return;
    }

    setErrorMsg("");
    setResultImage(null);
    setIsFallback(false);
    setLoadingIdx(index);

    // Consommer 1 crédit
    useOneTest();
    setCredits(getCredits());

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

      setResultImage(data.imageUrl);
      setIsFallback(data.fallback || false);

    } catch (err) {
      console.error(err);
      setErrorMsg("Connexion impossible. Réessaie.");
    } finally {
      setLoadingIdx(null);
    }
  };

  if (!styles.length) return (
    <div className="min-h-screen bg-[#2b1810] flex items-center justify-center">
      <p className="text-white text-center px-4">
        Aucun résultat.<br/>
        <button onClick={() => navigate('/camera')} className="mt-4 text-yellow-400 underline">
          Prendre un selfie
        </button>
      </p>
    </div>
  );

  return (
    <div className="px-4 py-6 space-y-6 bg-[#2b1810] min-h-screen pb-28">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-[#3a2118] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 className="text-white text-xl font-semibold">Tes résultats</h2>
        </div>
        {/* Badge crédits */}
        <button onClick={() => navigate('/credits')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background:'rgba(255,192,0,0.15)', border:'1px solid rgba(255,192,0,0.3)' }}>
          <span className="text-yellow-400 font-bold text-sm">{credits}</span>
          <span className="text-gray-400 text-xs">crédit{credits > 1 ? 's' : ''}</span>
        </button>
      </div>

      {/* Selfie miniature */}
      {selfieUrl && (
        <div className="flex items-center gap-3 bg-[#3a2118] rounded-xl p-3">
          <img src={selfieUrl} alt="Ton selfie" className="w-12 h-12 rounded-xl object-cover"/>
          <p className="text-gray-300 text-sm">Styles recommandés pour toi ✦</p>
        </div>
      )}

      {/* Message erreur */}
      {errorMsg && (
        <div className="bg-red-900 border border-red-500 text-red-200 text-sm px-4 py-3 rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Bannière freemium si 0 crédits */}
      {!hasCredits() && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 text-center"
          style={{ background: 'linear-gradient(135deg, #3a2118, #5a3225)', border: '1px solid rgba(255,192,0,0.3)' }}
        >
          <p className="text-yellow-400 font-semibold text-sm">✨ Essayage virtuel disponible</p>
          <p className="text-gray-300 text-xs mt-1">Achète des crédits pour voir ce style sur TON visage</p>
          <button onClick={() => navigate('/credits')}
            className="mt-3 px-5 py-2 rounded-full text-sm font-semibold text-black"
            style={{ background: '#FFC000' }}>
            Obtenir des crédits →
          </button>
        </motion.div>
      )}

      {/* Résultat Fal.ai */}
      <AnimatePresence>
        {resultImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-[#3a2118] rounded-2xl overflow-hidden border-2 border-yellow-400"
          >
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-yellow-400 font-semibold text-lg">
                {isFallback ? 'Style similaire 💆🏾‍♀️' : 'Ton essai virtuel ✨'}
              </h3>
              <p className="text-gray-400 text-sm">
                {isFallback ? 'Aperçu basé sur ta forme de visage' : 'Voici à quoi tu ressemblerais'}
              </p>
            </div>
            <img src={resultImage} alt="Résultat" className="w-full object-cover"/>
            <div className="p-4">
              <button onClick={() => setResultImage(null)}
                className="w-full py-2 rounded-xl text-sm text-gray-400 border border-gray-600">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cartes styles */}
      {styles.map((style, index) => {
        const imgSrc    = style.generatedImage || style.image || `/styles/${style.localImage}`;
        const isLoading = loadingIdx === index;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#3a2118] rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="relative">
              <img
                src={imgSrc}
                alt={style.name}
                className="w-full h-80 object-cover"
                onError={(e) => { e.target.src = "/styles/napi1.jpg"; }}
              />
              <div className="absolute top-3 left-3 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-semibold">
                {style.matchScore ? `${style.matchScore}% match` : '+100 vues'}
              </div>

              {/* Cadenas si 0 crédits */}
              {!hasCredits() && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
                  <div className="text-center">
                    <p className="text-3xl">🔒</p>
                    <p className="text-white text-xs font-semibold mt-1">Essai virtuel</p>
                    <p className="text-yellow-400 text-xs">1 crédit</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <h3 className="text-white text-lg font-semibold">{style.name}</h3>
              <p className="text-sm text-gray-300">
                {style.description || "Style tendance adapté à ton visage"}
              </p>
              <div className="flex gap-2 flex-wrap">
                {(style.tags || ["Moderne", "Chic", "Populaire"]).slice(0,3).map((tag, i) => (
                  <span key={i} className="bg-[#5a3225] text-xs px-3 py-1 rounded-full text-white">
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleTryStyle(style, index)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold mt-2 transition-all"
                style={{
                  background: hasCredits() ? (isLoading ? '#a08000' : '#FFC000') : '#5a3225',
                  color: hasCredits() ? '#000' : '#FFC000',
                  border: hasCredits() ? 'none' : '1px solid rgba(255,192,0,0.4)',
                }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Transformation...
                  </span>
                ) : hasCredits()
                  ? `✨ Essayer ce style (1 crédit)`
                  : `🔒 Débloquer l'essai virtuel`
                }
              </button>
            </div>
          </motion.div>
        );
      })}

      <button onClick={() => navigate('/camera')}
        className="w-full py-3 rounded-xl text-sm font-semibold text-[#FFC000] border border-[#FFC000]">
        Nouveau test
      </button>
    </div>
  );
}

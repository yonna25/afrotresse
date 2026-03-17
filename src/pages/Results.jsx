import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles]         = useState([]);
  const [selfieUrl, setSelfieUrl]   = useState(null);
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [errorMsg, setErrorMsg]     = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem('afrotresse_results');
    if (raw) {
      const parsed = JSON.parse(raw);
      setStyles(parsed.recommendations || []);
    }
    const photo = sessionStorage.getItem('afrotresse_photo');
    if (photo) setSelfieUrl(photo);
  }, []);

  const handleTryStyle = async (style, index) => {
    if (!selfieUrl) {
      setErrorMsg("Prends d'abord un selfie.");
      return;
    }
    setErrorMsg("");
    setResultImage(null);
    setLoadingIdx(index);

    try {
      // Extraire base64 depuis data URL  (ex: "data:image/jpeg;base64,/9j/...")
      const [meta, base64] = selfieUrl.split(',');
      const selfieType = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';

      // URL absolue de l'image de référence
      const styleImageUrl = style.image
        ? `${window.location.origin}${style.image}`
        : `${window.location.origin}/styles/${style.localImage}`;

      const res = await fetch('/api/falGenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selfieBase64: base64, selfieType, styleImageUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      setResultImage(data.imageUrl);

    } catch (err) {
      console.error(err);
      setErrorMsg("La génération a échoué. Réessaie.");
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
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')}
          className="w-9 h-9 rounded-full bg-[#3a2118] flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h2 className="text-white text-xl font-semibold">Tes résultats</h2>
      </div>

      {/* Selfie miniature */}
      {selfieUrl && (
        <div className="flex items-center gap-3 bg-[#3a2118] rounded-xl p-3">
          <img src={selfieUrl} alt="Ton selfie" className="w-12 h-12 rounded-xl object-cover"/>
          <p className="text-gray-300 text-sm">Styles recommandés pour toi</p>
        </div>
      )}

      {/* Message erreur */}
      {errorMsg && (
        <div className="bg-red-900 border border-red-500 text-red-200 text-sm px-4 py-3 rounded-xl">
          {errorMsg}
        </div>
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
              <h3 className="text-yellow-400 font-semibold text-lg">Ton essai virtuel ✨</h3>
              <p className="text-gray-400 text-sm">Voici à quoi tu ressemblerais</p>
            </div>
            <img src={resultImage} alt="Essai virtuel" className="w-full object-cover"/>
            <div className="p-4">
              <button onClick={() => setResultImage(null)}
                className="w-full py-2 rounded-xl text-sm text-gray-400 border border-gray-600">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cartes */}
      {styles.map((style, index) => {
        const imgSrc = style.generatedImage || style.image || `/styles/${style.localImage}`;
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
                disabled={loadingIdx !== null}
                className="w-full py-3 rounded-xl font-semibold mt-2 transition-all"
                style={{
                  background: isLoading ? '#a08000' : '#FFC000',
                  color: '#000',
                  opacity: (loadingIdx !== null && !isLoading) ? 0.5 : 1,
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
                ) : "Essayer ce style ✨"}
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

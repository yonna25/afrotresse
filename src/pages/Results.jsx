import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, syncCreditsFromServer } from "../services/credits.js";
import Seo from "../components/Seo.jsx";
import { generateStableMessage, getOrCreateSessionId } from "../services/stableMessage.js";
import { useFavorites } from "../hooks/useFavorites.js";

const STYLES_PER_PAGE = 3;

const ProtectedImg = ({ src, alt, className, onClick }) => (
  <div className="relative w-full h-full" onClick={onClick}>
    <img src={src} alt={alt} className={className} draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ userSelect: "none", WebkitUserSelect: "none" }} />
    <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
  </div>
);

export default function Results() {
  const navigate = useNavigate();
  const topRef = useRef(null);
  
  // ÉTATS ORIGINAUX RÉTABLIS
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(getCredits());
  const [zoomImage, setZoomImage] = useState(null);
  const [stableMsg, setStableMsg] = useState({ headline: "", subtext: "" });
  const [displayName, setDisplayName] = useState(localStorage.getItem("afrotresse_user_name") || "");
  const [currentPage, setCurrentPage] = useState(1);
  const { isFav, toggleFav } = useFavorites();

  // NOUVEL ÉTAT POUR LE TEST IA
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStyles(parsed.recommendations || []);
        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape, 
          sessionId: getOrCreateSessionId(), 
          name: displayName 
        }));
      } catch (e) { console.error(e); }
    }
    setSelfieUrl(sessionStorage.getItem("afrotresse_photo"));
    syncCreditsFromServer().then(setCredits);
  }, [displayName]);

  const handleTestTryOn = async (style) => {
    if (!selfieUrl) return;
    setIsTesting(true);
    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: style.name, image: selfieUrl })
      });
      const data = await res.json();
      if (data.image) setZoomImage(data.image); 
      else alert("L'IA est occupée, réessaie dans 10s.");
    } catch (err) { console.error(err); }
    finally { setIsTesting(false); }
  };

  const displayedStyles = styles.slice(0, currentPage * STYLES_PER_PAGE);

  if (!styles.length) return null;

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] p-4 pb-40">
      <Seo title="Tes résultats — AfroTresse" />
      <div ref={topRef} />

      {/* HEADER LUXE */}
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-5 rounded-[2.5rem] border border-white/10">
        <ProtectedImg src={selfieUrl} className="w-16 h-16 rounded-2xl border-2 border-[#C9963A] object-cover" />
        <div>
          <h1 className="font-bold text-xl text-[#C9963A] leading-tight">{displayName || "Reine"} ✨</h1>
          <p className="text-[10px] opacity-50 uppercase tracking-tighter">{stableMsg.headline}</p>
        </div>
      </div>

      {/* GRID DES STYLES RÉTABLIE */}
      <div className="grid grid-cols-1 gap-8">
        {displayedStyles.map((style) => (
          <div key={style.id} className="bg-[#2C1A0E] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="h-80 relative">
              <ProtectedImg 
                src={style.views?.face || `/styles/${style.id.replace(/-/g,'')}-face.webp`} 
                className="w-full h-full object-cover" 
                onClick={() => setZoomImage(style.views?.face || `/styles/${style.id.replace(/-/g,'')}-face.webp`)} 
              />
              <button onClick={() => toggleFav(style)} className="absolute top-6 right-6 p-3 bg-black/20 backdrop-blur-md rounded-full">
                {isFav(style.id) ? "❤️" : "🤍"}
              </button>
            </div>
            <div className="p-8">
              <h3 className="font-bold text-2xl mb-2">{style.name}</h3>
              <p className="text-sm opacity-50 mb-8 leading-relaxed">{style.description}</p>
              
              {/* BOUTON TEST IA INTÉGRÉ */}
              <button 
                onClick={() => handleTestTryOn(style)} 
                disabled={isTesting}
                className="w-full py-5 rounded-2xl bg-[#C9963A] text-[#1A0A00] font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isTesting ? "⏳ GÉNÉRATION EN COURS..." : "🧪 TESTER LE RENDU IA"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION RÉTABLIE */}
      {displayedStyles.length < styles.length && (
        <div className="mt-12 text-center">
          <button 
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-10 py-4 rounded-full border border-[#C9963A] text-[#C9963A] font-bold text-sm"
          >
            VOIR {Math.min(STYLES_PER_PAGE, styles.length - displayedStyles.length)} AUTRES STYLES
          </button>
        </div>
      )}

      {/* BOUTONS FLOTTANTS RÉTABLIS */}
      <div className="fixed bottom-8 left-4 right-4 flex gap-3 z-50">
        <button className="flex-1 bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-[2rem] flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold opacity-60">Mon Solde</span>
          <span className="font-black text-[#C9963A]">{credits} ✨</span>
        </button>
        <button onClick={() => navigate('/generate')} className="flex-[1.5] bg-[#C9963A] p-5 rounded-[2rem] text-[#1A0A00] font-black text-xs uppercase tracking-widest shadow-xl">
          GÉNÉRER UN STYLE ⚡
        </button>
      </div>

      {/* MODAL ZOOM RÉTABLIE AVEC FERMETURE */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setZoomImage(null)} 
            className="fixed inset-0 z-[10000] bg-black/98 flex items-center justify-center p-4 backdrop-blur-2xl"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative w-full max-w-lg">
              <img src={zoomImage} className="w-full rounded-[2.5rem] shadow-2xl border border-white/10" alt="Zoom" />
              <button className="absolute -top-12 right-0 text-white font-bold uppercase text-[10px] tracking-widest">Fermer ✕</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

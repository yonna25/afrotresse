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
  
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(getCredits());
  const [zoomImage, setZoomImage] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [stableMsg, setStableMsg] = useState({ headline: "", subtext: "" });
  const [displayName, setDisplayName] = useState(localStorage.getItem("afrotresse_user_name") || "");
  const [currentPage, setCurrentPage] = useState(1);
  const { isFav, toggleFav } = useFavorites();

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
      else alert("L'IA est en train de charger. Réessaie dans 20 secondes.");
    } catch (err) { console.error(err); }
    finally { setIsTesting(false); }
  };

  const displayedStyles = styles.slice(0, currentPage * STYLES_PER_PAGE);

  if (!styles.length) return null;

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] p-4 pb-48">
      <Seo title="Tes résultats — AfroTresse" />
      <div ref={topRef} />

      {/* HEADER LUXE */}
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-xl">
        <div className="relative w-16 h-16 shrink-0">
            <ProtectedImg src={selfieUrl} className="w-full h-full rounded-2xl border-2 border-[#C9963A] object-cover" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-[#C9963A] leading-tight">{displayName || "Reine"} ✨</h1>
          <p className="text-[10px] opacity-50 uppercase tracking-widest">{stableMsg.headline || "Analyse terminée"}</p>
        </div>
      </div>

      {/* GRID DES STYLES RÉTABLIE (CSS original) */}
      <div className="grid grid-cols-1 gap-10">
        {displayedStyles.map((style) => (
          <div key={style.id} className="bg-[#2C1A0E] rounded-[3.5rem] overflow-hidden border border-white/5 shadow-2xl relative transition-transform active:scale-[0.98]">
            <div className="h-80 relative">
              <ProtectedImg 
                src={style.views?.face || `/styles/${style.id.replace(/-/g,'')}-face.webp`} 
                className="w-full h-full object-cover" 
                onClick={() => setZoomImage(style.views?.face || `/styles/${style.id.replace(/-/g,'')}-face.webp`)} 
              />
              <button 
                onClick={() => toggleFav(style)} 
                className="absolute top-6 right-6 p-4 bg-black/30 backdrop-blur-md rounded-full border border-white/10"
              >
                {isFav(style.id) ? "❤️" : "🤍"}
              </button>
            </div>
            
            <div className="p-8">
              <h3 className="font-bold text-2xl mb-2 text-white">{style.name}</h3>
              <p className="text-sm opacity-50 mb-8 leading-relaxed font-light">{style.description}</p>
              
              {/* BOUTON TEST IA INTÉGRÉ AU DESIGN */}
              <button 
                onClick={() => handleTestTryOn(style)} 
                disabled={isTesting}
                className="w-full py-5 rounded-[1.5rem] bg-[#C9963A] text-[#1A0A00] font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {isTesting ? "⏳ GÉNÉRATION IA..." : "🧪 TESTER LE RENDU IA"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION RÉTABLIE */}
      {displayedStyles.length < styles.length && (
        <div className="mt-14 mb-10 text-center">
          <button 
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-12 py-5 rounded-full border border-[#C9963A] text-[#C9963A] font-bold text-xs uppercase tracking-widest active:bg-[#C9963A] active:text-white transition-colors"
          >
            VOIR {Math.min(STYLES_PER_PAGE, styles.length - displayedStyles.length)} AUTRES STYLES
          </button>
        </div>
      )}

      {/* BOUTONS FLOTTANTS RÉTABLIS EN BAS */}
      <div className="fixed bottom-10 left-4 right-4 flex gap-4 z-[999]">
        <button className="flex-1 bg-[#2C1A0E]/80 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] flex items-center justify-between shadow-2xl">
          <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Solde</span>
          <span className="font-black text-[#C9963A] text-lg">{credits} ✨</span>
        </button>
        <button 
          onClick={() => navigate('/generate')} 
          className="flex-[1.8] bg-[#C9963A] p-5 rounded-[2rem] text-[#1A0A00] font-black text-xs uppercase tracking-[0.15em] shadow-xl active:scale-95 transition-transform"
        >
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
            <motion.div 
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="relative w-full max-w-xl"
            >
              <img src={zoomImage} className="w-full rounded-[3rem] shadow-2xl border border-white/10" alt="Résultat" />
              <button className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-white/60 font-bold uppercase text-[10px] tracking-widest py-3 px-8 bg-white/5 rounded-full border border-white/10">
                Fermer ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

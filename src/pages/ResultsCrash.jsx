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
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(getCredits());
  const [zoomImage, setZoomImage] = useState(null);
  const [isTesting, setIsTesting] = useState(false); 
  const [stableMsg, setStableMsg] = useState({ headline: "Tes résultats ✨", subtext: "" });
  const [displayName, setDisplayName] = useState(localStorage.getItem("afrotresse_user_name") || "");
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
      } catch (e) { console.error("Erreur parsing:", e); }
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
        body: JSON.stringify({ 
          prompt: `Hairstyle: ${style.name}, luxury style`, 
          image: selfieUrl 
        })
      });
      const data = await res.json();
      if (data.image) {
        setZoomImage(data.image); 
      } else {
        alert("L'IA se réveille, réessaie dans quelques secondes.");
      }
    } catch (err) {
      console.error("Erreur API:", err);
    } finally {
      setIsTesting(false);
    }
  };

  if (!styles.length) return null;

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] p-4 pb-32">
      <Seo title="Tes résultats — AfroTresse" />
      
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/10 shadow-2xl">
        <ProtectedImg src={selfieUrl} className="w-16 h-16 rounded-xl border-2 border-[#C9963A] object-cover" />
        <h1 className="font-bold text-xl text-[#C9963A]">{displayName || "Reine"} ✨</h1>
      </div>

      <div className="flex flex-col gap-8">
        {styles.slice(0, STYLES_PER_PAGE).map((style) => (
          <div key={style.id} className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-[#C9963A]/20 shadow-2xl transition-transform active:scale-[0.98]">
            <div className="h-72">
              <ProtectedImg 
                src={style.views?.face || `/styles/${style.id.replace(/-/g,'')}-face.webp`} 
                className="w-full h-full object-cover" 
                onClick={() => setZoomImage(style.views?.face || `/styles/${style.id.replace(/-/g,'')}-face.webp`)} 
              />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-xl">{style.name}</h3>
                <button onClick={() => toggleFav(style)} className="text-xl">
                  {isFav(style.id) ? "❤️" : "🤍"}
                </button>
              </div>
              
              <button 
                onClick={() => handleTestTryOn(style)} 
                disabled={isTesting}
                className="w-full py-4 rounded-2xl bg-[#C9963A]/10 border border-[#C9963A]/30 text-[#C9963A] font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isTesting ? "⏳ GÉNÉRATION IA..." : "🧪 TESTER LE RENDU IA"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setZoomImage(null)} 
            className="fixed inset-0 z-[10000] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative">
              <img src={zoomImage} className="max-w-full max-h-[85vh] rounded-3xl border border-white/10 shadow-2xl" alt="Résultat IA" />
              <p className="text-center text-white/40 text-[10px] mt-4 uppercase tracking-widest">Cliquer pour fermer</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, syncCreditsFromServer } from "../services/credits.js";
import Seo from "../components/Seo.jsx";
import {
  generateStableMessage,
  getOrCreateSessionId,
} from "../services/stableMessage.js";
import { useFavorites } from "../hooks/useFavorites.js";

const STYLES_PER_PAGE = 3;

const ProtectedImg = ({ src, alt, className, onClick }) => (
  <div className="relative w-full h-full" onClick={onClick}>
    <img src={src} alt={alt} className={className}
      draggable={false} onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: "none", WebkitUserSelect: "none" }} />
    <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
  </div>
);

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [stableMsg, setStableMsg] = useState({ headline: "", subtext: "" });
  
  // TECHNIQUE : On récupère le selfie en priorité, sinon on cherche dans le backup local
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_photo_backup");

  const { isFav, toggleFav } = useFavorites();
  const [currentPage, setCurrentPage] = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));
  const topRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStyles(parsed.recommendations || []);
        
        // TECHNIQUE : On crée le backup pour la survie des images
        if (sessionStorage.getItem("afrotresse_photo")) {
          localStorage.setItem("afrotresse_photo_backup", sessionStorage.getItem("afrotresse_photo"));
        }

        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape || "oval", 
          sessionId: getOrCreateSessionId(),
          name: localStorage.getItem("afrotresse_user_name") || ""
        }));
      } catch (e) { console.error(e); }
    }
    syncCreditsFromServer().then(c => setCredits(c));
  }, []);

  // ÉTAT ZÉRO : Si aucune donnée, redirection vers le début du tunnel
  if (!selfieUrl || styles.length === 0) {
    return (
      <div className="min-h-screen bg-[#1A0A00] flex flex-col items-center justify-center p-6 text-center">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl mb-4">👑</motion.div>
        <h2 className="text-[#C9963A] font-bold text-xl mb-4">Tes styles parfaits t'attendent</h2>
        <button onClick={() => navigate("/camera")} className="bg-[#C9963A] text-[#2C1A0E] px-8 py-3 rounded-full font-bold">📸 Prendre mon selfie</button>
      </div>
    );
  }

  const displayedStyles = styles.slice((currentPage - 1) * STYLES_PER_PAGE, currentPage * STYLES_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] p-4 pb-32">
      <div ref={topRef} />
      <Seo title="Résultats" />

      {/* HEADER */}
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
        <ProtectedImg src={selfieUrl} className="w-16 h-16 rounded-2xl object-cover border border-[#C9963A]" />
        <div className="flex-1">
          <h1 className="font-bold text-[#C9963A] text-sm">{stableMsg.headline}</h1>
        </div>
      </div>

      {/* GRID TECHNIQUE : Respect de ta structure d'origine */}
      <div className="space-y-8">
        {displayedStyles.map((style, idx) => (
          <div key={idx} className="bg-[#2C1A0E] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-xl">
            <div className="grid grid-cols-3 gap-1 h-72">
              <div className="col-span-2">
                <ProtectedImg src={style.views?.face} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.face)} />
              </div>
              <div className="grid grid-rows-2 gap-1">
                <ProtectedImg src={style.views?.back} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.back)} />
                <ProtectedImg src={style.views?.top} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.top)} />
              </div>
            </div>
            <div className="p-5 flex justify-between items-center">
              <h3 className="font-bold">{style.name}</h3>
              <button onClick={() => toggleFav(style)} className="text-xl">{isFav(style.id) ? "❤️" : "🤍"}</button>
            </div>
          </div>
        ))}
      </div>

      {/* BOUTON RÉDUIT : Moins de padding, texte plus petit */}
      {unlockedPages < Math.ceil(styles.length / STYLES_PER_PAGE) && (
        <div className="mt-8 px-10">
          <button 
            onClick={() => {
              consumeCredits(1).then(ok => {
                if(ok) {
                  setUnlockedPages(prev => prev + 1);
                  setCurrentPage(unlockedPages + 1);
                } else { navigate("/credits"); }
              });
            }}
            className="w-full py-3 rounded-full bg-[#C9963A] text-[#2C1A0E] font-black text-[10px] uppercase tracking-widest shadow-lg"
          >
            Voir 3 autres styles (-1cr)
          </button>
        </div>
      )}

      {/* SOLDE FLOTTANT */}
      <div className="fixed bottom-24 right-4 z-50">
        <div onClick={() => navigate("/credits")} className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-xl flex flex-col items-center justify-center shadow-xl font-black cursor-pointer">
          <span className="text-[6px] uppercase opacity-60">Solde</span>
          <span className="text-lg leading-none">{credits}</span>
        </div>
      </div>

      {/* MODAL ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur flex items-center justify-center p-4">
            <ProtectedImg src={zoomImage} className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

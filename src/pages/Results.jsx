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
      style={{ userSelect: "none", WebkitUserSelect: "none" }} 
      onError={(e) => { e.target.src = "/logo.png"; e.target.className += " opacity-20"; }} />
    <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
  </div>
);

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [stableMsg, setStableMsg] = useState({ headline: "", subtext: "" });
  
  // TECHNIQUE : Sécurité de persistance
  const [selfieUrl, setSelfieUrl] = useState(
    sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_photo_persist")
  );

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
        
        // TECHNIQUE : Sauvegarde miroir pour éviter la perte au refresh
        if (sessionStorage.getItem("afrotresse_photo")) {
          localStorage.setItem("afrotresse_photo_persist", sessionStorage.getItem("afrotresse_photo"));
        }

        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape || "oval", 
          sessionId: getOrCreateSessionId(),
          name: localStorage.getItem("afrotresse_user_name") || ""
        }));
      } catch (e) { console.error("Erreur parsing résultats", e); }
    }
    syncCreditsFromServer().then(c => setCredits(c));
  }, []);

  // ÉTAT ZÉRO : Redirection si les données n'existent pas
  if (!selfieUrl || styles.length === 0) {
    return (
      <div className="min-h-screen bg-[#1A0A00] flex flex-col items-center justify-center p-8 text-center">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="text-6xl mb-6">👑</motion.div>
        <h2 className="text-[#C9963A] text-xl font-bold mb-2">Découvre les tresses faites pour toi 💛</h2>
        <p className="text-white/40 text-xs mb-8 max-w-[250px]">Prends un selfie pour que notre IA analyse ton visage et te propose les meilleurs styles.</p>
        <button onClick={() => navigate("/camera")} className="bg-[#C9963A] text-[#2C1A0E] px-10 py-4 rounded-2xl font-black shadow-2xl active:scale-95 transition-all">
          📸 Prendre mon selfie
        </button>
      </div>
    );
  }

  const displayedStyles = styles.slice((currentPage - 1) * STYLES_PER_PAGE, currentPage * STYLES_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] p-4 pb-32">
      <div ref={topRef} />
      <Seo title="Mes Résultats" />

      {/* HEADER : Ton design d'origine */}
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/10 shadow-lg">
        <ProtectedImg src={selfieUrl} className="w-16 h-16 rounded-2xl object-cover border border-[#C9963A]" />
        <div className="flex-1">
          <h1 className="font-bold text-[#C9963A] text-sm leading-tight">{stableMsg.headline}</h1>
          <p className="text-[10px] opacity-40 uppercase mt-0.5 tracking-tighter">Analyse terminée</p>
        </div>
      </div>

      {/* GRID : Ton design d'origine préservé */}
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
            <div className="p-5 flex justify-between items-center bg-[#2C1A0E]">
              <h3 className="font-bold text-lg">{style.name}</h3>
              <button onClick={() => toggleFav(style)} className="text-xl active:scale-90 transition-transform">
                {isFav(style.id) ? "❤️" : "🤍"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOUTON RÉDUIT : Technique uniquement */}
      {unlockedPages < Math.ceil(styles.length / STYLES_PER_PAGE) && (
        <div className="mt-8 px-14">
          <button 
            onClick={async () => {
              const ok = await consumeCredits(1);
              if (ok) {
                setUnlockedPages(p => p + 1);
                setCurrentPage(unlockedPages + 1);
                setCredits(getCredits());
                topRef.current?.scrollIntoView({ behavior: "smooth" });
              } else { navigate("/credits"); }
            }}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#2C1A0E] font-black text-[10px] uppercase tracking-widest shadow-xl"
          >
            Voir 3 autres styles (-1cr)
          </button>
        </div>
      )}

      {/* SOLDE FLOTTANT */}
      <div className="fixed bottom-24 right-4 z-50">
        <div onClick={() => navigate("/credits")} className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-xl flex flex-col items-center justify-center shadow-2xl cursor-pointer">
          <span className="text-[5px] font-black uppercase opacity-60 leading-none">Solde</span>
          <span className="text-lg font-black leading-none">{credits}</span>
        </div>
      </div>

      {/* ZOOM MODAL */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <ProtectedImg src={zoomImage} className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

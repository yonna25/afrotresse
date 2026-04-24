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

// ─── Composant Image Sécurisé ─────────────────────────────────────────────
const ProtectedImg = ({ src, alt, className, onClick }) => {
  const [error, setError] = useState(false);
  
  // TECHNIQUE : Si l'URL est morte ou absente, on affiche un fallback discret
  const imageSrc = error || !src ? "/logo.png" : src;

  return (
    <div className="relative w-full h-full overflow-hidden" onClick={onClick}>
      <img 
        src={imageSrc} 
        alt={alt} 
        className={`${className} ${error || !src ? 'opacity-20 grayscale p-10' : ''}`}
        onError={() => setError(true)}
        draggable={false} 
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: "none", WebkitUserSelect: "none" }} 
      />
      <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
    </div>
  );
};

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [stableMsg, setStableMsg] = useState({ headline: "", subtext: "" });
  
  // TECHNIQUE : Persistance hybride (Session + Local) pour éviter la perte au refresh
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || localStorage.getItem("afrotresse_photo_persist");

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
        
        // TECHNIQUE : On sauvegarde en local pour la survie des URLs
        if (sessionStorage.getItem("afrotresse_photo")) {
          localStorage.setItem("afrotresse_photo_persist", sessionStorage.getItem("afrotresse_photo"));
        }

        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape || "oval", 
          sessionId: getOrCreateSessionId(),
          name: localStorage.getItem("afrotresse_user_name") || ""
        }));
      } catch (e) { console.error("Erreur technique de parsing", e); }
    }
    syncCreditsFromServer().then(c => setCredits(c));
  }, []);

  const handleGenerateMore = async () => {
    if (credits <= 0) { navigate("/credits"); return; }
    const ok = await consumeCredits(1);
    if (ok) {
      const next = unlockedPages + 1;
      setUnlockedPages(next);
      setCurrentPage(next);
      localStorage.setItem("afrotresse_unlocked_pages", String(next));
      setCredits(getCredits());
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ─── ÉTAT ZÉRO (DESIGN COURONNE) ──────────────────────────────────────────
  if (!styles.length || !selfieUrl) {
    return (
      <div className="min-h-[100dvh] bg-[#1A0A00] flex flex-col items-center justify-center p-8 text-center">
        <Seo title="Découvre tes styles" />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} 
          transition={{ repeat: Infinity, duration: 4 }}
          className="text-6xl mb-6"
        >
          👑
        </motion.div>
        <h2 className="text-[#C9963A] text-2xl font-black mb-2">Tes styles parfaits t'attendent</h2>
        <p className="text-[#FAF4EC] opacity-40 text-xs mb-10 max-w-[260px]">
          Analyse ton visage pour découvrir les tresses qui te sublimeront.
        </p>
        
        <div className="w-full max-w-xs flex flex-col gap-3 mb-12">
          {["📸 Selfie", "🔍 Analyse IA", "✨ Styles personnalisés"].map((text, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-[#FAF4EC] font-bold text-sm text-left flex items-center gap-4">
              <span className="text-[#C9963A]">{i + 1}</span> {text}
            </div>
          ))}
        </div>

        <button 
          onClick={() => navigate("/camera")} 
          className="w-full max-w-xs py-5 rounded-2xl bg-[#C9963A] text-[#2C1A0E] font-black text-lg shadow-2xl active:scale-95 transition-all"
        >
          📸 Prendre mon selfie
        </button>
      </div>
    );
  }

  const displayedStyles = styles.slice((currentPage - 1) * STYLES_PER_PAGE, currentPage * STYLES_PER_PAGE);

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 pb-40 relative">
      <div ref={topRef} />
      <Seo title="Mes Styles" />
      
      {/* HEADER PREMIUM */}
      <div className="mb-10 flex items-center gap-4 bg-white/5 p-4 rounded-[2.5rem] border border-white/10 shadow-xl">
        <ProtectedImg src={selfieUrl} className="w-16 h-16 rounded-2xl object-cover border border-[#C9963A]" />
        <div className="flex-1">
          <h1 className="font-bold text-[#C9963A] text-sm leading-tight">{stableMsg.headline}</h1>
          <p className="text-[10px] opacity-40 uppercase tracking-tighter mt-1">Styles recommandés</p>
        </div>
      </div>

      {/* GRILLE TECHNIQUE (GRID 3 COLONNES) */}
      <div className="flex flex-col gap-10">
        {displayedStyles.map((style, idx) => (
          <div key={idx} className="bg-[#2C1A0E] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="grid grid-cols-3 gap-1 h-72 bg-black/20">
              {/* TECHNIQUE : Utilisation du Optional Chaining ?. pour éviter les crashs */}
              <div className="col-span-2">
                <ProtectedImg src={style.views?.face} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.face)} />
              </div>
              <div className="grid grid-rows-2 gap-1">
                <ProtectedImg src={style.views?.back} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.back)} />
                <ProtectedImg src={style.views?.top} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.top)} />
              </div>
            </div>
            <div className="p-6 flex justify-between items-center bg-[#2C1A0E]">
              <h3 className="font-bold text-lg">{style.name}</h3>
              <button onClick={() => toggleFav(style)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl active:scale-90 transition-transform">
                {isFav(style.id) ? "❤️" : "🤍"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* BOUTON VOIR PLUS (DESIGN RÉDUIT) */}
      {unlockedPages < Math.ceil(styles.length / STYLES_PER_PAGE) && (
        <div className="mt-12 px-12">
          <button 
            onClick={handleGenerateMore} 
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#C9963A] to-[#F3D082] text-[#2C1A0E] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            Voir 3 autres styles (-1cr)
          </button>
        </div>
      )}

      {/* PAGINATION TECHNIQUE */}
      {unlockedPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: unlockedPages }, (_, i) => i + 1).map(p => (
            <button 
              key={p} 
              onClick={() => { setCurrentPage(p); topRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className={`w-8 h-8 rounded-full text-[10px] font-bold transition-all ${p === currentPage ? "bg-[#C9963A] text-[#2C1A0E]" : "bg-white/5 text-white/20"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* SOLDE FLOTTANT */}
      <div className="fixed bottom-24 right-4 z-50">
        <div onClick={() => navigate("/credits")} className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-xl flex flex-col items-center justify-center shadow-2xl font-black cursor-pointer active:scale-90 transition-transform">
          <span className="text-[6px] uppercase opacity-60">Solde</span>
          <span className="text-lg leading-none">{credits}</span>
        </div>
      </div>

      {/* MODAL ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setZoomImage(null)} 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6"
          >
            <ProtectedImg src={zoomImage} className="max-w-full max-h-[80vh] rounded-3xl object-contain shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

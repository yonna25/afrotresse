import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { getCredits, consumeCredits, syncCreditsFromServer } from "../services/credits.js";
import Seo from "../components/Seo.jsx";
import {
  generateStableMessage,
  getOrCreateSessionId,
  resetMessageAssignment,
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
  const location = useLocation();
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [stableMsg, setStableMsg] = useState({ headline: "", subtext: "" });
  
  // Récupération des données
  const selfieUrl = sessionStorage.getItem("afrotresse_photo");
  const rawResults = sessionStorage.getItem("afrotresse_results");

  const { isFav, toggleFav } = useFavorites();
  const [currentPage, setCurrentPage] = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10));

  const topRef = useRef(null);
  const soldeRef = useRef(null);

  useEffect(() => {
    if (location.hash === "#solde") {
      setTimeout(() => {
        soldeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 600);
    }

    if (rawResults) {
      try {
        const parsed = JSON.parse(rawResults);
        setStyles(parsed.recommendations || []);
        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape || "oval", 
          sessionId: getOrCreateSessionId(),
          name: localStorage.getItem("afrotresse_user_name") || ""
        }));
      } catch (e) { console.error("Data error", e); }
    }
    syncCreditsFromServer().then(c => setCredits(c));
  }, [location, rawResults]);

  // FONCTION NAVIGATION
  const goToPage = (page) => {
    setCurrentPage(page);
    localStorage.setItem("afrotresse_current_page", String(page));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGenerateMore = async () => {
    if (credits <= 0) { navigate("/credits#solde"); return; }
    const success = await consumeCredits(1);
    if (success) {
      const nextP = unlockedPages + 1;
      setUnlockedPages(nextP);
      setCurrentPage(nextP);
      localStorage.setItem("afrotresse_unlocked_pages", String(nextP));
      localStorage.setItem("afrotresse_current_page", String(nextP));
      setCredits(getCredits());
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ─── ÉTAT ZÉRO (Si pas de photo ou pas de résultats) ───────────────────────
  if (!selfieUrl || !rawResults) {
    return (
      <div className="min-h-[100dvh] bg-[#1A0A00] flex flex-col items-center justify-center p-8 text-center">
        <Seo title="Découvre tes styles — AfroTresse" />
        
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-6xl mb-6"
        >
          👑
        </motion.div>

        <h2 className="text-[#C9963A] text-2xl font-black mb-2">
          Découvre les tresses faites pour toi 💛
        </h2>
        <p className="text-[#FAF4EC] opacity-60 text-sm mb-10">
          Tes styles parfaits t'attendent. Suis ces étapes simples :
        </p>

        <div className="w-full max-w-xs flex flex-col gap-3 mb-12">
          {[
            { step: "📸", text: "Prends un selfie" },
            { step: "🔍", text: "Analyse par l'IA" },
            { step: "✨", text: "Styles personnalisés" }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4">
              <span className="text-xl">{item.step}</span>
              <span className="text-[#FAF4EC] font-bold text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/camera")}
          className="w-full max-w-xs py-5 rounded-full bg-[#C9963A] text-[#2C1A0E] font-black text-lg shadow-2xl shadow-[#C9963A]/20"
        >
          📸 Prendre mon selfie
        </motion.button>
      </div>
    );
  }

  // ─── AFFICHAGE DES RÉSULTATS ──────────────────────────────────────────────
  const displayedStyles = styles.slice((currentPage - 1) * STYLES_PER_PAGE, currentPage * STYLES_PER_PAGE);
  const totalPages = Math.ceil(styles.length / STYLES_PER_PAGE);

  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 pb-40 relative">
      <Seo title="Tes résultats — AfroTresse" />
      <div ref={topRef} />

      {/* HEADER MINI */}
      <div className="mb-8 flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/10">
        <ProtectedImg src={selfieUrl} className="w-14 h-14 rounded-xl object-cover border border-[#C9963A]" />
        <div className="flex-1">
          <h1 className="font-bold text-[#C9963A] text-sm leading-tight">{stableMsg.headline}</h1>
          <p className="text-[10px] opacity-50">{stableMsg.subtext}</p>
        </div>
      </div>

      {/* STYLES */}
      <div className="flex flex-col gap-6">
        {displayedStyles.map((style, idx) => (
          <div key={idx} className="bg-[#2C1A0E] rounded-[2.5rem] overflow-hidden border border-white/5">
            <div className="grid grid-cols-3 gap-0.5 h-64">
              <div className="col-span-2 overflow-hidden">
                <ProtectedImg src={style.views?.face} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.face)} />
              </div>
              <div className="grid grid-rows-2 gap-0.5">
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

      {/* BOUTON "VOIR PLUS" RÉDUIT */}
      {unlockedPages < totalPages && (
        <div className="mt-10 mb-6 px-10">
          <button 
            onClick={handleGenerateMore} 
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#C9963A] to-[#F3D082] text-[#2C1A0E] font-bold text-xs uppercase tracking-widest shadow-xl"
          >
            Voir 3 autres styles (-1cr)
          </button>
        </div>
      )}

      {/* PAGINATION */}
      {unlockedPages > 1 && (
        <div className="mt-6 flex justify-center items-center gap-4">
          <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)} className="text-[#C9963A] disabled:opacity-20 text-2xl">‹</button>
          <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex gap-3">
            {Array.from({ length: unlockedPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => goToPage(p)} className={`text-xs font-black ${p === currentPage ? "text-[#C9963A]" : "text-white/20"}`}>{p}</button>
            ))}
          </div>
          <button disabled={currentPage === unlockedPages} onClick={() => goToPage(currentPage + 1)} className="text-[#C9963A] disabled:opacity-20 text-2xl">›</button>
        </div>
      )}

      {/* SOLDE FLOTTANT */}
      <div className="fixed bottom-24 right-4 z-50">
        <div ref={soldeRef} onClick={() => navigate("/credits#solde")} className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-xl flex flex-col items-center justify-center shadow-2xl cursor-pointer">
          <span className="text-[6px] font-black uppercase opacity-60">Solde</span>
          <span className="text-lg font-black">{credits}</span>
        </div>
      </div>

      {/* ZOOM MODAL */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur flex items-center justify-center p-6">
            <ProtectedImg src={zoomImage} className="max-w-full max-h-[70vh] rounded-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeCredits, syncCreditsFromServer } from "../services/credits.js";
import Seo from "../components/Seo.jsx";
import {
  generateStableMessage,
  getOrCreateSessionId,
  resetMessageAssignment,
} from "../services/stableMessage.js";
import { useFavorites } from "../hooks/useFavorites.js";

const STYLES_PER_PAGE = 3;

// ─── ProtectedImg Corrigé ──────────────────────────────────────────────────
const ProtectedImg = ({ src, alt, className, onClick }) => {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`${className} bg-white/5 flex items-center justify-center border border-white/10 opacity-40`}>
        <span className="text-[10px]">👑</span>
      </div>
    );
  }
  return (
    <div className="relative w-full h-full" onClick={onClick}>
      <img src={src} alt={alt} className={className} onError={() => setError(true)}
        draggable={false} onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: "none", WebkitUserSelect: "none" }} />
      <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()} />
    </div>
  );
};

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [credits, setCredits] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);
  const [stableMsg, setStableMsg] = useState({ headline: "Voici tes résultats ✨", subtext: "" });
  
  // Persistance renforcée du selfie
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
        
        // Sauvegarde miroir pour éviter la page vide au refresh
        if (sessionStorage.getItem("afrotresse_photo")) {
          localStorage.setItem("afrotresse_photo_persist", sessionStorage.getItem("afrotresse_photo"));
        }

        const sessionId = getOrCreateSessionId();
        const name = localStorage.getItem("afrotresse_user_name") || "";
        setStableMsg(generateStableMessage({ 
          faceShape: parsed.faceShape || "oval", 
          sessionId, 
          name 
        }));
      } catch (e) { console.error("Parse error", e); }
    }
    syncCreditsFromServer().then(c => setCredits(c));
  }, []);

  const getPageStyles = (page) => {
    if (!styles.length) return [];
    const start = ((page - 1) * STYLES_PER_PAGE) % styles.length;
    return styles.slice(start, start + STYLES_PER_PAGE);
  };

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

  // ══════════════════════════════════════════════════════════════════════════
  // OPTION A — ÉTAT ZÉRO (AUCUN RÉSULTAT)
  // ══════════════════════════════════════════════════════════════════════════
  if (!styles.length || !selfieUrl) {
    return (
      <div className="min-h-[100dvh] bg-[#1A0A00] flex flex-col items-center justify-center p-8 text-center">
        <Seo title="Tes styles — AfroTresse" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-6">👑</motion.div>
        <h2 className="text-[#C9963A] text-2xl font-black mb-2">Découvre les tresses faites pour toi 💛</h2>
        <p className="text-white/50 text-sm mb-10">Tes styles parfaits t'attendent. Suis ces étapes :</p>
        
        <div className="w-full max-w-xs flex flex-col gap-3 mb-12">
          {[
            { i: "📸", t: "Prends un selfie", s: "Ou uploade une photo" },
            { i: "🔍", t: "Analyse par l'IA", s: "Tes proportions analysées" },
            { i: "✨", t: "Styles personnalisés", s: "Taillés pour ton visage" }
          ].map((step, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 text-left">
              <span className="text-2xl">{step.i}</span>
              <div>
                <p className="text-sm font-bold text-white">{step.t}</p>
                <p className="text-[10px] text-white/40">{step.s}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => navigate("/camera")} className="w-full max-w-xs py-5 rounded-2xl bg-[#C9963A] text-[#2C1A0E] font-black text-lg shadow-2xl">
          📸 Prendre mon selfie
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ÉCRAN RÉSULTATS ACTIFS
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-[100dvh] bg-[#1A0A00] text-[#FAF4EC] p-4 pb-40 relative">
      <div ref={topRef} />
      
      {/* HEADER ÉPURÉ */}
      <div className="mb-10 flex items-center gap-5 bg-white/5 p-5 rounded-[2.5rem] border border-white/10 shadow-xl">
        <ProtectedImg src={selfieUrl} className="w-16 h-16 rounded-2xl border-2 border-[#C9963A] object-cover" />
        <div className="flex-1">
          <h1 className="font-bold text-[#C9963A] leading-tight text-lg">{stableMsg.headline}</h1>
          <p className="text-[10px] opacity-60 mt-1">{stableMsg.subtext}</p>
        </div>
      </div>

      {/* LISTE DES STYLES */}
      <div className="flex flex-col gap-8">
        {getPageStyles(currentPage).map((style, idx) => (
          <div key={idx} className="bg-[#2C1A0E] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="grid grid-cols-3 gap-0.5 h-64 bg-black/20">
              <div className="col-span-2"><ProtectedImg src={style.views?.face} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.face)} /></div>
              <div className="grid grid-rows-2 gap-0.5">
                <ProtectedImg src={style.views?.back} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.back)} />
                <ProtectedImg src={style.views?.top} className="w-full h-full object-cover" onClick={() => setZoomImage(style.views?.top)} />
              </div>
            </div>
            <div className="p-5 flex justify-between items-center">
              <h3 className="font-bold text-lg">{style.name}</h3>
              <button onClick={() => toggleFav(style)} className="text-xl">{isFav(style.id) ? "❤️" : "🤍"}</button>
            </div>
          </div>
        ))}
      </div>

      {/* BOUTON "VOIR PLUS" RÉDUIT */}
      {unlockedPages < Math.ceil(styles.length / STYLES_PER_PAGE) && (
        <div className="mt-12 px-10">
          <button onClick={handleGenerateMore} className="w-full py-4 rounded-full bg-gradient-to-r from-[#C9963A] to-[#F3D082] text-[#2C1A0E] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            ✨ Découvrir 3 autres styles (-1cr)
          </button>
        </div>
      )}

      {/* PAGINATION */}
      {unlockedPages > 1 && (
        <div className="mt-10 flex justify-center gap-3">
          {Array.from({ length: unlockedPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => { setCurrentPage(p); topRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className={`w-10 h-10 rounded-xl font-bold text-xs ${p === currentPage ? "bg-[#C9963A] text-[#2C1A0E]" : "bg-white/5 text-white/30"}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* BOUTONS FLOTTANTS */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-3">
        <div onClick={() => navigate("/credits")} className="w-12 h-12 bg-[#C9963A] text-[#2C1A0E] rounded-xl flex flex-col items-center justify-center shadow-2xl cursor-pointer">
          <span className="text-[6px] font-black uppercase opacity-60">Solde</span>
          <span className="text-lg font-black">{credits}</span>
        </div>
      </div>

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

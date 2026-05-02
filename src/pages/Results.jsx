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

// ─── ProtectedImg ─────────────────────────────────────────────────────────────
const ProtectedImg = ({ src, alt, className, onClick }) => (
  <div className="relative w-full h-full overflow-hidden cursor-pointer" onClick={onClick}>
    <img src={src} alt={alt} className={`${className} transition-transform duration-700 hover:scale-105`}
      draggable={false} onContextMenu={(e) => e.preventDefault()} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
  </div>
);

export default function Results() {
  const navigate = useNavigate();
  const [styles, setStyles] = useState([]);
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [credits, setCredits] = useState(() => getCredits());
  const [zoomImage, setZoomImage] = useState(null);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stableMsg, setStableMsg] = useState({ headline: "", subtext: "" });
  
  // Récupération du prénom (Tania ou autre)
  const [userName] = useState(() => localStorage.getItem("afrotresse_user_name") || "Ma Reine");

  const { isFav, toggleFav } = useFavorites();
  const [currentPage, setCurrentPage] = useState(() => parseInt(localStorage.getItem("afrotresse_current_page") || "1"));
  const [unlockedPages, setUnlockedPages] = useState(() => parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1"));

  const topRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStyles(parsed.recommendations || []);
        setStableMsg(generateStableMessage({ faceShape: parsed.faceShape, sessionId: getOrCreateSessionId(), name: userName }));
      } catch (e) { console.error(e); }
    }
    setSelfieUrl(sessionStorage.getItem("afrotresse_photo"));
    syncCreditsFromServer().then(setCredits);
  }, [userName]);

  const displayedStyles = styles.slice((currentPage - 1) * STYLES_PER_PAGE, currentPage * STYLES_PER_PAGE);
  const totalPages = Math.ceil(styles.length / STYLES_PER_PAGE);
  const hasMorePages = unlockedPages < totalPages;

  const handleGenerateMore = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    if (getCredits() <= 0) { navigate("/credits"); return; }
    
    if (consumeCredits(1)) {
      const next = unlockedPages + 1;
      setUnlockedPages(next);
      setCurrentPage(next);
      localStorage.setItem("afrotresse_unlocked_pages", String(next));
      localStorage.setItem("afrotresse_current_page", String(next));
      setCredits(getCredits());
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    setIsGenerating(false);
  };

  // --- RENDU ÉTAT ZÉRO (Si pas de photo) ---
  if (styles.length === 0) {
    return (
      <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] flex flex-col relative overflow-hidden">
        <Seo title="Découvre tes styles — AfroTresse" />
        <div className="relative h-64 flex items-center justify-center" style={{ background: "linear-gradient(160deg, rgba(201,150,58,0.15) 0%, rgba(44,26,14,0.7) 100%)" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="text-6xl mb-4">👑</motion.div>
          <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-[#1A0A00] to-transparent" />
        </div>
        <div className="px-6 -mt-10 relative z-10 text-center">
          <h2 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">Ton visage, <span className="text-[#C9963A]">tes styles ✨</span></h2>
          <p className="text-sm opacity-60 mb-8 px-4 leading-relaxed">"Un selfie suffit pour trouver la coiffure qui te correspond."</p>
          <div className="space-y-4 mb-10 text-left">
            {["📸 Prends un selfie", "🔍 Analyse IA", "✨ Styles personnalisés"].map((step, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-[2rem] flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-widest">{step}</span>
                <span className="text-[#C9963A] text-[10px] font-black">0{i+1}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/camera")} className="w-full py-5 rounded-2xl font-black bg-[#C9963A] text-[#1A0A00] shadow-xl">📸 PRENDRE MON SELFIE</button>
        </div>
      </div>
    );
  }

  // --- RENDU RÉSULTATS ---
  return (
    <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] pb-40 relative">
      <Seo title="Tes résultats — AfroTresse" />
      <div ref={topRef} />

      {/* BOUTON FLOTTANT SOLDE (Corrigé avec chiffre dynamique) */}
      <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-3">
        <div onClick={() => navigate("/credits")} className="w-14 h-14 bg-[#FAF4EC] text-[#2C1A0E] rounded-2xl flex flex-col items-center justify-center shadow-2xl border border-[#C9963A]/30 cursor-pointer active:scale-95 transition-transform">
          <div className="text-[6px] font-black uppercase opacity-60 leading-none mb-1">Crédits</div>
          <div className="text-xl font-black leading-none">{credits}</div>
        </div>
      </div>

      {/* HEADER : Voici tes résultats [Prénom] */}
      <div className="p-6 pt-10">
        <div className="bg-gradient-to-br from-[#2C1A0E] to-[#1A0A00] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-center gap-5">
          <div className="relative shrink-0">
            <img src={selfieUrl} className="w-16 h-16 rounded-2xl border-2 border-[#C9963A] object-cover shadow-xl" alt="Moi" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[#C9963A] font-black text-lg leading-tight uppercase tracking-tight">
              Voici tes résultats <span className="text-white underline decoration-[#C9963A]/30">{userName}</span>
            </h1>
            <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1 font-bold">{stableMsg.headline}</p>
          </div>
        </div>
      </div>

      {/* GRILLE DE STYLES */}
      <div className="px-6 space-y-12">
        {displayedStyles.map((style) => (
          <motion.div key={style.id} className="bg-[#2C1A0E] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="grid grid-cols-3 h-72 gap-1 bg-black/40 p-1">
              <div className="col-span-2 overflow-hidden rounded-l-[2rem]">
                <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-face.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-face.webp`)} />
              </div>
              <div className="grid grid-rows-2 gap-1">
                <div className="rounded-tr-[2rem] overflow-hidden">
                  <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-back.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-back.webp`)} />
                </div>
                <div className="rounded-br-[1rem] overflow-hidden">
                  <ProtectedImg src={`/styles/${style.id.replace(/-/g,"")}-top.webp`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.id.replace(/-/g,"")}-top.webp`)} />
                </div>
              </div>
            </div>
            <div className="p-8 relative">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-2xl font-black text-white">{style.name}</h3>
                <button onClick={() => toggleFav(style)} className="p-2 bg-white/5 rounded-full">{isFav(style.id) ? "❤️" : "🤍"}</button>
              </div>
              <p className="text-xs text-white/50 leading-relaxed mb-8 line-clamp-2">{style.description}</p>
              
              {/* Bouton Essai avec Badge */}
              <button 
                onClick={() => setShowTryOnModal(true)}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 relative overflow-hidden"
              >
                <span className="text-[#C9963A] text-[10px] font-black uppercase tracking-widest italic">✨ Essai Virtuel</span>
                <span className="bg-[#C9963A] text-[#1A0A00] text-[7px] font-black px-2 py-0.5 rounded-full uppercase">Bientôt</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PAGINATION ET CTA VOIR PLUS */}
      <div className="mt-16 flex flex-col items-center px-6">
        {hasMorePages && (
          <button 
            onClick={handleGenerateMore} 
            disabled={isGenerating}
            className="w-full py-5 mb-8 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] bg-gradient-to-r from-[#C9963A] to-[#E8B96A] text-[#1A0A00] shadow-2xl active:scale-95 transition-all"
          >
            {isGenerating ? "Chargement..." : "🪄 Voir 3 autres styles"}
          </button>
        )}

        {/* Indicateurs de pages (juste en dessous du CTA) */}
        <div className="flex gap-3">
          {Array.from({ length: unlockedPages }).map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentPage(i + 1)} 
              className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${currentPage === i + 1 ? "bg-[#C9963A] text-[#1A0A00] shadow-lg scale-110" : "bg-white/5 text-white/30 border border-white/10"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* --- MODALE ZOOM IMAGE (Avec bouton fermer X) --- */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
            <button onClick={() => setZoomImage(null)} className="absolute top-10 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl z-[110]">✕</button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={zoomImage} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl" alt="Zoom" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALE ESSAI VIRTUEL (Message d'attente) --- */}
      <AnimatePresence>
        {showTryOnModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-[#FAF4EC] p-8 rounded-[2.5rem] w-full max-w-sm text-center border-2 border-[#C9963A]">
              <div className="text-4xl mb-4">🤳✨</div>
              <h3 className="text-[#2C1A0E] font-black text-xl mb-4 leading-tight uppercase italic">Le Miroir Virtuel arrive !</h3>
              <p className="text-[#2C1A0E]/60 text-sm mb-8">Nous finalisons l'IA pour que tu puisses essayer ces tresses instantanément sur ton selfie.</p>
              <button onClick={() => setShowTryOnModal(false)} className="w-full py-4 bg-[#C9963A] text-white rounded-xl font-black uppercase text-xs">J'ai hâte !</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getCredits, consumeCredits, consumeTransform, canTransform,
  addSeenStyleId, getSeenStyleIds
} from "../services/credits.js";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

// --- COMPOSANTS DE DESIGN ---

const Celebration = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 0] }}
    transition={{ duration: 2 }}
    className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-[#C9963A]/30 to-transparent" />
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: 0, x: 0, opacity: 1, scale: 0 }}
        animate={{ 
          y: (Math.random() - 0.5) * 800, 
          x: (Math.random() - 0.5) * 500, 
          opacity: 0,
          scale: Math.random() * 2 
        }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="absolute w-2 h-2 bg-[#E8B96A] rounded-full shadow-[0_0_12px_#C9963A]"
      />
    ))}
  </motion.div>
);

const IconGenerate = () => (
  <div className="relative w-6 h-6">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full opacity-80">
      <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.99 6.57 2.57L21 8M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="absolute -top-1 -right-1 text-[10px]">✨</span>
  </div>
);

// --- CONSTANTES ---

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage Ovale est parfaitement équilibré. Tout te sublime ! ✨",
  round:   "Ton visage Rond est illuminé par des styles qui allongent tes traits.",
  square:  "Tes traits sculptés sont adoucis par ces tresses volumineuses.",
  heart:   "Ton visage en Cœur est magnifié par ce volume harmonieux.",
  long:    "L'équilibre parfait pour ton visage long se trouve ici.",
  diamond: "Tes pommettes royales sont encadrées à la perfection.",
};

const PAGE_SIZE = 3;

export default function Results() {
  const navigate = useNavigate();
  const [zoomImage, setZoomImage]     = useState(null);
  const [credits, setCredits]         = useState(getCredits());
  const [loadingId, setLoadingId]     = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  
  const userName  = localStorage.getItem("afrotresse_user_name") || "Reine";
  const faceShape = localStorage.getItem("afrotresse_face_shape") || "oval";
  const selfieUrl = sessionStorage.getItem("afrotresse_photo") || "/avatar.png";

  // Gestion de la pagination et des styles
  const [pages, setPages] = useState(() => {
    const seen = getSeenStyleIds();
    const available = BRAIDS_DB
      .filter(s => s.faceShapes.includes(faceShape) && !seen.includes(s.id))
      .sort(() => 0.5 - Math.random());
    return [{ styles: available.slice(0, PAGE_SIZE) }];
  });

  const [pageIdx, setPageIdx] = useState(0);
  const currentStyles = pages[pageIdx]?.styles || [];

  const handleGetNewStyles = () => {
    if (credits < 1) { navigate("/profile"); return; }
    const usedIds = pages.flatMap(p => p.styles.map(s => s.id));
    const available = BRAIDS_DB
      .filter(s => s.faceShapes.includes(faceShape) && !usedIds.includes(s.id))
      .sort(() => 0.5 - Math.random());

    if (available.length === 0) {
      setErrorMsg("Tu as exploré tout notre catalogue ! 👑");
      return;
    }

    consumeCredits(1);
    setCredits(getCredits());
    const newPage = { styles: available.slice(0, PAGE_SIZE) };
    setPages([...pages, newPage]);
    setPageIdx(pages.length);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTryStyle = async (style) => {
    if (!canTransform()) { navigate("/profile"); return; }
    setLoadingId(style.id);
    try {
      // Simulation ou Appel API FAL AI ici
      const res = await fetch("/api/falGenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          selfieUrl, 
          styleImageUrl: window.location.origin + "/styles/" + style.image,
          faceShape 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        consumeTransform();
        setCredits(getCredits());
        setResultImage(data.imageUrl);
      }
    } catch (e) {
      setErrorMsg("Une petite erreur technique... Réessaie Reine !");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-[#FAF4EC] p-5 pb-32 font-body overflow-x-hidden">
      
      {/* HEADER ROYAL */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="mb-8 flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/10 shadow-2xl"
      >
        <div className="relative">
          <img src={selfieUrl} className="w-16 h-16 rounded-2xl border-2 border-[#C9963A] object-cover" alt="Moi" />
          <div className="absolute -bottom-1 -right-1 bg-[#C9963A] text-[#2C1A0E] text-[8px] font-black px-1.5 py-0.5 rounded-md">MOI</div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#C9963A]">Tes Résultats, {userName} ✨</h1>
          <p className="text-[10px] opacity-60 leading-tight">{FACE_SHAPE_TEXTS[faceShape]}</p>
        </div>
      </motion.header>

      {/* NOTIFICATIONS */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="mb-4 overflow-hidden">
            <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-xs text-center">{errorMsg}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RÉSULTAT IA + CÉLÉBRATION */}
      <AnimatePresence>
        {resultImage && (
          <>
            <Celebration />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="mb-10 bg-[#3D2616] rounded-[2.5rem] overflow-hidden border-2 border-[#C9963A] shadow-[0_0_40px_rgba(201,150,58,0.2)]"
            >
              <div className="p-5 flex justify-between items-center">
                <h3 className="text-[#C9963A] font-bold">Ta Transformation 👑</h3>
                <button onClick={() => setResultImage(null)} className="text-xs opacity-50">Fermer</button>
              </div>
              <img src={resultImage} alt="Transformation" className="w-full h-auto" />
              <div className="p-5">
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = resultImage; link.download = 'ma-coiffure.jpg'; link.click();
                  }}
                  className="w-full py-4 bg-[#C9963A] text-[#2C1A0E] font-black rounded-2xl shadow-lg active:scale-95 transition-transform"
                >
                  📥 SAUVEGARDER MON STYLE
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LISTE DES STYLES */}
      <div className="space-y-10">
        {currentStyles.map((style) => (
          <motion.div 
            key={style.id} layout
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#3D2616] rounded-[2.5rem] overflow-hidden border border-white/5"
          >
            {/* GRILLE D'IMAGES MULTI-VUES */}
            <div className="grid grid-cols-3 gap-0.5 h-64 cursor-pointer">
              <img src={`/styles/${style.image}`} className="col-span-2 w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.image}`)} />
              <div className="grid grid-rows-2 gap-0.5">
                <img src={`/styles/${style.views?.back || style.image}`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.views?.back || style.image}`)} />
                <img src={`/styles/${style.views?.top || style.image}`} className="w-full h-full object-cover" onClick={() => setZoomImage(`/styles/${style.views?.top || style.image}`)} />
              </div>
            </div>

            {/* INFOS & ACTION */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{style.name}</h3>
                <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full border border-white/10">~{style.duration || '4h'}</span>
              </div>
              <p className="text-[11px] opacity-60 mb-6 leading-relaxed">{style.description}</p>
              <button
                onClick={() => handleTryStyle(style)}
                disabled={loadingId === style.id}
                className="w-full py-4 rounded-2xl font-bold relative overflow-hidden group transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#C9963A,#E8B96A)", color: "#2C1A0E" }}
              >
                {loadingId === style.id ? (
                  <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity }}>Génération...</motion.span>
                ) : (
                  "Essayer virtuellement ✨"
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* PAGINATION */}
      {pages.length > 1 && (
        <div className="flex items-center justify-between mt-8 p-2 bg-white/5 rounded-2xl border border-white/5">
          <button onClick={() => setPageIdx(i => Math.max(0, i-1))} className="p-3 text-[#C9963A] disabled:opacity-20" disabled={pageIdx === 0}>← Précédent</button>
          <span className="text-xs font-bold opacity-40">{pageIdx + 1} / {pages.length}</span>
          <button onClick={() => setPageIdx(i => Math.min(pages.length-1, i+1))} className="p-3 text-[#C9963A] disabled:opacity-20" disabled={pageIdx === pages.length - 1}>Suivant →</button>
        </div>
      )}

      {/* BOUTONS FLOTTANTS ACTION (9,5/10) */}
      <div className="fixed bottom-24 right-5 z-40 flex flex-col gap-3">
        <div className="bg-[#C9963A] text-[#2C1A0E] w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shadow-xl border-2 border-[#E8B96A]/30">
          <span className="text-[7px]">SOLDE</span>
          <span className="text-xl">{credits}</span>
        </div>
        <motion.button 
          whileTap={{ scale: 0.9 }} onClick={handleGetNewStyles}
          className="w-14 h-14 rounded-2xl bg-[#2C1A0E] border-2 border-[#C9963A] flex flex-col items-center justify-center shadow-xl"
        >
          <IconGenerate />
          <span className="text-[7px] text-[#C9963A] font-black mt-1">+3 STYLES</span>
        </motion.button>
      </div>

      {/* LIGHTBOX ZOOM */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl">
            <motion.img layoutId={zoomImage} src={zoomImage} className="max-w-full max-h-[70vh] rounded-3xl border border-white/10" alt="Zoom" />
            <button onClick={() => setZoomImage(null)} className="mt-10 px-8 py-4 bg-white/10 rounded-2xl font-bold">✕ Fermer</button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

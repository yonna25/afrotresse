import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, consumeTransform, consumeCredits, hasCredits, canTransform, addSeenStyleId, PRICING } from "../services/credits.js";
import OptimizedImage from "../components/OptimizedImage.jsx";

const FACE_SHAPE_TEXTS = {
oval:    "Ton visage est de forme Ovale. C'est une structure très équilibrée qui s'adapte à presque tous les styles.",
round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes sont parfaites.",
square:  "Ton visage est de forme Carrée. Les tresses avec du volume adoucissent ta mâchoire.",
heart:   "Ton visage est en forme de Cœur. Les tresses avec du volume en bas équilibrent ton menton.",
long:    "Ton visage est de forme Longue. Les tresses latérales créent l'harmonie parfaite.",
diamond: "Ton visage est de forme Diamant. Les tresses qui encadrent le visage te subliment.",
};

const WAITING_MSGS = [
"Préparation de ton nouveau look... ✨",
"On ajuste la tresse à ton visage... 👑",
"Presque là... Prépare-toi à briller ! 😍",
];

const RESULT_MSGS = [
"Waouh 😍, tu es splendide !",
"Regarde cette Reine ! ✨",
"Le style parfait pour toi. 👑",
];

const STYLES_PER_PAGE = 3;

const ProtectedImg = ({ src, alt, className, onClick }) => (

  <div className="relative w-full h-full" onClick={onClick}>  
    <img  
      src={src}  
      alt={alt}  
      className={className}  
      draggable={false}  
      onContextMenu={(e) => e.preventDefault()}  
      style={{ userSelect: "none", WebkitUserSelect: "none" }}  
    />  
    <div  
      className="absolute inset-0"  
      onContextMenu={(e) => e.preventDefault()}  
      onDragStart={(e) => e.preventDefault()}  
    />  
  </div>  
);  // ─── Pop-up félicitation crédit (local à cette page) ────────────────────────
function CreditSuccessPopup({ data, onClose }) {
useEffect(() => {
const t = setTimeout(onClose, 4000);
return () => clearTimeout(t);
}, [onClose]);

return (
<motion.div
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
className="fixed inset-0 z-[200] flex items-center justify-center px-6"
style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
onClick={onClose}
>
<motion.div
initial={{ scale: 0.8, y: 40, opacity: 0 }}
animate={{ scale: 1, y: 0, opacity: 1 }}
exit={{ scale: 0.8, y: 40, opacity: 0 }}
transition={{ type: "spring", stiffness: 260, damping: 22 }}
className="w-full max-w-sm rounded-[2.5rem] p-8 text-center relative overflow-hidden"
style={{
background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
border: "2px solid #C9963A",
boxShadow: "0 0 60px rgba(201,150,58,0.4)",
}}
onClick={(e) => e.stopPropagation()}
>
{/* Particules */}
<div className="absolute inset-0 overflow-hidden pointer-events-none">
{["✨","💎","👑","⭐","✨","💛","👑","💎"].map((emoji, i) => (
<motion.div
key={i}
className="absolute text-lg"
style={{ left: ${10 + i * 11}% }}
initial={{ opacity: 0, y: 60 }}
animate={{ opacity: [0, 1, 0], y: -80 }}
transition={{ delay: i * 0.15, duration: 1.8, repeat: Infinity, repeatDelay: 1.5 }}
>
{emoji}
</motion.div>
))}
</div>

<motion.div  
      initial={{ scale: 0 }}  
      animate={{ scale: [0, 1.2, 1] }}  
      transition={{ delay: 0.1, duration: 0.5 }}  
      className="text-6xl mb-4"  
    >  
      💎  
    </motion.div>  

    <h2 className="text-2xl font-black text-[#C9963A] mb-1">  
      Félicitations {data.userName} ! 🎉  
    </h2>  

    <motion.p  
      initial={{ opacity: 0, y: 10 }}  
      animate={{ opacity: 1, y: 0 }}  
      transition={{ delay: 0.3 }}  
      className="text-4xl font-black text-white my-4"  
    >  
      +{data.credits} crédits  
    </motion.p>  

    <p className="text-sm text-white/60 mb-2">  
      Pack <span className="text-[#C9963A] font-bold">{data.label}</span> activé !  
    </p>  
    <p className="text-xs text-white/40 mb-6">  
      Solde : <span className="text-white font-bold">{getCredits()} crédits</span>  
    </p>  

    <motion.div className="h-1 rounded-full bg-[#C9963A]/30 overflow-hidden mb-5">  
      <motion.div  
        className="h-full bg-[#C9963A] rounded-full"  
        initial={{ width: "100%" }}  
        animate={{ width: "0%" }}  
        transition={{ duration: 4, ease: "linear" }}  
      />  
    </motion.div>  

    <button  
      onClick={onClose}  
      className="w-full py-4 rounded-2xl font-black text-[#1A0A00] text-base"  
      style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}  
    >  
      Continuer ✨  
    </button>  
  </motion.div>  
</motion.div>

);
}

// ─── Feu d'artifice canvas DOUX ─────────────────────────────────────────────
function Fireworks({ onDone }) {
const canvasRef = useRef(null);

useEffect(() => {
const canvas = canvasRef.current;
if (!canvas) return;
const ctx = canvas.getContext("2d");
const W = canvas.width  = window.innerWidth;
const H = canvas.height = window.innerHeight;

const COLORS = ["#C9963A","#E8B96A","#FAF4EC","#FFD700"];  

class Particle {  
  constructor(x, y) {  
    this.x = x; this.y = y;  
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];  
    const angle = Math.random() * Math.PI * 2;  
    const speed = Math.random() * 3 + 1;  
    this.vx = Math.cos(angle) * speed;  
    this.vy = Math.sin(angle) * speed;  
    this.life = 1;  
    this.decay = Math.random() * 0.012 + 0.006;  
    this.size = Math.random() * 2 + 0.8;  
    this.trail = Math.random() > 0.5;  
  }  
  update() {  
    this.x += this.vx; this.y += this.vy;  
    this.vy += 0.05; this.vx *= 0.98;  
    this.life -= this.decay;  
  }  
  draw() {  
    ctx.globalAlpha = Math.max(0, this.life);  
    ctx.fillStyle = this.color;  
    ctx.beginPath();  
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);  
    ctx.fill();  
    if (this.trail) {  
      ctx.globalAlpha = Math.max(0, this.life * 0.3);  
      ctx.beginPath();  
      ctx.arc(this.x - this.vx * 2, this.y - this.vy * 2, this.size * 0.6, 0, Math.PI * 2);  
      ctx.fill();  
    }  
  }  
}  

const particles = [];  
const BURSTS = [  
  { x: W * 0.2,  y: H * 0.28, delay: 0   },  
  { x: W * 0.8,  y: H * 0.22, delay: 100 },  
  { x: W * 0.5,  y: H * 0.15, delay: 200 },  
  { x: W * 0.15, y: H * 0.5,  delay: 300 },  
  { x: W * 0.85, y: H * 0.42, delay: 400 },  
  { x: W * 0.5,  y: H * 0.38, delay: 500 },  
];  

const timers = BURSTS.map(b =>  
  setTimeout(() => {  
    for (let i = 0; i < 40; i++) particles.push(new Particle(b.x, b.y));  
  }, b.delay)  
);  

let animId;  
let finished = false;  
const animate = () => {  
  ctx.clearRect(0, 0, W, H);  
  for (let i = particles.length - 1; i >= 0; i--) {  
    particles[i].update();  
    particles[i].draw();  
    if (particles[i].life <= 0) particles.splice(i, 1);  
  }  
  ctx.globalAlpha = 1;  
  if (particles.length > 0 || !finished) {  
    animId = requestAnimationFrame(animate);  
  } else {  
    onDone?.();  
  }  
};  
animate();  
const doneTimer = setTimeout(() => { finished = true; }, 4000);  

return () => {  
  timers.forEach(clearTimeout);  
  clearTimeout(doneTimer);  
  cancelAnimationFrame(animId);  
};

}, [onDone]);

return (
<canvas
ref={canvasRef}
className="fixed inset-0 pointer-events-none"
style={{ zIndex: 9999, width: "100%", height: "100%" }}
/>
);
}

// ────────────────────────────────────────────────────────────────────────────

export default function Results() {
const navigate = useNavigate();
const [faceShape, setFaceShape] = useState("oval");
const [selfieUrl, setSelfieUrl] = useState(null);
const [styles, setStyles] = useState([]);
const [loadingIdx, setLoadingIdx] = useState(null);
const [resultImage, setResultImage] = useState(null);
const [resultMsg, setResultMsg] = useState("");
const [errorMsg, setErrorMsg] = useState("");
const [credits, setCredits] = useState(0);
const [waitingMsgIdx, setWaitingMsgIdx] = useState(0);
const [zoomImage, setZoomImage] = useState(null);
const [savesCount, setSavesCount] = useState(0);
const [creditPopup, setCreditPopup] = useState(null);
const [showVirtualTryOnModal, setShowVirtualTryOnModal] = useState(false);
const [showFireworks, setShowFireworks] = useState(false);

// ── Étape 2 : Bloc sauvegarde email uniquement ────────────────────────────────
const [saveEmail, setSaveEmail]   = useState(() => localStorage.getItem("afrotresse_email") || "");
const [saveDone, setSaveDone]     = useState(() => !!localStorage.getItem("afrotresse_email"));
const [displayName, setDisplayName] = useState(() => localStorage.getItem("afrotresse_user_name") || "");
const [saveOpen, setSaveOpen]     = useState(() => !localStorage.getItem("afrotresse_email"));

// ── Étape 4 : Favoris volatils — max 3 gratuits ────────────────────────────
const FREE_FAV_LIMIT = 3;
const [favorites, setFavorites] = useState(() => {
try { return JSON.parse(sessionStorage.getItem("afrotresse_session_favs") || "[]"); }
catch { return []; }
});

// ── Pagination — persistée dans localStorage ───────────────────────────
const [currentPage, setCurrentPage] = useState(() => {
return parseInt(localStorage.getItem("afrotresse_current_page") || "1", 10);
});
const [unlockedPages, setUnlockedPages] = useState(() => {
return parseInt(localStorage.getItem("afrotresse_unlocked_pages") || "1", 10);
});

// ── Vues et likes par style (persistés) ─────────────────────────────────
const [styleStats, setStyleStats] = useState(() => {
try {
return JSON.parse(localStorage.getItem("afrotresse_style_stats") || "{}");
} catch { return {}; }
});

const resultRef = useRef(null);
const errorRef = useRef(null);
const waitingIntervalRef = useRef(null);
const topRef = useRef(null);

const userName = localStorage.getItem("afrotresse_user_name") || "Reine";

useEffect(() => {
const raw = sessionStorage.getItem("afrotresse_results");
if (raw) {
try {
const parsed = JSON.parse(raw);
setFaceShape(parsed.faceShape || "oval");
const recs = parsed.recommendations || [];
setStyles(recs);

// Fireworks SEULEMENT si afrotresse_fresh_results = "1"  
    const isFresh = sessionStorage.getItem("afrotresse_fresh_results") === "1";  
    if (recs.length > 0 && isFresh) {  
      setShowFireworks(true);  
      sessionStorage.removeItem("afrotresse_fresh_results");  
    }  

    // Initialiser les stats (vues/likes) pour chaque style si pas encore fait  
    setStyleStats(prev => {  
      const next = { ...prev };  
      let changed = false;  
      recs.forEach(s => {  
        if (!next[s.id]) {  
          next[s.id] = {  
            views: Math.floor(Math.random() * 3000) + 800,  
            likes: Math.floor(Math.random() * 1200) + 200,  
          };  
          changed = true;  
        }  
      });  
      if (changed) localStorage.setItem("afrotresse_style_stats", JSON.stringify(next));  
      return next;  
    });  
  } catch (e) {  
    console.error("Error parsing results:", e);  
  }  
}  
const photo = sessionStorage.getItem("afrotresse_photo");  
if (photo) setSelfieUrl(photo);  
setCredits(getCredits());

}, []);

// ── Incrémenter vues toutes les 8s, likes toutes les 20s ─────────────────
useEffect(() => {
const viewInterval = setInterval(() => {
setStyleStats(prev => {
const next = { ...prev };
Object.keys(next).forEach(id => {
next[id] = { ...next[id], views: next[id].views + Math.floor(Math.random() * 3) + 1 };
});
localStorage.setItem("afrotresse_style_stats", JSON.stringify(next));
return next;
});
}, 8000);

const likeInterval = setInterval(() => {  
  setStyleStats(prev => {  
    const next = { ...prev };  
    // Incrémenter 1 style aléatoire  
    const ids = Object.keys(next);  
    if (ids.length > 0) {  
      const id = ids[Math.floor(Math.random() * ids.length)];  
      next[id] = { ...next[id], likes: next[id].likes + 1 };  
    }  
    localStorage.setItem("afrotresse_style_stats", JSON.stringify(next));  
    return next;  
  });  
}, 20000);  

return () => { clearInterval(viewInterval); clearInterval(likeInterval); };

}, []);

// ── Polling pop-up crédit (déclenché depuis Credits.jsx) ────────────────
useEffect(() => {
const interval = setInterval(() => {
const raw = sessionStorage.getItem("afrotresse_credit_success");
if (raw) {
try {
const data = JSON.parse(raw);
sessionStorage.removeItem("afrotresse_credit_success");
setCredits(getCredits());
setCreditPopup(data);
} catch (e) {}
}
}, 500);
return () => clearInterval(interval);
}, []);

// ── Pagination helpers — ZÉRO DOUBLON GARANTI ───────────────────────────
// On mélange UNE FOIS la liste complète avec un seed fixe (basé sur userName)
// puis chaque page prend une tranche de 3 styles strictement distincts.
// Si on dépasse la liste, on refait un mélange avec un seed différent.
const getShuffledStyles = (shuffleSeed) => {
const seeded = (seed) => {
let s = seed;
return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
};
const rand = seeded(shuffleSeed);
const arr = [...styles];
for (let i = arr.length - 1; i > 0; i--) {
const j = Math.floor(rand() * (i + 1));
[arr[i], arr[j]] = [arr[j], arr[i]];
}
return arr;
};

const getPageStyles = (page) => {
const total = styles.length;
if (total === 0) return [];

// Seed de base basé sur le userName pour être stable au reload  
const baseSeed = userName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 12345);  

// Quelle "série" de mélange ? (tous les N pages on recrée un mélange différent)  
const stylesPerShuffle = Math.floor(total / STYLES_PER_PAGE) * STYLES_PER_PAGE || STYLES_PER_PAGE;  
const shuffleIndex = Math.floor(((page - 1) * STYLES_PER_PAGE) / stylesPerShuffle);  
const positionInShuffle = ((page - 1) * STYLES_PER_PAGE) % stylesPerShuffle;  

const shuffled = getShuffledStyles(baseSeed + shuffleIndex * 9973);  
const result = [];  
for (let i = 0; i < STYLES_PER_PAGE; i++) {  
  result.push(shuffled[(positionInShuffle + i) % total]);  
}  
return result;

};

const displayedStyles = getPageStyles(currentPage);

const goToPage = (page) => {
setCurrentPage(page);
localStorage.setItem("afrotresse_current_page", String(page));
topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
};

// Générer une nouvelle page de styles (coûte 1 crédit)
const handleGenerateMore = () => {
if (!hasCredits()) {
navigate("/credits");
return;
}
consumeCredits(1);
setCredits(getCredits());
const nextPage = unlockedPages + 1;
setUnlockedPages(nextPage);
setCurrentPage(nextPage);
localStorage.setItem("afrotresse_unlocked_pages", String(nextPage));
localStorage.setItem("afrotresse_current_page", String(nextPage));
topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const handleTransform = async (style, index) => {
if (!hasCredits() || !canTransform()) {
navigate("/credits");
return;
}
setErrorMsg("");
setResultImage(null);
setLoadingIdx(index);
setWaitingMsgIdx(0);
setResultMsg("");

let idx = 0;  
waitingIntervalRef.current = setInterval(() => {  
  idx = (idx + 1) % WAITING_MSGS.length;  
  setWaitingMsgIdx(idx);  
}, 3000);  

try {  
  const selfieBase64 = selfieUrl?.split(",")[1] || null;  
  const selfieType = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";  
  const styleKey = style.id?.replace(/-/g, "") || style.id;  
  const refImage = `${window.location.origin}/styles/${styleKey}-top.jpg`;  

  const res = await fetch("/api/falGenerate", {  
    method: "POST",  
    headers: { "Content-Type": "application/json" },  
    body: JSON.stringify({ selfieBase64, selfieType, styleImageUrl: refImage, faceShape, styleId: style.id }),  
  });  

  const data = await res.json();  
  clearInterval(waitingIntervalRef.current);  

  if (!res.ok || !data.imageUrl) {  
    setErrorMsg(data?.error || "Génération échouée. Réessaie.");  
    setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);  
    return;  
  }  

  consumeTransform();  
  addSeenStyleId(style.id);  
  setCredits(getCredits());  
  // Incrémenter le compteur styles générés (affiché sur Profil)  
  const prev = parseInt(localStorage.getItem("afrotresse_styles_generated") || "0", 10);  
  localStorage.setItem("afrotresse_styles_generated", String(prev + 1));  
  setResultImage(data.imageUrl);  
  setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);  
  setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 400);  
} catch {  
  clearInterval(waitingIntervalRef.current);  
  setErrorMsg("Connexion impossible. Réessaie.");  
  setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);  
} finally {  
  setLoadingIdx(null);  
}

};

const handleShare = async (text, url) => {
try {
if (navigator.share) {
await navigator.share({ title: "AfroTresse", text, url: url || window.location.href });
} else {
await navigator.clipboard.writeText(text);
alert("Lien copié !");
}
} catch (e) {}
};

const handleSaveProfile = () => {
if (!saveEmail.trim()) return;
localStorage.setItem("afrotresse_email", saveEmail.trim());
setSaveDone(true);
setSaveOpen(false);
};

// ── Favoris volatils ───────────────────────────────────────────────────────
const isFav = (styleId) => favorites.some(f => f === styleId);

const handleToggleFav = (style) => {
const alreadyFav = isFav(style.id);
if (alreadyFav) {
const updated = favorites.filter(f => f !== style.id);
setFavorites(updated);
sessionStorage.setItem("afrotresse_session_favs", JSON.stringify(updated));
// Sync Library
const saved = JSON.parse(localStorage.getItem("afrotresse_saved_styles") || "[]");
localStorage.setItem("afrotresse_saved_styles", JSON.stringify(saved.filter(s => s.id !== style.id)));
return;
}
const creditsFree = !localStorage.getItem("afrotresse_email");
if (creditsFree && favorites.length >= FREE_FAV_LIMIT) {
setErrorMsg("💎 Limite de 3 favoris gratuits atteinte — sauvegarde ton compte pour en ajouter plus !");
setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
return;
}
const updated = [...favorites, style.id];
setFavorites(updated);
sessionStorage.setItem("afrotresse_session_favs", JSON.stringify(updated));
// Sync Library
const saved = JSON.parse(localStorage.getItem("afrotresse_saved_styles") || "[]");
if (!saved.find(s => s.id === style.id)) {
saved.push({ ...style, savedAt: new Date().toISOString() });
localS

Pas de bavardage ni d'introduction apporte la correction si c'est le bon code ou demander le fichier concerné

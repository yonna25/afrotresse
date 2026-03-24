import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getCredits, consumeAnalysis, consumeTransform,
  canAnalyze, canTransform,
  addSeenStyleId, getSeenStyleIds,
  isPaidCredit, saveStyle, isStyleSaved
} from "../services/credits.js";
import { addShare } from "../services/stats.js";
import EnhancedBraidCard from "../components/EnhancedBraidCard";

const FACE_SHAPE_TEXTS = {
  oval:    "Ton visage est de forme Ovale. C\u0027est une structure tres equilibree qui s\u0027adapte a presque tous les styles. Pour accentuer ton regard, les tresses degagees vers l\u0027arriere sont ideales.",
  round:   "Ton visage est de forme Ronde. Pour allonger et affiner visuellement tes traits, les tresses hautes et les styles verticaux sont parfaits pour toi.",
  square:  "Ton visage est de forme Carree. Les tresses avec du volume sur les cotes adoucissent ta machoire et creent une harmonie naturelle.",
  heart:   "Ton visage est en forme de Coeur. Les tresses avec du volume en bas equilibrent ton menton et mettent en valeur tes pommettes.",
  long:    "Ton visage est de forme Longue. Les tresses laterales et les styles avec du volume sur les cotes creent l\u0027harmonie parfaite pour toi.",
  diamond: "Ton visage est de forme Diamant. Tes pommettes sont ton atout majeur. Les tresses qui encadrent le visage te subliment naturellement.",
}

const KEY_SESSION_HISTORY = "afrotresse_session_history"

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getSessionHistory() {
  try {
    const raw = sessionStorage.getItem(KEY_SESSION_HISTORY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function pushSessionHistory(entry) {
  try {
    const hist = getSessionHistory()
    const last = hist[hist.length - 1]
    if (last && last.ts === entry.ts) return
    hist.push(entry)
    sessionStorage.setItem(KEY_SESSION_HISTORY, JSON.stringify(hist))
  } catch {}
}

export default function Results() {
  const navigate = useNavigate();

  const [shuffledStyles, setShuffledStyles] = useState([]);
  const [page, setPage]                     = useState(0);
  const [faceShape, setFaceShape]           = useState("oval");
  const [faceShapeName, setFaceShapeName]   = useState("");
  const [selfieUrl, setSelfieUrl]           = useState(null);
  const [loadingIdx, setLoadingIdx]         = useState(null);
  const [resultImage, setResultImage]       = useState(null);
  const [resultStyleId, setResultStyleId]   = useState(null);
  const [isFallback, setIsFallback]         = useState(false);
  const [errorMsg, setErrorMsg]             = useState("");
  const [credits, setCredits]               = useState(0);
  const [resultMsg, setResultMsg]           = useState("");
  const [savedMap, setSavedMap]             = useState({});
  const [sessionHistory, setSessionHistory] = useState([]);
  const [historyIdx, setHistoryIdx]         = useState(-1);

  const resultRef          = useRef(null);
  const waitingIntervalRef = useRef(null);

  const RESULT_MSGS = [
    "Waouh \uD83D\uDE0D, tu es splendide !",
    "Regarde cette Reine ! \u2728",
    "Le style parfait pour toi. \uD83D\uDC51",
  ];

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      const parsed   = JSON.parse(raw);
      const recs     = parsed.recommendations || [];
      const seen     = getSeenStyleIds();
      const filtered = recs.filter(r => !seen.includes(r.id));
      const shuffled = shuffleArray(filtered);

      setShuffledStyles(shuffled);
      setFaceShape(parsed.faceShape || "oval");
      setFaceShapeName(parsed.faceShapeName || "");

      const entry = {
        ts:            Date.now(),
        faceShape:     parsed.faceShape || "oval",
        faceShapeName: parsed.faceShapeName || "",
        shuffled,
      };
      pushSessionHistory(entry);
      setSessionHistory(getSessionHistory());

      const map = {};
      shuffled.forEach(s => { map[s.id] = isStyleSaved(s.id) });
      setSavedMap(map);
    }
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    setCredits(getCredits());
  }, []);

  const handleSaveStyle = (style) => {
    if (!isPaidCredit()) return;
    const ok = saveStyle(style);
    if (ok) setSavedMap(prev => ({ ...prev, [style.id]: true }));
  };

  const totalHistory = sessionHistory.length;
  const totalPages   = Math.ceil(shuffledStyles.length / 3) || 1;
  const historyPos   = historyIdx === -1 ? totalHistory : historyIdx + 1;
  const isOnFirst    = historyIdx === 0 || (historyIdx === -1 && totalHistory <= 1);
  const isOnLatest   = historyIdx === -1;

  const loadEntry = (entry) => {
    const shuffled = entry.shuffled || shuffleArray(entry.recommendations || []);
    setShuffledStyles(shuffled);
    setFaceShape(entry.faceShape);
    setFaceShapeName(entry.faceShapeName);
    const map = {};
    shuffled.forEach(s => { map[s.id] = isStyleSaved(s.id) });
    setSavedMap(map);
    setPage(0);
    setResultImage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPrev = () => {
    const hist = getSessionHistory();
    const cur  = historyIdx === -1 ? hist.length - 1 : historyIdx;
    const prev = cur - 1;
    if (prev < 0) return;
    loadEntry(hist[prev]);
    setHistoryIdx(prev);
  };

  const goToNext = () => {
    const hist = getSessionHistory();
    const cur  = historyIdx === -1 ? hist.length - 1 : historyIdx;
    const next = cur + 1;
    if (next >= hist.length) {
      loadEntry(hist[hist.length - 1]);
      setHistoryIdx(-1);
      return;
    }
    loadEntry(hist[next]);
    setHistoryIdx(next);
  };

  const handleTryStyle = async (style, index, type = "transform") => {
    if (type === "analyze"   && !canAnalyze())  { navigate("/credits"); return; }
    if (type === "transform" && !canTransform()) { navigate("/credits"); return; }

    setErrorMsg(""); setResultImage(null); setResultStyleId(null);
    setIsFallback(false); setLoadingIdx(index); setResultMsg("");

    let idx = 0;
    waitingIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % 3;
    }, 3000);

    try {
      const selfieBase64  = selfieUrl?.split(",")[1] || null;
      const selfieType    = selfieUrl?.match(/:(.*?);/)?.[1] || "image/jpeg";
      const styleImageUrl = style.image
        ? `${window.location.origin}${style.image}`
        : `${window.location.origin}/styles/${style.localImage}`;

      const res  = await fetch("/api/falGenerate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ selfieBase64, selfieType, styleImageUrl, faceShape, styleId: style.id, type }),
      });
      const data = await res.json();
      if (res.status === 429) { setErrorMsg(data.error); return; }

      clearInterval(waitingIntervalRef.current);
      if (type === "analyze")   consumeAnalysis();
      if (type === "transform") consumeTransform();
      addSeenStyleId(style.id);
      setCredits(getCredits());
      setResultImage(data.imageUrl);
      setResultStyleId(style.id);
      setResultMsg(RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)]);
      setIsFallback(data.fallback || false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      clearInterval(waitingIntervalRef.current);
      console.error(err);
      setErrorMsg("Connexion impossible. Reessaie.");
    } finally {
      setLoadingIdx(null);
    }
  };

  const handleShare = async (text, url, styleId) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "AfroTresse", text, url: url || window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Lien copie dans le presse-papier !");
      }
      if (styleId) addShare(styleId);
    } catch {}
  };

  const faceText = FACE_SHAPE_TEXTS[faceShape] || "";

  if (!shuffledStyles.length) return (
    <div className="min-h-screen bg-[#2b1810] flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-4xl mb-4">\uD83D\uDC86\uD83C\uDFFE\u200D\u2640\uFE0F</p>
        <p className="text-white text-xl font-display font-semibold mb-2">Quelle tresse aujourd\u0027hui ?</p>
        <p className="text-gray-400 text-sm mb-6">Prends un selfie pour decouvrir les styles qui sublimeront ton visage.</p>
        <button onClick={() => navigate("/")}
          className="px-6 py-3 rounded-full font-semibold text-sm"
          style={{ background: "#FFC000", color: "#000" }}>
          Decouvrir ma tresse parfaite
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-4 py-6 space-y-5 bg-[#2b1810] min-h-screen pb-28">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-[#3a2118] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div>
            <h2 className="text-white text-xl font-semibold">Ta selection sur-mesure</h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(232,185,106,0.7)" }}>Les styles qui sublimeront naturellement tes traits.</p>
          </div>
        </div>
        <button onClick={() => navigate("/credits")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: "rgba(255,192,0,0.15)", border: "1px solid rgba(255,192,0,0.3)" }}>
          <span className="text-yellow-400 font-bold text-sm">{credits}</span>
          <span className="text-gray-400 text-xs">credit{credits > 1 ? "s" : ""}</span>
        </button>
      </div>

      {/* Navigation historique — visible si 2+ analyses dans la session */}
      {totalHistory > 1 && (
        <div className="flex items-center justify-between bg-[#3a2118] rounded-xl px-3 py-2"
          style={{ border: "1px solid rgba(201,150,58,0.3)" }}>
          <button
            onClick={goToPrev}
            disabled={isOnFirst}
            className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold disabled:opacity-30"
            style={{ color: "#FFC000", background: "rgba(255,192,0,0.12)", fontSize: 14, minWidth: 110 }}>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span>Pr\u00e9c\u00e9dent</span>
          </button>
          <span style={{ color: "rgba(232,185,106,0.9)", fontSize: 13, fontWeight: 600 }}>
            {historyPos} / {totalHistory}
          </span>
          <button
            onClick={goToNext}
            disabled={isOnLatest}
            className="flex items-center gap-1 px-3 py-2 rounded-lg font-bold disabled:opacity-30"
            style={{ color: "#FFC000", background: "rgba(255,192,0,0.12)", fontSize: 14, minWidth: 110, justifyContent: "flex-end" }}>
            <span>Suivant</span>
            <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      )}

      {/* Selfie + analyse visage */}
      {selfieUrl && (
        <div className="bg-[#3a2118] rounded-2xl p-4"
          style={{ border: "1px solid rgba(201,150,58,0.2)" }}>
          <div className="flex gap-4">
            <img src={selfieUrl} alt="Ton selfie" className="w-20 h-20 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="text-white text-sm font-semibold mb-1">
                Ton visage : <span style={{ color: "#FFC000" }}>{faceShapeName}</span>
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">{faceText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Erreur */}
      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
          <p className="text-red-200 text-sm">{errorMsg}</p>
        </motion.div>
      )}

      {/* Credits epuises */}
      {!canAnalyze() && !canTransform() && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#3a2118] rounded-2xl p-4 border-2 border-yellow-400">
          <p className="text-white font-semibold mb-2">Plus de credits gratuits \uD83D\uDCAD</p>
          <p className="text-sm text-gray-300 mb-3">Achete un pack pour continuer a explorer et transformer tes photos !</p>
          <button onClick={() => navigate("/credits")}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{ background: "#FFC000", color: "#000" }}>
            Obtenir des credits
          </button>
        </motion.div>
      )}

      {/* Resultat Fal.ai */}
      <AnimatePresence>
        {resultImage && (
          <motion.div ref={resultRef}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-[#3a2118] rounded-2xl overflow-hidden border-2 border-yellow-400">
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-yellow-400 font-bold text-xl">
                {isFallback ? "Style similaire pour toi" : (resultMsg || "Magnifique !")}
              </h3>
              <p className="text-sm mt-1 font-medium" style={{ color: "#FAF4EC" }}>
                {isFallback
                  ? "Apercu base sur ta forme de visage - essaie un vrai selfie pour plus de precision"
                  : "Ce style te met vraiment en valeur. Montre-le a ta coiffeuse !"}
              </p>
            </div>
            <img src={resultImage} alt="Resultat" className="w-full object-cover"/>
            <div className="p-4 space-y-2">
              <button
                onClick={() => handleShare("Regarde le style que j\u0027ai choisi avec AfroTresse !", resultImage, resultStyleId)}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ background: "#FFC000", color: "#000" }}>
                Envoyer a ma coiffeuse
              </button>
              <button
                onClick={() => handleShare("Rejoins AfroTresse et trouve ta tresse parfaite !", window.location.origin, resultStyleId)}
                className="w-full py-2 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,192,0,0.1)", color: "#FFC000", border: "1px solid rgba(255,192,0,0.3)" }}>
                Inviter une amie (1 essai offert)
              </button>
              <button onClick={() => setResultImage(null)}
                className="w-full py-2 rounded-xl text-sm text-gray-400 border border-gray-600">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Labels page 0 */}
      {page === 0 && (
        <div className="flex gap-2">
          {["Le Choix Id\u00e9al", "Le Style Structurant", "La Tendance"].map((label, i) => (
            <div key={i} className="flex-1 text-center py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(201,150,58,0.1)", color: "#C9963A", border: "1px solid rgba(201,150,58,0.2)" }}>
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Cartes styles */}
      {shuffledStyles.slice(page * 3, page * 3 + 3).map((style, index) => (
        <div key={style.id || index}>
          <EnhancedBraidCard
            braid={style}
            index={index}
            onTryStyle={handleTryStyle}
            isLoading={loadingIdx === index}
            canAnalyze={canAnalyze()}
            canTransform={canTransform()}
            credits={credits}
          />

          {/* Bouton Sauvegarder — credits payants uniquement */}
          {isPaidCredit() && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
              <button
                onClick={() => handleSaveStyle(style)}
                disabled={savedMap[style.id]}
                className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background: savedMap[style.id] ? "rgba(201,150,58,0.06)" : "rgba(201,150,58,0.14)",
                  color:  "#C9963A",
                  border: "1px solid rgba(201,150,58,0.3)",
                }}>
                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14 }}
                  fill={savedMap[style.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {savedMap[style.id] ? "Style sauvegard\u00e9" : "Sauvegarder ce style"}
              </button>
            </motion.div>
          )}
        </div>
      ))}

      {/* Pagination styles — visible si plusieurs pages */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            onClick={() => { setPage(p => p - 1); setResultImage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-30"
            style={{ color: "#FFC000", background: "rgba(255,192,0,0.1)", border: "1px solid rgba(255,192,0,0.25)" }}>
            &laquo; Retour
          </button>
          <span style={{ color: "rgba(232,185,106,0.8)", fontSize: 13, fontWeight: 600 }}>
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => { setPage(p => p + 1); setResultImage(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-30"
            style={{ color: "#FFC000", background: "rgba(255,192,0,0.1)", border: "1px solid rgba(255,192,0,0.25)" }}>
            Suite &raquo;
          </button>
        </div>
      )}

    </div>
  );
}

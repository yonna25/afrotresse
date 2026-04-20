import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { analyzeFace } from "../services/faceAnalysis.js";
import { consumeAnalysis } from "../services/credits.js";
import Seo from "../components/Seo.jsx";

const STEPS = [
  "Analyse des traits uniques...",
  "Étude de la structure osseuse...",
  "Calcul des proportions idéales...",
  "Sélection des tresses royales..."
];

// DEBUG : affiche le vrai message d'erreur
function getErrorMessage(err) {
  const msg = err?.message || "";
  if (msg.includes("No credits") || msg.includes("crédits"))
    return { title: "Plus de crédits 📛", body: "Tu as utilisé tes analyses gratuites.", cta: "Obtenir des crédits", route: "/credits" };
  if (msg.includes("429") || msg.includes("Trop de requêtes"))
    return { title: "Doucement 😊", body: "Attends quelques secondes avant de réessayer.", cta: "Réessayer", route: "/camera" };
  if (msg.includes("déjà effectuée") || msg.includes("409") || msg.includes("déjà traitée"))
    return { title: "Analyse déjà faite 👑", body: "Tu as déjà analysé cette photo dans cette session.", cta: "Voir mes résultats", route: "/results" };
  if (msg.includes("visage") || msg.includes("détecter"))
    return { title: "Visage non détecté 📸", body: "Reprends un selfie bien éclairé, de face.", cta: "Reprendre une photo", route: "/camera" };
  if (msg.includes("Timeout") || msg.includes("connexion") || msg.includes("réseau"))
    return { title: "Connexion lente 📡", body: "Vérifie ta connexion et réessaie.", cta: "Réessayer", route: "/camera" };
  // FALLBACK DEBUG : affiche le vrai message d'erreur
  return { title: "Erreur (debug)", body: msg || "Erreur inconnue", cta: "Réessayer", route: "/camera" };
}

export default function Analyze() {
  const navigate   = useNavigate();
  const [progress, setProgress]       = useState(0);
  const [stepIdx, setStepIdx]         = useState(0);
  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("afrotresse_user_name") || ""
  );
  const [errorState, setErrorState]   = useState(null);

  // Formulaire 60%
  const [showForm, setShowForm]   = useState(false);
  const [formDone, setFormDone]   = useState(
    () => !!localStorage.getItem("afrotresse_email")
  );
  const [prenom, setPrenom] = useState(
    () => localStorage.getItem("afrotresse_user_name") || ""
  );
  const [readyMsg, setReadyMsg]   = useState(false);
  // Flag : l'analyse est terminée, on peut naviguer dès que la barre est à 100%
  const readyRef = useRef(false);
  const formShownRef = useRef(false);

  const selfieUrl = sessionStorage.getItem("afrotresse_photo");

  // Déclencher le formulaire à 50%
  useEffect(() => {
    if (progress >= 50 && !formShownRef.current && !formDone) {
      formShownRef.current = true;
      setShowForm(true);
    }
  }, [progress, formDone]);

  const handleFormSubmit = () => {
    const name = prenom.trim();
    if (name) {
      localStorage.setItem("afrotresse_user_name", name);
      setDisplayName(name);
    }
    setFormDone(true);
    setShowForm(false);
  };


  // Ref pour détecter si l'utilisatrice est en train de taper
  const typingRef    = useRef(false);
  const typingTimer  = useRef(null);
  const redirectTimer = useRef(null);

  // Marquer "en train de taper" à chaque frappe
  const handlePrenomChange = (e) => {
    setPrenom(e.target.value);
    typingRef.current = true;
    clearTimeout(typingTimer.current);
    // Après 600ms sans frappe → considérée comme "terminée"
    typingTimer.current = setTimeout(() => {
      typingRef.current = false;
    }, 600);
  };

  const doRedirect = (delay) => {
    clearTimeout(redirectTimer.current);
    redirectTimer.current = setTimeout(() => {
      sessionStorage.setItem("afrotresse_trigger_fireworks", "1");
      navigate("/results");
    }, delay);
  };

  // À 100% : gestion intelligente du timing
  useEffect(() => {
    if (progress !== 100) return;

    // Sauvegarder le prénom s'il a été tapé
    const name = prenom.trim();
    if (name) {
      localStorage.setItem("afrotresse_user_name", name);
      setDisplayName(name);
    }

    setShowForm(false);
    setFormDone(true);
    setReadyMsg(true);

    if (!showForm) {
      // Formulaire jamais apparu ou déjà fermé → 2s
      doRedirect(2000);
    } else if (typingRef.current) {
      // En train de taper → attendre 3.5s max
      doRedirect(3500);
    } else if (name) {
      // Vient de taper quelque chose → 500ms
      doRedirect(500);
    } else {
      // Formulaire ouvert mais rien tapé → 2s
      doRedirect(2000);
    }

    return () => {
      clearTimeout(redirectTimer.current);
      clearTimeout(typingTimer.current);
    };
  }, [progress]); // eslint-disable-line

  useEffect(() => {
    if (!selfieUrl) { navigate("/"); return; }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        if (prev >= 95 && readyRef.current) return prev + 1;
        if (prev >= 95) return 95; // Attendre fin d'analyse
        return prev + 1;
      });
    }, 80);

    const stepInterval = setInterval(() => {
      setStepIdx(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    const run = async () => {
      try {
        const result = await analyzeFace(selfieUrl);
        // Stocker les résultats dès qu'ils arrivent
        sessionStorage.setItem("afrotresse_results", JSON.stringify(result));
        localStorage.setItem("afrotresse_face_shape", result.faceShape);
        const creditOk = await consumeAnalysis();
        if (!creditOk) {
          clearInterval(interval);
          clearInterval(stepInterval);
          navigate("/credits");
          return;
        }
        const prevTrials = parseInt(localStorage.getItem('afrotresse_ai_trials') || '0', 10);
        localStorage.setItem('afrotresse_ai_trials', String(prevTrials + 1));
        // Signaler que l'analyse est prête — la barre finira jusqu'à 100% puis naviguera
        readyRef.current = true;
      } catch (err) {
        clearInterval(interval);
        clearInterval(stepInterval);
        console.error("Analysis error:", err);
        if (err?.message?.includes("déjà effectuée")) {
          navigate("/results");
          return;
        }
        setErrorState(getErrorMessage(err));
      }
    };

    run();
    return () => { clearInterval(interval); clearInterval(stepInterval); };
  }, [navigate, selfieUrl]);

  // ── Écran erreur ────────────────────────────────────────────
  if (errorState) {
    return (
      <>
      <Seo title="AfroTresse" noindex />
      <div className="min-h-screen bg-[#2C1A0E] flex flex-col items-center justify-center p-8 text-[#FAF4EC]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm rounded-[2.5rem] p-8 text-center"
          style={{
            background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
            border: "2px solid rgba(201,150,58,0.4)",
            boxShadow: "0 0 40px rgba(0,0,0,0.5)",
          }}
        >
          <div className="text-5xl mb-4">😔</div>
          <h2 className="text-xl font-black text-[#C9963A] mb-2">{errorState.title}</h2>
          <p className="text-sm text-white/60 mb-8 leading-relaxed">{errorState.body}</p>
          <button
            onClick={() => navigate(errorState.route)}
            className="w-full py-4 rounded-2xl font-black text-[#2C1A0E] text-base"
            style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
          >
            {errorState.cta}
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 mt-2 text-sm text-white/30"
          >
            Retour à l'accueil
          </button>
        </motion.div>
      </div>
      </>
    );
  }

  // ── Écran analyse ───────────────────────────────────────────
  return (
    <>
    <Seo title="AfroTresse" noindex />
    <div className="min-h-screen bg-[#2C1A0E] flex flex-col items-center justify-center p-10 text-[#FAF4EC]">

      {/* SCANNING */}
      <div className="relative w-64 h-64 mb-12">
        <div className="relative w-full h-full rounded-full border-4 border-[#C9963A] overflow-hidden z-10 shadow-2xl">
          <img src={selfieUrl} className="w-full h-full object-cover" alt="Scan" />
          <motion.div
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-[#E8B96A] shadow-[0_0_15px_#C9963A] z-20"
          />
        </div>
      </div>

      <div className="w-full max-w-xs text-center">
        <h2 className="text-[#C9963A] font-bold text-3xl mb-2">{progress}%</h2>
        <motion.p
          key={readyMsg ? "ready" : stepIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs opacity-70 mb-8 uppercase tracking-widest"
        >
          {readyMsg ? "Résultats prêts ✨" : STEPS[stepIdx]}
        </motion.p>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-[#C9963A]" animate={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* MINI FORMULAIRE à 50% */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-8 pt-1"
            style={{ background: "linear-gradient(to top, #1A0800 80%, transparent)" }}
          >
            <div
              className="w-full max-w-sm mx-auto rounded-[2rem] p-5"
              style={{
                background: "linear-gradient(160deg, #2C1A0E 0%, #3D2616 100%)",
                border: "1.5px solid rgba(201,150,58,0.5)",
                boxShadow: "0 -8px 48px rgba(0,0,0,0.7)",
              }}
            >
              <p className="font-black text-base text-white leading-tight mb-1">
                Entre ton prénom pour découvrir des résultats personnalisés 💫
              </p>
              <p className="text-[11px] text-white/40 mb-4">
                L'analyse continue — aucun blocage.
              </p>

              <motion.div
                className="mb-3"
                animate={{ boxShadow: ["0 0 0px rgba(201,150,58,0)", "0 0 12px rgba(201,150,58,0.25)", "0 0 0px rgba(201,150,58,0)"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ borderRadius: "14px" }}
              >
                <input
                  type="text"
                  placeholder="Ton prénom"
                  value={prenom}
                  onChange={handlePrenomChange}
                  onKeyDown={e => e.key === "Enter" && handleFormSubmit()}
                  className="w-full rounded-xl text-sm font-semibold outline-none"
                  style={{
                    padding: "16px 20px",        // zone tactile généreuse
                    background: "rgba(92,51,23,0.55)",
                    border: "1px solid rgba(201,150,58,0.4)",
                    color: "#FAF4EC",
                    caretColor: "#C9963A",        // curseur doré visible
                  }}
                />
              </motion.div>

              <button
                onClick={handleFormSubmit}
                className="w-full py-3 rounded-xl font-black text-sm text-[#2C1A0E]"
                style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
              >
                Personnaliser mes résultats ✨
              </button>

              <button
                onClick={() => { setShowForm(false); setFormDone(true); }}
                className="w-full py-2 mt-1 text-xs text-center"
                style={{ color: "rgba(250,244,236,0.3)" }}
              >
                Passer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

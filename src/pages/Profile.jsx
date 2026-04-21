import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCredits, addCredits, PRICING } from "../services/credits.js";
import { getCurrentUser } from "../services/useSupabaseCredits.js";
import Seo from "../components/Seo.jsx";
import { supabase } from "../services/supabase.js";

// ── Helpers localStorage ─────────────────────────────────────────────────────
const getAiTrials = () => {
  const trials = parseInt(localStorage.getItem("afrotresse_ai_trials") || "0", 10);
  const generated = parseInt(localStorage.getItem("afrotresse_styles_generated") || "0", 10);
  return trials + generated;
};
const getReferralCode = () => {
  let code = localStorage.getItem("afrotresse_referral_code");
  if (!code) {
    code = "AFR-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    localStorage.setItem("afrotresse_referral_code", code);
  }
  return code;
};
const getReferralCount = () => parseInt(localStorage.getItem("afrotresse_referral_count") || "0", 10);
const getTotalEarned = () => {
  const referrals = parseInt(localStorage.getItem("afrotresse_referral_count") || "0", 10);
  const referralCredits = referrals * 2;
  const reviewCredits = localStorage.getItem("afrotresse_review_done") === "true" ? 2 : 0;
  const extra = parseInt(localStorage.getItem("afrotresse_credits_earned") || "0", 10);
  return referralCredits + reviewCredits + extra;
};
const getReviewDone = () => localStorage.getItem("afrotresse_review_done") === "true";
const getFavoritesCount = () => {
  try { return JSON.parse(localStorage.getItem("afrotresse_saved_styles") || "[]").length; }
  catch { return 0; }
};

export default function Profile() {
  const navigate = useNavigate();

  const [credits, setCredits] = useState(0);
  const [userName, setUserName] = useState("Ma Reine");
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [aiTrials, setAiTrials] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [reviewDone, setReviewDone] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showReferralInfo, setShowReferralInfo] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // Formulaire connexion : fermé par défaut
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    setCredits(getCredits());
    setAiTrials(getAiTrials());
    setReferralCode(getReferralCode());
    setReferralCount(getReferralCount());
    setTotalEarned(getTotalEarned());
    setReviewDone(getReviewDone());

    const savedName = localStorage.getItem("afrotresse_user_name");
    if (savedName) setUserName(savedName);

    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    setFavoritesCount(getFavoritesCount());
    // Vérifier session Supabase
    getCurrentUser().then(user => {
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email || localStorage.getItem("afrotresse_email") || "");
      } else {
        setIsLoggedIn(false);
        setUserEmail(localStorage.getItem("afrotresse_email") || "");
      }
      setIsLoadingAuth(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    showToast("👋 Déconnectée avec succès");
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // ── Partage du lien de parrainage ─────────────────────────────────────────
  const handleShare = async () => {
    const referralLink = `${window.location.origin}?ref=${referralCode}`;
    const text = `👑 Découvre AfroTresse — l'IA qui trouve tes tresses parfaites en 10 secondes ! Utilise mon code ${referralCode} et reçois ${PRICING.referral?.receiver || 2} crédits offerts 🎁\n${referralLink}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AfroTresse", text, url: referralLink });
      } else {
        await navigator.clipboard.writeText(text);
        showToast("🔗 Lien copié !");
      }
    } catch (e) {}
  };

  // ── Copier le code de parrainage ──────────────────────────────────────────
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      showToast("✅ Code copié !");
    } catch (e) {
      showToast("Code : " + referralCode);
    }
  };

  // ── Laisser un avis (+ 1 crédit, 1 seule fois) ───────────────────────────
  const handleReview = () => {
    if (reviewDone) {
      showToast("👑 Avis déjà donné — merci !");
      return;
    }
    window.open("https://afrotresse.com", "_blank");
    setTimeout(() => {
      addCredits(PRICING.reviewBonus || 1);
      setCredits(getCredits());
      localStorage.setItem("afrotresse_review_done", "true");
      setReviewDone(true);
      showToast(`✅ Merci ! +${PRICING.reviewBonus || 1} crédit offert 🎁`);
    }, 2000);
  };

  return (
    <>
      <Seo title="Mon profil — AfroTresse" noindex />
      <div className="min-h-screen bg-[#1A0A00] text-white flex flex-col items-center pb-32 relative">

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] bg-[#C9963A] text-[#1A0A00] px-5 py-3 rounded-2xl font-black text-sm shadow-2xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO — Photo + Prénom ── */}
      <div className="w-full relative">
        <div className="h-48 w-full bg-[#1A0A00]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-[#C9963A] overflow-hidden bg-[#2a1a14] shadow-2xl">
              {selfieUrl ? (
                <img src={selfieUrl} className="w-full h-full object-cover" alt="Profil"
                  draggable={false} onContextMenu={e => e.preventDefault()} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">👑</div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#C9963A] w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#1A0A00] shadow-lg">
              <span className="text-sm">👑</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prénom */}
      <div className="mt-16 flex flex-col items-center px-5 w-full">
        <h1 className="text-2xl font-black uppercase tracking-tight">{userName}</h1>
        <p className="text-[11px] text-[#C9963A] font-medium tracking-[0.2em] uppercase opacity-80 mt-0.5">
          Votre Majesté
        </p>
      </div>

      {/* ── STATUT CONNEXION ── */}
      <div className="w-full max-w-sm px-5 mt-4">
        {isLoggedIn ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{ background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.25)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">✅</span>
              <div>
                <p className="text-xs font-bold text-green-300">Connectée</p>
                <p className="text-[10px] text-white/40">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(250,244,236,0.5)" }}
            >
              Déconnexion
            </button>
          </motion.div>
        ) : (
          !isLoadingAuth && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="w-full rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(201,150,58,0.15), rgba(201,150,58,0.05))",
              border: "1.5px solid rgba(201,150,58,0.4)"
            }}
          >
            {/* Bouton toggle — toujours visible */}
            <button
              onClick={() => setShowLoginForm(prev => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🔐</span>
                <div className="text-left">
                  <p className="text-xs font-black" style={{ color: "#C9963A" }}>Se connecter</p>
                  <p className="text-[10px] text-white/40">Retrouve tes crédits et favoris</p>
                </div>
              </div>
              <motion.div animate={{ rotate: showLoginForm ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#C9963A" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </motion.div>
            </button>

            {/* Formulaire expandable */}
            <AnimatePresence>
              {showLoginForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 flex flex-col gap-2">
                    <p className="text-[11px] text-white/40 mb-1">
                      Connecte-toi avec un lien magique envoyé par email.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        // Sauvegarder les résultats avant le redirect Magic Link
                        const keys = ['afrotresse_photo', 'afrotresse_results', 'afrotresse_trigger_fireworks'];
                        const backup = {};
                        keys.forEach(k => { const v = sessionStorage.getItem(k); if (v) backup[k] = v; });
                        localStorage.setItem('afrotresse_session_backup', JSON.stringify(backup));
                        navigate("/magic-link");
                      }}
                      className="w-full py-3 rounded-xl font-black text-sm text-[#1A0A00]"
                      style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
                    >
                      Continuer avec un lien magique ✨
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          )
        )}
      </div>

      {/* ── STATS RÉELLES ── */}
      <div className="grid grid-cols-3 w-full max-w-sm mt-6 px-5 gap-3">
        {/* Solde (Crédits) - CLIQUABLE */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/credits")}
          className="bg-[#C9963A] rounded-3xl p-4 flex flex-col items-center cursor-pointer shadow-lg"
          style={{ boxShadow: "0 0 20px rgba(201,150,58,0.3)" }}
        >
          <p className="text-2xl font-black text-[#1A0A00]">{credits}</p>
          <p className="text-[8px] uppercase font-black text-[#1A0A00]/70 tracking-widest mt-0.5">Solde</p>
          <p className="text-[7px] text-[#1A0A00]/50 mt-1">Appuie</p>
        </motion.div>

        {/* Favoris - CLIQUABLE */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/library")}
          className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center cursor-pointer"
        >
          <p className="text-2xl font-black text-[#C9963A]">{favoritesCount}</p>
          <p className="text-[8px] uppercase font-black opacity-40 tracking-widest mt-0.5">Favoris</p>
          <p className="text-[7px] text-[#C9963A]/50 mt-1">Voir</p>
        </motion.div>

        {/* Gagnés (Referral) - AFFICHAGE */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center">
          <p className="text-2xl font-black text-[#C9963A]">{totalEarned}</p>
          <p className="text-[8px] uppercase font-black opacity-40 tracking-widest mt-0.5">Gagnés</p>
          <p className="text-[7px] opacity-30 mt-1">Par parrainage</p>
        </div>
      </div>

      {/* ── ACTIONS PRINCIPALES ── */}
      <div className="w-full max-w-sm px-5 mt-6 flex flex-col gap-3">

        {/* Recharger les crédits */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/credits")}
          className="w-full py-4 rounded-2xl font-black text-base text-[#1A0A00] flex items-center justify-between px-5 shadow-xl"
          style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
        >
          <span>💳 Recharger mes crédits</span>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>

        {/* Nouveau selfie */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/camera")}
          className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-between px-5 bg-white/5 border border-white/10"
        >
          <span>📸 Nouveau selfie</span>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>

        {/* Voir mes résultats */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/results")}
          className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-between px-5 bg-white/5 border border-white/10"
        >
          <span>✨ Voir mes résultats</span>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>
      </div>

      {/* ── PARRAINAGE ── */}
      <div className="w-full max-w-sm px-5 mt-6">
        <motion.div
          className="rounded-3xl overflow-hidden border border-[#C9963A]/30"
          style={{ background: "#1A0A00" }}
        >
          {/* Header parrainage */}
          <button
            onClick={() => setShowReferralInfo(!showReferralInfo)}
            className="w-full p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C9963A]/20 flex items-center justify-center text-xl">🎁</div>
              <div className="text-left">
                <p className="font-black text-sm">Parrainage</p>
                <p className="text-[10px] text-[#C9963A] font-bold">
                  {referralCount} filleule{referralCount > 1 ? "s" : ""} · +{referralCount * (PRICING.referral?.sender || 2)} crédits gagnés
                </p>
              </div>
            </div>
            <motion.div animate={{ rotate: showReferralInfo ? 90 : 0 }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </motion.div>
          </button>

          {/* Détails parrainage */}
          <AnimatePresence>
            {showReferralInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 flex flex-col gap-3">
                  {/* Explication */}
                  <div className="bg-white/5 rounded-2xl p-3 text-[11px] text-white/60 leading-relaxed">
                    Partage ton code à une amie. Elle reçoit <span className="text-[#C9963A] font-bold">+{PRICING.referral?.receiver || 2} crédits</span>, et toi <span className="text-[#C9963A] font-bold">+{PRICING.referral?.sender || 2} crédits</span> dès qu'elle s'inscrit. 👑
                  </div>

                  {/* Code unique */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/10 border border-[#C9963A]/40 rounded-xl px-4 py-3 font-black text-[#C9963A] tracking-widest text-center text-sm">
                      {referralCode}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="w-12 h-12 rounded-xl bg-[#C9963A]/20 border border-[#C9963A]/40 flex items-center justify-center text-lg active:scale-95 transition-all"
                    >
                      📋
                    </button>
                  </div>

                  {/* Filleules */}
                  <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                    <div>
                      <p className="text-xs font-black text-white">Filleules</p>
                      <p className="text-[10px] text-white/40">Amies parrainées</p>
                    </div>
                    <p className="text-2xl font-black text-[#C9963A]">{referralCount}</p>
                  </div>

                  {/* Bouton partager */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleShare}
                    className="w-full py-3.5 rounded-2xl font-black text-sm text-[#1A0A00]"
                    style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
                  >
                    Inviter une amie 💌
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── AVIS ── */}
      <div className="w-full max-w-sm px-5 mt-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleReview}
          className={`w-full rounded-3xl p-5 flex items-center justify-between border transition-all ${
            reviewDone
              ? "bg-white/5 border-white/10 opacity-50"
              : "border-[#C9963A]/30 bg-[#1A0A00]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9963A]/20 flex items-center justify-center text-xl">
              {reviewDone ? "✅" : "⭐"}
            </div>
            <div className="text-left">
              <p className="font-black text-sm">
                {reviewDone ? "Avis donné — merci !" : "Laisser un avis"}
              </p>
              <p className="text-[10px] text-[#C9963A] font-bold">
                {reviewDone ? "👑 Crédit offert" : `+${PRICING.reviewBonus || 1} crédit offert`}
              </p>
            </div>
          </div>
          {!reviewDone && (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </motion.button>
      </div>


      {/* ── FAQ ── */}
      <div className="w-full max-w-sm px-5 mt-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/faq")}
          className="w-full rounded-3xl p-5 flex items-center justify-between border border-white/10 bg-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9963A]/20 flex items-center justify-center text-xl">❓</div>
            <div className="text-left">
              <p className="font-black text-sm">FAQ — Aide & support</p>
              <p className="text-[10px] text-[#C9963A] font-bold">Crédits, connexion, parrainage…</p>
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>
      </div>

      {/* ── INFORMATIONS LÉGALES ── */}
      <div className="mt-10 pb-4 flex flex-col items-center gap-2 opacity-30">
        <div className="flex gap-4 text-[9px] font-medium uppercase tracking-tighter">
          <button onClick={() => navigate("/privacy-policy")}>Mentions Légales</button>
          <span>•</span>
          <button onClick={() => navigate("/terms-of-service")}>CGU</button>
          <span>•</span>
          <button onClick={() => navigate("/cookie-policy")}>Confidentialité</button>
        </div>
        <p className="text-[8px]">© 2026 AfroTresse — Tous droits réservés</p>
      </div>

    </div>
    </>
  );
}

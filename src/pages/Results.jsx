import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { addCredits, PRICING, getCredits } from "../services/credits.js";
import { getCurrentUser } from "../services/useSupabaseCredits.js";
import Seo from "../components/Seo.jsx";
import { supabase } from "../services/supabase.js";

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
  return (referrals * 2) + (localStorage.getItem("afrotresse_review_done") === "true" ? 2 : 0);
};
const getFavoritesCount = () => {
  try { return JSON.parse(localStorage.getItem("afrotresse_saved_styles") || "[]").length; }
  catch { return 0; }
};

export default function Profile() {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(getCredits());
  const [userName, setUserName] = useState("Ma Reine");
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [totalEarned, setTotalEarned] = useState(0);
  const [toastMsg, setToastMsg] = useState("");
  const [showReferralInfo, setShowReferralInfo] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('afrotresse_is_logged_in') === '1';
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    setReferralCode(getReferralCode());
    setTotalEarned(getTotalEarned());
    const savedName = localStorage.getItem("afrotresse_user_name");
    if (savedName) setUserName(savedName);
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
    setFavoritesCount(getFavoritesCount());

    const loadProfileData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setIsLoggedIn(true);
          localStorage.setItem('afrotresse_is_logged_in', '1');
          setUserEmail(user.email || "");

          const { data } = await supabase
            .from('usage_credits')
            .select('credits')
            .eq('user_id', user.id)
            .single();

          if (data?.credits != null) {
            localStorage.setItem("afrotresse_credits", data.credits.toString());
            setCredits(data.credits);
          } else {
            setCredits(getCredits());
          }
        } else {
          setIsLoggedIn(false);
          localStorage.removeItem('afrotresse_is_logged_in');
          setCredits(getCredits());
        }
      } catch (err) {
        console.error("Erreur:", err);
        setCredits(getCredits());
      }
    };

    loadProfileData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.setItem("afrotresse_credits", "0");
    localStorage.removeItem('afrotresse_is_logged_in');
    setIsLoggedIn(false);
    setUserEmail("");
    setCredits(0);
    showToast('\ud83d\udc4b D\u00e9connect\u00e9e');
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleShare = async () => {
    const referralLink = `${window.location.origin}?ref=${referralCode}`;
    const text = `${'👑 D\u00e9couvre AfroTresse ! Utilise mon code '}${referralCode}${' et re\u00e7ois '}${PRICING.referral?.receiver || 2}${' cr\u00e9dits offerts 🎁\n'}${referralLink}`;
    if (navigator.share) await navigator.share({ title: "AfroTresse", text, url: referralLink });
    else { await navigator.clipboard.writeText(text); showToast('🔗 Lien copi\u00e9 !'); }
  };

  return (
    <>
      <Seo title="Mon profil — AfroTresse" noindex />
      <div className="min-h-screen bg-[#1A0A00] text-white flex flex-col items-center pb-32 relative">

        <AnimatePresence>
          {toastMsg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] bg-[#C9963A] text-[#1A0A00] px-5 py-3 rounded-2xl font-black text-sm shadow-2xl">
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boutons flottants */}
        <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-3">
          <motion.div onClick={() => navigate("/credits")}
            className="w-12 h-12 bg-[#FAF4EC] text-[#2C1A0E] rounded-lg flex flex-col items-center justify-center shadow-lg border border-[#C9963A]/30 cursor-pointer">
            <div className="text-[5px] font-black uppercase opacity-60 leading-tight">Solde</div>
            <div className="text-xl font-black leading-none">{credits}</div>
          </motion.div>
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/camera")}
            className="w-12 h-12 rounded-lg flex flex-col items-center justify-center shadow-lg border border-white/10"
            style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}>
            <span className="text-[6px] font-black text-[#2C1A0E] uppercase leading-none mb-1">{'G\u00e9n\u00e9rer'}</span>
            <span className="text-xl">✨</span>
          </motion.button>
        </div>

        {/* Avatar */}
        <div className="w-full relative">
          <div className="h-48 w-full bg-[#1A0A00]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-24 h-24 rounded-full border-4 border-[#C9963A] overflow-hidden bg-[#2a1a14] shadow-2xl">
              {selfieUrl
                ? <img src={selfieUrl} className="w-full h-full object-cover" alt="Profil" />
                : <div className="w-full h-full flex items-center justify-center text-4xl">👑</div>}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center px-5 w-full">
          <h1 className="text-2xl font-black uppercase">{userName}</h1>
          <p className="text-[11px] text-[#C9963A] font-medium tracking-[0.2em] uppercase opacity-80 mt-0.5">Sublimez votre couronne</p>
        </div>

        {/* Module Connectée / Déconnectée — stable, sans spinner */}
        <div className="w-full max-w-sm px-5 mt-4">
          {isLoggedIn ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full rounded-2xl px-4 py-3 flex items-center justify-between"
              style={{ background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.25)" }}>
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-sm">✅</span>
                <div>
                  <p className="text-xs font-bold text-green-300">{'Connect\u00e9e'}</p>
                  <p className="text-[10px] text-white/40">{userEmail}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-xl bg-white/10 text-white/50">
                {'D\u00e9connexion'}
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full rounded-2xl overflow-hidden border border-[#C9963A]/40 bg-[#C9963A]/10">
              <button onClick={() => setShowLoginForm(!showLoginForm)} className="w-full px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔐</span>
                  <div className="text-left">
                    <p className="text-xs font-black text-[#C9963A]">Se connecter</p>
                    <p className="text-[10px] text-white/40">{'Retrouve tes cr\u00e9dits'}</p>
                  </div>
                </div>
                <motion.div animate={{ rotate: showLoginForm ? 90 : 0 }}>▶</motion.div>
              </button>
              <AnimatePresence>
                {showLoginForm && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-4 pb-4 overflow-hidden">
                    <button onClick={() => navigate("/magic-link")}
                      className="w-full py-3 rounded-xl font-black text-sm text-[#1A0A00] bg-[#C9963A]">
                      Continuer par Email ✨
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 w-full max-w-sm mt-6 px-5 gap-3">
          <div onClick={() => navigate("/credits")}
            className="bg-[#C9963A] rounded-3xl p-4 flex flex-col items-center shadow-lg cursor-pointer">
            <p className="text-2xl font-black text-[#1A0A00]">{credits}</p>
            <p className="text-[8px] uppercase font-black text-[#1A0A00]/70">Solde</p>
          </div>
          <div onClick={() => navigate("/library")}
            className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center cursor-pointer">
            <p className="text-2xl font-black text-[#C9963A]">{favoritesCount}</p>
            <p className="text-[8px] uppercase font-black opacity-40">Favoris</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center">
            <p className="text-2xl font-black text-[#C9963A]">{totalEarned}</p>
            <p className="text-[8px] uppercase font-black opacity-40">{'Gagn\u00e9s'}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full max-w-sm px-5 mt-6 flex flex-col gap-3">
          <button onClick={() => navigate("/credits")}
            className="w-full py-4 rounded-2xl font-black text-[#1A0A00] bg-[#C9963A] flex justify-between px-5">
            <span>💳 Recharger</span><span>→</span>
          </button>
          <button onClick={() => navigate("/camera")}
            className="w-full py-4 rounded-2xl font-black bg-white/5 border border-white/10 flex justify-between px-5">
            <span>📸 Nouveau selfie</span><span>→</span>
          </button>
          <button onClick={() => navigate("/results")}
            className="w-full py-4 rounded-2xl font-black bg-white/5 border border-white/10 flex justify-between px-5">
            <span>✨ {'R\u00e9sultats'}</span><span>→</span>
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/results")}
            className="w-full py-5 rounded-2xl font-black text-base flex items-center justify-between px-5 shadow-lg"
            style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)", color: "#1A0A00" }}>
            <span>{'✨ Voir 3 autres styles'}</span>
            <span className="text-xl">→</span>
          </motion.button>
        </div>

        {/* Parrainage */}
        <div className="w-full max-w-sm px-5 mt-6">
          <div className="rounded-3xl border border-[#C9963A]/30 bg-[#1A0A00]">
            <button onClick={() => setShowReferralInfo(!showReferralInfo)} className="w-full p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C9963A]/20 flex items-center justify-center">🎁</div>
                <div><p className="font-black text-sm">Parrainage</p></div>
              </div>
              <motion.div animate={{ rotate: showReferralInfo ? 90 : 0 }}>▶</motion.div>
            </button>
            <AnimatePresence>
              {showReferralInfo && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="px-5 pb-5 overflow-hidden flex flex-col gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center font-black text-[#C9963A] tracking-widest">{referralCode}</div>
                  <button onClick={handleShare} className="w-full py-3 rounded-2xl font-black text-[#1A0A00] bg-[#C9963A]">Inviter 💌</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* FAQ */}
        <div className="w-full max-w-sm px-5 mt-3">
          <button onClick={() => navigate("/faq")} className="w-full rounded-3xl p-5 flex justify-between border border-white/10 bg-white/5 items-center">
            <div className="flex items-center gap-3"><span>❓</span><p className="font-black text-sm text-left">Aide & Support</p></div>
            <span>→</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center gap-2 opacity-30">
          <div className="flex gap-4 text-[9px] font-medium uppercase">
            <button onClick={() => navigate("/privacy-policy")}>Mentions {'L\u00e9gales'}</button>
            <span>•</span>
            <button onClick={() => navigate("/terms-of-service")}>CGU</button>
            <span>•</span>
            <button onClick={() => navigate("/privacy-policy")}>{'Confidentialit\u00e9'}</button>
          </div>
          <p className="text-[8px] font-bold text-[#C9963A]">© 2024 AfroTresse · Fait avec amour 💛</p>
        </div>

      </div>
    </>
  );
}

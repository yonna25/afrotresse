import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getCredits,
  consumeTransform,
  consumeCredits,
  hasCredits,
  canTransform,
  addSeenStyleId
} from "../services/credits.js";

import OptimizedImage from "../components/OptimizedImage.jsx";

const STYLES_PER_PAGE = 3;

export default function Results() {
  const navigate = useNavigate();

  const [styles, setStyles] = useState([]);
  const [selfieUrl, setSelfieUrl] = useState(null);

  const [saveEmail, setSaveEmail] = useState(
    () => localStorage.getItem("afrotresse_email") || ""
  );

  const [saveDone, setSaveDone] = useState(
    () => !!localStorage.getItem("afrotresse_email")
  );

  const [savedUserName, setSavedUserName] = useState(
    () => localStorage.getItem("afrotresse_user_name") || ""
  );

  const [saveOpen, setSaveOpen] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const topRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStyles(parsed.recommendations || []);
      } catch (e) {}
    }

    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
  }, []);

  // ─────────────────────────────
  // SAUVEGARDE UTILISATEUR
  // ─────────────────────────────
  const handleSaveProfile = () => {
    if (!saveEmail.trim()) return;

    const name = saveEmail.split("@")[0];

    localStorage.setItem("afrotresse_email", saveEmail.trim());
    localStorage.setItem("afrotresse_user_name", name);

    setSavedUserName(name);
    setSaveDone(true);
    setSaveOpen(false);
  };

  const faceText = "Tes résultats personnalisés sont prêts.";

  return (
    <div className="min-h-[100dvh] bg-[#2C1A0E] text-[#FAF4EC] p-4">

      {/* ─────────────────────────────
          ALERTE : uniquement si pas sauvegardé
      ───────────────────────────── */}
      {!saveDone && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-3"
          style={{
            background: "rgba(201,150,58,0.08)",
            border: "1px solid rgba(201,150,58,0.25)"
          }}
        >
          <span className="text-lg mt-0.5">⚠️</span>
          <p className="text-[11px] text-white/60 leading-relaxed">
            <span className="text-[#C9963A] font-bold">
              Tes résultats ne sont pas sauvegardés.
            </span>{" "}
            Ajoute tes styles en favoris ou sauvegarde ton compte.
          </p>
        </motion.div>
      )}

      {/* ─────────────────────────────
          MESSAGE SUCCESS : après sauvegarde
      ───────────────────────────── */}
      {saveDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 px-4 py-3 rounded-2xl bg-green-900/20 border border-green-500/30"
        >
          <p className="text-[12px] text-green-200 font-semibold">
            Résultats sauvegardés pour{" "}
            <span className="text-white font-black">
              {savedUserName || "Reine"}
            </span>{" "}
            !
          </p>
        </motion.div>
      )}

      {/* ─────────────────────────────
          FORMULAIRE SAUVEGARDE
      ───────────────────────────── */}
      {!saveDone && (
        <div className="p-4 rounded-2xl bg-[#3D2616] border border-[#C9963A]">
          <input
            type="email"
            value={saveEmail}
            onChange={(e) => setSaveEmail(e.target.value)}
            placeholder="Ton email"
            className="w-full p-3 rounded-xl text-black mb-3"
          />

          <button
            onClick={handleSaveProfile}
            className="w-full py-3 rounded-xl font-black text-[#2C1A0E]"
            style={{
              background: "linear-gradient(135deg, #C9963A, #E8B96A)"
            }}
          >
            Sauvegarder mes résultats
          </button>
        </div>
      )}

      {/* ─────────────────────────────
          CONTENU RESULTATS (simplifié ici mais conservé)
      ───────────────────────────── */}
      <div className="mt-6 space-y-4">
        {styles.map((style, i) => (
          <div
            key={i}
            className="bg-[#3D2616] p-4 rounded-2xl border border-white/10"
          >
            <h3 className="font-bold text-[#C9963A]">
              {style.name || "Style"}
            </h3>
          </div>
        ))}
      </div>
    </div>
  );
}

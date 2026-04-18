// ─────────────────────────────────────────────────────────────────────────────
// FavoriteHeart.jsx — AfroTresse
// Icône cœur avec badge numérique animé — à poser dans la navbar
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EVENT_NAME = "afrotresse:favorites-updated";

function readCount() {
  try {
    const email = localStorage.getItem("afrotresse_email");
    let key = "afrotresse_favorites_guest";
    if (email) {
      let h = 0;
      for (let i = 0; i < email.length; i++) {
        h = Math.imul(31, h) + email.charCodeAt(i) | 0;
      }
      key = `afrotresse_favorites_user_${Math.abs(h).toString(36)}`;
    }
    return JSON.parse(localStorage.getItem(key) || "[]").length;
  } catch { return 0; }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FavoriteHeart({ onClick, className = "" }) {
  const [count, setCount]   = useState(() => readCount());
  const [bump, setBump]     = useState(false);
  const prevCountRef        = useRef(count);

  // ── Écoute les mises à jour cross-composants ─────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const newCount = e.detail.count ?? e.detail.favorites?.length ?? 0;
      if (newCount > prevCountRef.current) {
        setBump(true);
        setTimeout(() => setBump(false), 400);
      }
      prevCountRef.current = newCount;
      setCount(newCount);
    };
    window.addEventListener(EVENT_NAME, handler);
    // Sync au montage (ex : retour sur la page)
    setCount(readCount());
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center ${className}`}
      aria-label={`Favoris${count > 0 ? ` (${count})` : ""}`}>

      {/* ── Icône cœur ── */}
      <motion.svg
        animate={bump ? { scale: [1, 1.35, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill={count > 0 ? "#C9963A" : "none"}
        stroke={count > 0 ? "#C9963A" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </motion.svg>

      {/* ── Badge numérique ── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1
                       flex items-center justify-center
                       rounded-full text-[9px] font-black leading-none
                       bg-[#C9963A] text-[#2C1A0E]
                       pointer-events-none select-none"
            style={{ boxShadow: "0 0 0 1.5px #2C1A0E" }}>
            <motion.span
              key={count}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.15 }}>
              {count > 9 ? "9+" : count}
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

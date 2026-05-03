import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import { getCredits, syncCreditsFromServer } from "../services/credits.js";
import {
  generateStableMessage,
  getOrCreateSessionId,
  resetMessageAssignment,
} from "../services/stableMessage.js";
import { useFavorites } from "../hooks/useFavorites.js";

const STYLES_PER_PAGE = 3;
const MAX_UNLOCKED_PAGES = 50;

// ─────────────────────────────────────────────
// Protected Image
// ─────────────────────────────────────────────
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
);

// ─────────────────────────────────────────────
// Fireworks
// ─────────────────────────────────────────────
function Fireworks({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const W = (canvas.width = window.innerWidth);
    const H = (canvas.height = window.innerHeight);

    const colors = [
      "#C9963A",
      "#E8B96A",
      "#FFD700",
      "#FFF0C0",
      "#FFFFFF",
    ];

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 3 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.08;
        this.vx *= 0.98;
        this.life -= this.decay;
      }

      draw() {
        ctx.globalAlpha = Math.max(this.life, 0);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles = [];

    const bursts = [
      [W * 0.2, H * 0.25],
      [W * 0.8, H * 0.2],
      [W * 0.5, H * 0.15],
      [W * 0.5, H * 0.38],
    ];

    bursts.forEach(([x, y], i) => {
      setTimeout(() => {
        for (let j = 0; j < 70; j++) particles.push(new Particle(x, y));
      }, i * 250);
    });

    let finished = false;
    let anim;

    const loop = () => {
      ctx.clearRect(0, 0, W, H);

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();

        if (particles[i].life <= 0) particles.splice(i, 1);
      }

      if (!finished || particles.length > 0) {
        anim = requestAnimationFrame(loop);
      } else {
        onDone?.();
      }
    };

    loop();

    const timer = setTimeout(() => {
      finished = true;
    }, 2800);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(anim);
    };
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function Results() {
  const navigate = useNavigate();
  const topRef = useRef(null);
  const errorRef = useRef(null);

  const [styles, setStyles] = useState([]);
  const [faceShape, setFaceShape] = useState("ovale");
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [credits, setCredits] = useState(getCredits());
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showFireworks, setShowFireworks] = useState(false);
  const [showSoonModal, setShowSoonModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(
    Number(localStorage.getItem("afrotresse_current_page") || 1)
  );

  const [unlockedPages, setUnlockedPages] = useState(
    Number(localStorage.getItem("afrotresse_unlocked_pages") || 1)
  );

  const [stableMsg, setStableMsg] = useState({
    headline: "Voici tes résultats ✨",
    subtext: "",
  });

  const { isFav, toggleFav, FREE_LIMIT } = useFavorites();

  const displayName =
    localStorage.getItem("afrotresse_user_name") || "Reine";

  // ─────────────────────────────────────────────
  // Load data
  // ─────────────────────────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem("afrotresse_results");

    if (raw) {
      try {
        const parsed = JSON.parse(raw);

        setStyles(parsed.recommendations || []);
        setFaceShape(parsed.faceShape || "ovale");

        const sessionId = getOrCreateSessionId();

        setStableMsg(
          generateStableMessage({
            faceShape: parsed.faceShape,
            sessionId,
            name: displayName,
            confidence: parsed.confidence || 0.5,
          })
        );

        if (sessionStorage.getItem("afrotresse_trigger_fireworks")) {
          setShowFireworks(true);
          sessionStorage.removeItem("afrotresse_trigger_fireworks");
          resetMessageAssignment();
        }
      } catch {}
    }

    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);

    syncCreditsFromServer()
      .then((c) => setCredits(c))
      .catch(() => setCredits(getCredits()));
  }, [displayName]);

  // ─────────────────────────────────────────────
  // Pagination Styles
  // ─────────────────────────────────────────────
  const displayedStyles = useMemo(() => {
    const start = (currentPage - 1) * STYLES_PER_PAGE;
    const repeated = [...styles, ...styles, ...styles, ...styles];

    return repeated.slice(start, start + STYLES_PER_PAGE);
  }, [styles, currentPage]);

  // ─────────────────────────────────────────────
  // Generate More
  // ─────────────────────────────────────────────
  const handleGenerateMore = async () => {
    if (generating) return;

    const freshCredits = await syncCreditsFromServer().catch(() =>
      getCredits()
    );

    setCredits(freshCredits);

    if (freshCredits <= 0) {
      navigate("/credits");
      return;
    }

    setGenerating(true);

    try {
      const { getSessionIdWithFp } = await import(
        "../services/fingerprint.js"
      );

      const { getCurrentUser } = await import(
        "../services/useSupabaseCredits.js"
      );

      const sessionId = await getSessionIdWithFp();
      const user = await getCurrentUser().catch(() => null);

      const res = await fetch("/api/consume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userId: user?.id || null,
          amount: 1,
        }),
      });

      if (!res.ok || res.status === 402) {
        navigate("/credits");
        return;
      }

      const data = await res.json();
      setCredits(data.credits);

      const nextPage = Math.min(
        unlockedPages + 1,
        MAX_UNLOCKED_PAGES
      );

      setUnlockedPages(nextPage);
      setCurrentPage(nextPage);

      localStorage.setItem(
        "afrotresse_unlocked_pages",
        String(nextPage)
      );

      localStorage.setItem(
        "afrotresse_current_page",
        String(nextPage)
      );

      setShowFireworks(true);

      topRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    } catch {
      navigate("/credits");
    } finally {
      setGenerating(false);
    }
  };

  // ─────────────────────────────────────────────
  // Favorite
  // ─────────────────────────────────────────────
  const handleFav = (style) => {
    const result = toggleFav(style);

    if (
      result &&
      !result.success &&
      result.reason === "limit_reached"
    ) {
      setErrorMsg(
        `💎 Limite de ${FREE_LIMIT} favoris atteints !`
      );

      setTimeout(() => {
        errorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  };

  // ─────────────────────────────────────────────
  // EMPTY STATE
  // ─────────────────────────────────────────────
  if (!styles.length) {
    return (
      <div
        className="min-h-screen text-white px-5 pt-16 pb-10"
        style={{ background: "#2C1A0E" }}
      >
        <Seo title="Résultats - AfroTresse" />

        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 15,
            }}
            className="text-6xl"
          >
            👑
          </motion.div>

          <h1 className="text-3xl font-bold mt-4">
            Ton visage, tes styles ✨
          </h1>

          <p className="text-white/60 mt-3 text-sm">
            Trouve les coiffures faites pour toi.
          </p>
        </div>

        <div className="mt-10 space-y-4">
          {[
            "1. Fais un selfie 📸",
            "2. Analyse IA 🔍",
            "3. Reçois 3 styles ✨",
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
            >
              {item}
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/camera")}
          className="w-full mt-10 py-5 rounded-2xl font-bold text-[#2C1A0E]"
          style={{
            background:
              "linear-gradient(135deg,#C9963A,#E8B96A)",
          }}
        >
          📸 Commencer
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RESULTS
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1A0A00] text-white px-4 pt-5 pb-40 relative">
      <Seo title="Tes résultats - AfroTresse" />

      {showFireworks && (
        <Fireworks
          onDone={() => setShowFireworks(false)}
        />
      )}

      <div ref={topRef} />

      {errorMsg && (
        <div
          ref={errorRef}
          className="mb-4 bg-red-900/30 border border-red-400/30 rounded-2xl p-3 text-sm text-center"
        >
          {errorMsg}
        </div>
      )}

      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 flex gap-4 items-center mb-6">
        {selfieUrl ? (
          <img
            src={selfieUrl}
            alt=""
            className="w-20 h-20 rounded-2xl object-cover border-2 border-[#C9963A]"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-white/10" />
        )}

        <div>
          <p className="text-white/50 text-xs">
            Voici tes résultats
          </p>

          <h1 className="font-bold text-xl">
            {displayName} ✨
          </h1>

          <p className="text-[#C9963A] text-sm mt-1">
            Visage {faceShape}
          </p>

          <p className="text-white/50 text-xs mt-1">
            Styles adaptés à ta morphologie
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-7">
        {displayedStyles.map((style, index) => {
          const id = style.id?.replace(/-/g, "");
          const fav = isFav(style.id);

          return (
            <div
              key={index}
              className="rounded-3xl overflow-hidden bg-[#3D2616] border border-[#C9963A]/20"
            >
              {/* Images */}
              <div className="grid grid-cols-3 h-72 gap-[2px] bg-black/40">
                <ProtectedImg
                  src={
                    style.views?.face ||
                    `/styles/${id}-face.webp`
                  }
                  className="col-span-2 w-full h-full object-cover"
                  onClick={() =>
                    setZoomImage(
                      style.views?.face ||
                        `/styles/${id}-face.webp`
                    )
                  }
                />

                <div className="grid grid-rows-2 gap-[2px]">
                  <ProtectedImg
                    src={
                      style.views?.back ||
                      `/styles/${id}-back.webp`
                    }
                    className="w-full h-full object-cover"
                    onClick={() =>
                      setZoomImage(
                        style.views?.back ||
                          `/styles/${id}-back.webp`
                      )
                    }
                  />

                  <ProtectedImg
                    src={
                      style.views?.top ||
                      `/styles/${id}-top.webp`
                    }
                    className="w-full h-full object-cover"
                    onClick={() =>
                      setZoomImage(
                        style.views?.top ||
                          `/styles/${id}-top.webp`
                      )
                    }
                  />
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">
                    {style.name}
                  </h3>

                  <button
                    onClick={() => handleFav(style)}
                    className="w-10 h-10 rounded-full bg-white/10"
                  >
                    {fav ? "❤️" : "🤍"}
                  </button>
                </div>

                <p className="text-sm text-white/60 mt-2">
                  {style.description ||
                    "Style élégant et adapté à toi"}
                </p>

                <div className="mt-3">
                  <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
                    ⏱{" "}
                    {style.duration ||
                      style.pose_time ||
                      "3-5h"}
                  </span>
                </div>

                {/* CTA */}
                <div className="relative mt-5">
                  <div className="absolute -top-2 -right-2 text-[10px] px-2 py-1 rounded-full bg-[#C9963A] text-black font-bold">
                    Bientôt
                  </div>

                  <button
                    onClick={() =>
                      setShowSoonModal(true)
                    }
                    className="w-full py-4 rounded-2xl border border-[#C9963A]/30 bg-[#C9963A]/10"
                  >
                    Essayer virtuellement
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA More */}
      <button
        onClick={handleGenerateMore}
        disabled={generating}
        className="w-full mt-8 py-5 rounded-2xl font-bold"
        style={{
          background:
            "linear-gradient(135deg,#C9963A,#E8B96A)",
          color: "#1A0A00",
        }}
      >
        {generating
          ? "⏳ Génération..."
          : "✨ Voir 3 autres styles (1 crédit)"}
      </button>

      {/* Pagination */}
      {unlockedPages > 1 && (
        <div className="flex gap-2 justify-center mt-6 flex-wrap">
          {Array.from(
            { length: unlockedPages },
            (_, i) => i + 1
          ).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-10 h-10 rounded-xl font-bold ${
                p === currentPage
                  ? "bg-[#C9963A] text-black"
                  : "bg-white/10"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Floating Buttons */}
      <div className="fixed bottom-[88px] right-4 flex flex-col gap-2 z-50">
        <div className="w-14 h-14 rounded-xl bg-white text-black flex flex-col justify-center items-center text-xs font-bold">
          <span>Solde</span>
          <span>{credits}</span>
        </div>

        <button
          onClick={handleGenerateMore}
          disabled={generating}
          className="w-14 h-14 rounded-xl font-bold"
          style={{
            background:
              "linear-gradient(135deg,#C9963A,#E8B96A)",
            color: "#000",
          }}
        >
          ✨
        </button>
      </div>

      {/* Soon Modal */}
      <AnimatePresence>
        {showSoonModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSoonModal(false)}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center px-5"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#2C1A0E] border border-[#C9963A]/30 rounded-3xl p-7 max-w-sm w-full text-center"
            >
              <div className="text-5xl mb-4">
                ✨
              </div>

              <h2 className="text-2xl font-bold">
                Bientôt disponible
              </h2>

              <p className="text-white/60 mt-3">
                Essaie virtuellement tes futures
                coiffures sur ton selfie.
              </p>

              <button
                onClick={() =>
                  setShowSoonModal(false)
                }
                className="w-full mt-6 py-4 rounded-2xl font-bold text-black"
                style={{
                  background:
                    "linear-gradient(135deg,#C9963A,#E8B96A)",
                }}
              >
                J'ai hâte 🔥
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center px-4"
          >
            <div
              className="relative max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomImage(null)}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 border border-white/20"
              >
                ✕
              </button>

              <img
                src={zoomImage}
                alt=""
                className="rounded-3xl w-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  }

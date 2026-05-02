import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

export default function Results() {
  const navigate = useNavigate();
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    // Vérification si des résultats existent en session
    const raw = sessionStorage.getItem("afrotresse_results");
    if (raw) {
      setHasResults(true);
    }
  }, []);

  // --- ÉTAT ZÉRO : AUCUNE PHOTO / PREMIER LANCEMENT ---
  if (!hasResults) {
    return (
      <div className="min-h-screen bg-[#1A0A00] text-[#FAF4EC] flex flex-col relative overflow-hidden">
        <Seo title="Découvre tes styles — AfroTresse" />

        {/* Header avec Couronne Animée */}
        <div className="relative h-64 overflow-hidden bg-[#1A0A00] flex items-center justify-center">
          <div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(160deg, rgba(201,150,58,0.15) 0%, rgba(44,26,14,0.7) 100%)" }}
          >
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="text-6xl mb-4"
            >
              👑
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white font-black text-2xl text-center px-4 leading-tight uppercase tracking-tighter"
            >
              Ton visage,<br />
              <span className="text-[#C9963A]">tes styles ✨</span>
            </motion.p>
          </div>
          {/* Dégradé de transition vers le contenu */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#1A0A00] to-transparent" />
        </div>

        {/* Contenu Principal */}
        <div className="flex flex-col flex-1 px-6 pt-2 pb-32">
          <h2 className="text-xl font-black text-white mb-2 leading-tight">
            Découvre les tresses adaptées à ton visage 💛
          </h2>
          <p className="text-[13px] text-white/60 leading-relaxed mb-8 italic">
            "Un selfie suffit pour trouver la coiffure qui te correspond."
          </p>

          {/* Étapes numérotées en Glass Cards */}
          <div className="flex flex-col gap-4 mb-10">
            {[
              { icon: "📸", label: "Prends un selfie", sub: "Ou uploade une photo de face" },
              { icon: "🔍", label: "Analyse IA", sub: "Nous étudions tes proportions" },
              { icon: "✨", label: "Styles sur-mesure", sub: "3 recommandations uniques" },
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] px-5 py-4"
              >
                <div className="text-3xl">{step.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white uppercase tracking-wide">{step.label}</p>
                  <p className="text-[11px] text-white/40 font-medium">{step.sub}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#C9963A]/20 border border-[#C9963A]/40 flex items-center justify-center text-[#C9963A] text-xs font-black">
                  {i + 1}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bouton Doré unique */}
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/camera")}
            className="w-full py-5 rounded-[2rem] font-black text-base text-[#1A0A00] shadow-2xl shadow-[#C9963A]/20"
            style={{ background: "linear-gradient(135deg, #C9963A, #E8B96A)" }}
          >
            📸 PRENDRE MON SELFIE
          </motion.button>
        </div>
      </div>
    );
  }

  // --- ÉTAT AVEC RÉSULTATS ---
  // Ici tu mets ton code de liste de styles que nous avons stabilisé précédemment
  return (
    <div className="min-h-screen bg-[#1A0A00] text-white">
       {/* Ton code existant pour afficher les tresses générées */}
       <Seo title="Mes styles — AfroTresse" />
       <div className="p-6">
         <h1 className="text-[#C9963A] font-black text-2xl uppercase">Tes recommandations</h1>
         {/* ... reste de la boucle sur les styles ... */}
       </div>
    </div>
  );
}

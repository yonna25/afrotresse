import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCredits, getTotalUsed, getSavedStyles } from "../services/credits.js";

export default function Profile() {
  const navigate = useNavigate();

  const [credits, setCredits] = useState(0);
  const [analyses, setAnalyses] = useState(0);
  const [favoris, setFavoris] = useState(0);
  const [userName, setUserName] = useState("Ma Reine");
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("styles");

  useEffect(() => {
    setCredits(getCredits());
    setAnalyses(getTotalUsed());
    setFavoris(getSavedStyles().length);

    const savedName = localStorage.getItem("afrotresse_user_name");
    if (savedName) setUserName(savedName);
    const photo = sessionStorage.getItem("afrotresse_photo");
    if (photo) setSelfieUrl(photo);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-white flex flex-col items-center px-4 py-6 pb-32">

      {/* HEADER */}
      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-[#C9963A] overflow-hidden bg-[#2a1a14] flex items-center justify-center shadow-2xl">
            {selfieUrl ? (
              <img src={selfieUrl} className="w-full h-full object-cover" alt="Mon profil" />
            ) : (
              <span className="text-4xl">👑</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#C9963A] w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#1a0f0a] shadow-lg">
            <span className="text-sm">👑</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold mt-2 uppercase tracking-tight">{userName}</h1>
        <p className="text-[11px] text-[#C9963A] font-medium tracking-[0.2em] uppercase opacity-80">
          Votre Majesté
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 w-full max-w-sm mt-8 bg-white/5 border border-white/10 rounded-[2rem] p-5 text-center backdrop-blur-sm">
        <div>
          <p className="text-xl font-black text-[#C9963A]">{analyses}</p>
          <p className="text-[9px] uppercase font-bold opacity-40">Analyses</p>
        </div>
        <div className="border-x border-white/10">
          <p className="text-xl font-black text-[#C9963A]">{favoris}</p>
          <p className="text-[9px] uppercase font-bold opacity-40">Favoris</p>
        </div>
        <div>
          <p className="text-xl font-black text-[#C9963A]">{credits}</p>
          <p className="text-[9px] uppercase font-bold opacity-40">Crédits</p>
        </div>
      </div>

      {/* ONGLETS */}
      <div className="flex bg-[#2a1a14] rounded-2xl mt-10 p-1 w-full max-w-sm border border-white/5">
        <button
          onClick={() => setActiveTab("styles")}
          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${activeTab === "styles" ? "bg-[#C9963A] text-[#1a0f0a]" : "text-gray-500"}`}
        >
          Styles
        </button>
        <button
          onClick={() => setActiveTab("essais")}
          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${activeTab === "essais" ? "bg-[#C9963A] text-[#1a0f0a]" : "text-gray-500"}`}
        >
          Essais
        </button>
        <button
          onClick={() => navigate("/results")}
          className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all text-[#C9963A] border border-[#C9963A]/30 flex items-center justify-center gap-1"
        >
          ✨ Résultats
        </button>
      </div>

      {/* CONTENU ONGLETS */}
      <div className="w-full mt-12 flex flex-col items-center">
        {activeTab === "styles" ? (
          <div className="text-center px-10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 mx-auto border border-white/10 text-xl">🔖</div>
            <p className="text-gray-300 font-medium text-sm">Aucun style enregistré</p>
            <p className="text-[10px] text-gray-500 mt-2">Enregistre tes tresses préférées pour les retrouver ici.</p>
          </div>
        ) : (
          <div className="text-center px-10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 mx-auto border border-white/10 text-xl">📸</div>
            <p className="text-gray-300 font-medium text-sm">Pas encore de transformations</p>
            <p className="text-[10px] text-gray-500 mt-2 mb-6">Tes essayages virtuels avec l'IA apparaîtront ici.</p>
            <button
              onClick={() => navigate("/")}
              className="text-[#C9963A] text-[10px] font-bold uppercase border border-[#C9963A]/30 px-4 py-2 rounded-full"
            >
              Lancer un essai ✨
            </button>
          </div>
        )}
      </div>

      {/* INFORMATIONS LÉGALES */}
      <div className="mt-auto pt-20 pb-4 flex flex-col items-center gap-2 opacity-30">
        <div className="flex gap-4 text-[9px] font-medium uppercase tracking-tighter">
          <button onClick={() => navigate("/terms-of-service")}>CGU</button>
          <span>•</span>
          <button onClick={() => navigate("/privacy-policy")}>Confidentialité</button>
          <span>•</span>
          <button onClick={() => navigate("/cookie-policy")}>Cookies</button>
        </div>
        <p className="text-[8px]">© 2026 AfroTresse - Tous droits réservés</p>
      </div>

    </div>
  );
}

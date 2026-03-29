import { useState, useEffect } from "react";
import { BRAIDS_DB } from "../services/faceAnalysis.js";

export default function Results() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    // Collecte des infos de diagnostic
    const shape = localStorage.getItem("afrotresse_face_shape");
    const photo = sessionStorage.getItem("afrotresse_photo");
    const filtered = BRAIDS_DB.filter(s => s.faceShapes.includes(shape || "oval"));

    console.log("[DEBUG] Results.jsx: Morphologie lue ->", shape);
    console.log("[DEBUG] Results.jsx: Nombre de styles trouvés ->", filtered.length);

    setReport({
      shape: shape || "Non trouvée (ERREUR)",
      photo: photo ? "OK" : "Manquante",
      stylesCount: filtered.length,
      dbStatus: BRAIDS_DB ? "Chargée" : "Indisponible"
    });
  }, []);

  if (!report) return <div className="text-white p-10">Initialisation du diagnostic...</div>;

  return (
    <div className="min-h-screen bg-[#2C1A0E] text-white p-6">
      <div className="bg-black/40 p-4 rounded-xl border border-[#C9963A] mb-8 font-mono text-[10px]">
        <h2 className="text-[#C9963A] font-bold mb-2 underline">RAPPORT DE DIAGNOSTIC</h2>
        <p>Forme visage : {report.shape}</p>
        <p>Photo session : {report.photo}</p>
        <p>Styles filtrés : {report.stylesCount}</p>
        <p>Base de données : {report.dbStatus}</p>
      </div>

      <h1 className="text-xl font-bold mb-6 text-[#C9963A]">Vos Recommandations</h1>
      
      <div className="grid gap-6">
        {BRAIDS_DB.filter(s => s.faceShapes.includes(report.shape)).map(style => (
          <div key={style.id} className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <h3 className="font-bold">{style.name}</h3>
            <p className="text-xs opacity-60">{style.description}</p>
          </div>
        ))}
      </div>
      
      {report.stylesCount === 0 && (
        <p className="text-center opacity-50 mt-10 italic">
          Aucun style ne correspond à la forme "{report.shape}".
        </p>
      )}
    </div>
  );
}

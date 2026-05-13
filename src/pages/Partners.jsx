import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabase";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:         "#FBF6EE",
  bgCard:     "#FFFFFF",
  bgCardHov:  "#FFFDF9",
  bgDeep:     "#F5EDE0",
  amber:      "#C8873A",
  amberLight: "#E8A85C",
  amberPale:  "#F5D9B8",
  amberDim:   "rgba(200,135,58,0.12)",
  amberLine:  "rgba(200,135,58,0.22)",
  spice:      "#8B4513",
  ink:        "#1C0F06",
  inkMid:     "#5C3520",
  inkLight:   "rgba(92,53,32,0.55)",
  inkFade:    "rgba(92,53,32,0.30)",
  cream:      "#FBF6EE",
  white:      "#FFFFFF",
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",         label: "Tous",          emoji: "✦" },
  { id: "salon",       label: "Salon",         emoji: "💇🏾‍♀️" },
  { id: "independante",label: "Indépendante",  emoji: "✨" }, // Ajout demandé
  { id: "produits",    label: "Produits",      emoji: "🧴" },
  { id: "formation",   label: "Formation",     emoji: "🎓" },
  { id: "domicile",    label: "À domicile",    emoji: "🏠" },
];

// ─── COMPOSANT WHATSAPP (AVEC FLOUTAGE) ──────────────────────────────────────
const WhatsAppDisplay = ({ phone, isPremium }) => {
  if (!phone) return null;

  return (
    <div style={{ marginTop: 8, fontSize: 13, color: T.inkMid }}>
      <span style={{ marginRight: 6 }}>📞</span>
      <span style={{ 
        filter: isPremium ? "none" : "blur(4px)", 
        userSelect: isPremium ? "auto" : "none",
        transition: "filter 0.3s"
      }}>
        {isPremium ? phone : "00 00 00 00 00"}
      </span>
      {!isPremium && (
        <span style={{ fontSize: 10, marginLeft: 8, color: T.amber, fontStyle: "italic" }}>
          (Réservé Premium)
        </span>
      )}
    </div>
  );
};

// ─── PARTNERS COMPONENT ───────────────────────────────────────────────────────
export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  // Simulation de récupération de données
  useEffect(() => {
    // Logique de fetch ici
  }, []);

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", color: T.ink }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px" }}>
        
        {/* Header & Filtres */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, marginBottom: 16 }}>
            Nos Partenaires
          </h1>
          
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            {CATEGORIES.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 30,
                  border: `1px solid ${filter === id ? T.amber : T.amberLine}`,
                  backgroundColor: filter === id ? T.amber : "transparent",
                  color: filter === id ? T.white : T.inkMid,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}>
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Section Accordéon Inscription */}
        <div style={{ maxWidth: 600, margin: "0 auto 60px" }}>
          <div style={{
            backgroundColor: T.bgCard,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: `0 10px 30px ${T.amberDim}`,
            border: `1px solid ${T.amberLine}`
          }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                width: "100%",
                padding: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: `linear-gradient(135deg, ${T.amber}, ${T.spice})`,
                color: T.white,
                border: "none",
                cursor: "pointer",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em"
              }}>
              <span>✦ {showForm ? "Fermer le formulaire" : "Inscrire mon activité gratuitement"}</span>
              <span style={{ 
                transform: showForm ? "rotate(180deg)" : "rotate(0deg)", 
                transition: "transform 0.3s" 
              }}>▼</span>
            </button>

            <div style={{
              maxHeight: showForm ? "1000px" : "0px",
              overflow: "hidden",
              transition: "max-height 0.5s ease-in-out",
              backgroundColor: T.white
            }}>
              <div style={{ padding: 30 }}>
                {/* Simulation du formulaire */}
                <form style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  <input type="text" placeholder="Nom du salon / Nom d'indépendante" style={inputStyle} />
                  <select style={inputStyle}>
                    <option>Choisir une catégorie...</option>
                    <option value="salon">Salon</option>
                    <option value="independante">Indépendante</option>
                    <option value="produits">Produits</option>
                    <option value="formation">Formation</option>
                  </select>
                  <input type="tel" placeholder="Numéro WhatsApp" style={inputStyle} />
                  <button type="submit" style={submitButtonStyle}>Envoyer l'inscription</button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Grille des Partenaires (Aperçu) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 30 }}>
          {/* Exemple d'un partenaire freemium */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 600, fontSize: 18, color: T.spice }}>Exemple Salon</div>
            <div style={{ fontSize: 14, color: T.inkLight }}>Catégorie : Salon</div>
            <WhatsAppDisplay phone="0612345678" isPremium={false} />
          </div>
          
          {/* Exemple d'un partenaire premium */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 600, fontSize: 18, color: T.spice }}>Expertise Tresses</div>
            <div style={{ fontSize: 14, color: T.inkLight }}>Catégorie : Indépendante</div>
            <WhatsAppDisplay phone="+33 7 88 99 00 11" isPremium={true} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 80, opacity: 0.5, fontSize: 12 }}>
          AfroTresse · Partenaires certifiés ✦ 2026
        </div>
      </div>
    </div>
  );
}

// Styles internes rapides pour le formulaire
const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: `1px solid ${T.amberLine}`,
  fontFamily: "inherit"
};

const submitButtonStyle = {
  padding: "14px",
  backgroundColor: T.ink,
  color: T.white,
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 600
};

const cardStyle = {
  padding: 24,
  backgroundColor: T.white,
  borderRadius: 16,
  border: `1px solid ${T.amberLine}`,
  boxShadow: `0 4px 12px ${T.amberDim}`
};

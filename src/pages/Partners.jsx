import { useState, useEffect } from "react";

const PARTNERS = [
  {
    id: 1, category: "Salon", name: "Queens Hair Studio", city: "Paris",
    specialty: "Box Braids · Knotless · Fulani", rating: 4.9, reviews: 312,
    badge: "Top Partenaire", badgeColor: "#C9963A",
    promo: "-10% avec AfroTresse", promoCode: "AFRO10",
    description: "Spécialiste des tresses afro depuis 2015. Cadre luxueux, coiffeuses certifiées, résultats garantis.",
    tags: ["Tresses africaines", "Extensions", "Soins"],
    available: true, emoji: "👑", sponsored: true,
    logo: null,
    whatsapp: "+33612345678",
    socials: { instagram: "queenshairstudio", facebook: "queenshairstudio", tiktok: "queenshairstudio" },
  },
  {
    id: 2, category: "Produits", name: "AfroGlow Cosmetics", city: "En ligne",
    specialty: "Soins · Huiles · Extensions", rating: 4.8, reviews: 1240,
    badge: "Naturel & Bio", badgeColor: "#4CAF50",
    promo: "2 achetés = 1 crédit", promoCode: "GLOW2024",
    description: "Produits capillaires 100% naturels pour cheveux afro-texturés. Livraison en 48h.",
    tags: ["Bio", "Sans sulfate", "Vegan"],
    available: true, emoji: "🌿", sponsored: false,
    logo: null,
    whatsapp: null,
    socials: { instagram: "afroglowcosmetics", youtube: "afroglowcosmetics" },
  },
  {
    id: 3, category: "Salon", name: "Nappy Palace", city: "Lyon",
    specialty: "Cornrows · Twist · Locks", rating: 4.7, reviews: 189,
    badge: "Tendance", badgeColor: "#FF6B35",
    promo: "Consultation offerte", promoCode: "PALACE1",
    description: "Le salon de référence à Lyon pour toutes les coiffures naturelles et protectrices.",
    tags: ["Naturel", "Protecteur", "Conseil"],
    available: true, emoji: "🔥", sponsored: false,
    logo: null,
    whatsapp: "+33478901234",
    socials: { instagram: "nappypalace", tiktok: "nappypalace", facebook: "nappypalace" },
  },
  {
    id: 4, category: "Formation", name: "Tress Academy", city: "Paris & Online",
    specialty: "Formation · Certification", rating: 5.0, reviews: 87,
    badge: "Certifiante", badgeColor: "#9C27B0",
    promo: "1er module gratuit", promoCode: "ACADEMY1",
    description: "Devenez coiffeuse professionnelle certifiée en tresses africaines.",
    tags: ["Certification", "Pro", "En ligne"],
    available: true, emoji: "🎓", sponsored: false,
    logo: null,
    whatsapp: null,
    socials: { instagram: "tressacademy", youtube: "tressacademy", twitter: "tressacademy" },
  },
  {
    id: 5, category: "Salon", name: "Braids & Beauty", city: "Marseille",
    specialty: "Goddess · Boho · Crochet", rating: 4.6, reviews: 203,
    badge: "Premium", badgeColor: "#00BCD4",
    promo: "-15% 1ère visite", promoCode: "BB15",
    description: "Salon premium spécialisé dans les styles tendance et créations sur mesure.",
    tags: ["Sur mesure", "Premium", "Tendance"],
    available: false, emoji: "💎", sponsored: false,
    logo: null,
    whatsapp: "+33491234567",
    socials: { instagram: "braidsandbeauty13", facebook: "braidsandbeauty13" },
  },
];

const CATEGORIES = ["Tous", "Salon", "Produits", "Formation"];

// ── Icônes réseaux sociaux SVG ───────────────────────────────────────────────
const SocialIcons = {
  instagram: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  ),
};

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ p, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(p.promoCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!p.whatsapp) return;
    const phone = p.whatsapp.replace(/\D/g, "");
    const msg = encodeURIComponent(`Bonjour ${p.name}, je vous contacte via AfroTresse 👑`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const socialLinks = {
    instagram: (handle) => `https://instagram.com/${handle}`,
    facebook:  (handle) => `https://facebook.com/${handle}`,
    tiktok:    (handle) => `https://tiktok.com/@${handle}`,
    youtube:   (handle) => `https://youtube.com/@${handle}`,
    twitter:   (handle) => `https://x.com/${handle}`,
  };

  const socialColors = {
    instagram: "#E1306C",
    facebook:  "#1877F2",
    tiktok:    "#010101",
    youtube:   "#FF0000",
    twitter:   "#000000",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      background: "rgba(8,6,4,0.65)", backdropFilter: "blur(20px)",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 430,
        background: "#F7F3EE",
        borderRadius: "32px 32px 0 0",
        maxHeight: "90vh", overflowY: "auto",
        animation: "slideUp 0.4s cubic-bezier(0.32,0.72,0,1)",
      }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(0,0,0,0.1)" }} />
        </div>

        <div style={{ padding: "20px 28px 52px" }}>

          {/* Header avec logo ou emoji */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{
                width: 68, height: 68, borderRadius: 22,
                background: p.logo ? "transparent" : "#EDE8E2",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0,
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                {p.logo
                  ? <img src={p.logo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 30 }}>{p.emoji}</span>
                }
              </div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#C9963A", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>{p.category}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#1A0F06", lineHeight: 1.1, fontFamily: "Georgia, serif" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#8A7060", marginTop: 3, fontWeight: 500 }}>{p.city}</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 99, background: "#EDE8E2",
              border: "none", cursor: "pointer", color: "#8A7060", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Rating + badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 3 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: 99, background: i <= Math.round(p.rating) ? "#C9963A" : "#DDD5CA" }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#8A7060", fontWeight: 600 }}>{p.rating} · {p.reviews} avis</span>
            <div style={{
              marginLeft: "auto", fontSize: 9, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.1em", padding: "4px 10px", borderRadius: 99,
              background: `${p.badgeColor}18`, color: p.badgeColor,
            }}>{p.badge}</div>
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: "#5A4A3A", lineHeight: 1.75, marginBottom: 16 }}>{p.description}</p>
          <p style={{ fontSize: 11, color: "#8A7060", marginBottom: 20, fontStyle: "italic" }}>{p.specialty}</p>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
            {p.tags.map((t, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 700, padding: "5px 12px", borderRadius: 99,
                background: "#EDE8E2", color: "#6A5A4A", letterSpacing: "0.05em",
              }}>{t}</span>
            ))}
          </div>

          {/* Promo */}
          <div style={{
            background: "linear-gradient(135deg, #FBF6EE, #F5EEE4)",
            border: "1px solid rgba(201,150,58,0.25)", borderRadius: 20,
            padding: "16px 20px", display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9963A", fontWeight: 800, marginBottom: 4 }}>Offre exclusive</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0F06" }}>{p.promo}</div>
              <div style={{ fontSize: 12, color: "#C9963A", fontWeight: 700, marginTop: 3, fontFamily: "monospace", letterSpacing: "0.1em" }}>{p.promoCode}</div>
            </div>
            <button onClick={handleCopy} style={{
              width: 42, height: 42, borderRadius: 14,
              background: copied ? "#C9963A" : "#EDE8E2", border: "none", cursor: "pointer",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s", color: copied ? "#fff" : "#8A7060",
            }}>
              {copied ? "✓" : "📋"}
            </button>
          </div>

          {/* Réseaux sociaux */}
          {p.socials && Object.keys(p.socials).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#B0A090", fontWeight: 800, marginBottom: 12 }}>Réseaux sociaux</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Object.entries(p.socials).map(([network, handle]) => (
                  <button key={network}
                    onClick={() => window.open(socialLinks[network]?.(handle), "_blank")}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "8px 14px", borderRadius: 12,
                      background: "#EDE8E2", border: "none", cursor: "pointer",
                      transition: "all 0.2s",
                      color: socialColors[network] || "#1A0F06",
                      fontSize: 11, fontWeight: 700,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${socialColors[network]}15`}
                    onMouseLeave={e => e.currentTarget.style.background = "#EDE8E2"}
                  >
                    <span style={{ color: socialColors[network] }}>{SocialIcons[network]}</span>
                    @{handle}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA WhatsApp ou Contact */}
          {p.whatsapp ? (
            <button onClick={handleWhatsApp} style={{
              width: "100%", padding: "16px", borderRadius: 18,
              background: "#25D366", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 900, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <span style={{ color: "#fff" }}>{SocialIcons.whatsapp}</span>
              Contacter sur WhatsApp
            </button>
          ) : (
            <button style={{
              width: "100%", padding: "16px", borderRadius: 18,
              background: "#1A0F06", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 900, color: "#F7F3EE",
            }}>
              Contacter →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function PartnersMinimal() {
  const [cat, setCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = PARTNERS.filter(p => {
    const matchCat = cat === "Tous" || p.category === cat;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0));

  return (
    <div style={{
      minHeight: "100vh", background: "#F7F3EE",
      fontFamily: "'Trebuchet MS', Georgia, serif",
      maxWidth: 430, margin: "0 auto",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #B8A898; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .card { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* ── HERO HEADER ── */}
      <div style={{ position: "relative", overflow: "hidden", padding: "52px 28px 36px" }}>

        {/* Cercle décoratif fond */}
        <div style={{
          position: "absolute", top: -60, right: -40,
          width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,150,58,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -20, left: -30,
          width: 140, height: 140, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,150,58,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Label afrotresse */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#1A0F06", borderRadius: 99,
          padding: "6px 14px 6px 8px", marginBottom: 20,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: 99, background: "#C9963A",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10,
          }}>✦</div>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.25em", color: "#C9963A", textTransform: "uppercase" }}>
            AfroTresse
          </span>
        </div>

        {/* Titre */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#B0A090", letterSpacing: "0.08em", marginBottom: 4 }}>
            Notre sélection
          </div>
          <h1 style={{
            margin: 0, fontSize: 42, fontWeight: 900, lineHeight: 1.0,
            fontFamily: "Georgia, serif", color: "#1A0F06",
          }}>
            Nos<br />
            <span style={{ position: "relative", display: "inline-block" }}>
              <em style={{ fontStyle: "italic", color: "#C9963A" }}>Partenaires</em>
              {/* Underline décoratif */}
              <svg style={{ position: "absolute", bottom: -4, left: 0, width: "100%" }} height="6" viewBox="0 0 120 6" preserveAspectRatio="none">
                <path d="M0 4 Q30 0 60 4 Q90 8 120 4" stroke="#C9963A" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
          </h1>
        </div>

        {/* Sous-titre avec séparateur */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 1, background: "#C9963A", opacity: 0.5 }} />
          <p style={{ fontSize: 12, color: "#8A7060", margin: 0, lineHeight: 1.6 }}>
            Salons, produits & formations<br />triés sur le volet pour toi 👑
          </p>
        </div>
      </div>

      {/* ── BARRE DE RECHERCHE STYLISÉE ── */}
      <div style={{ padding: "0 28px 22px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: focused ? "#fff" : "#EDE8E2",
          borderRadius: 20, padding: "13px 18px",
          border: focused ? "1.5px solid rgba(201,150,58,0.5)" : "1.5px solid transparent",
          boxShadow: focused ? "0 4px 24px rgba(201,150,58,0.12)" : "none",
          transition: "all 0.3s ease",
        }}>
          {/* Icône loupe custom */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={focused ? "#C9963A" : "#B0A090"} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, transition: "stroke 0.3s" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Salon, ville, spécialité..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              flex: 1, background: "none", border: "none",
              fontSize: 13, color: "#1A0F06", fontFamily: "inherit",
              fontWeight: 500,
            }}
          />
          {search
            ? <button onClick={() => setSearch("")} style={{ background: "#EDE8E2", border: "none", cursor: "pointer", width: 22, height: 22, borderRadius: 99, color: "#8A7060", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            : <div style={{ fontSize: 13, color: "#C9963A", opacity: 0.6 }}>✦</div>
          }
        </div>
      </div>

      {/* ── FILTRES 4 colonnes ── */}
      <div style={{ padding: "0 28px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: "9px 4px", borderRadius: 14, fontSize: 10,
            fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
            cursor: "pointer", border: "none", transition: "all 0.2s",
            background: cat === c ? "#1A0F06" : "#EDE8E2",
            color: cat === c ? "#F7F3EE" : "#8A7060",
            whiteSpace: "nowrap", textAlign: "center",
          }}>
            {c}
          </button>
        ))}
      </div>

      {/* ── BANNIÈRE REJOINDRE ── */}
      <div style={{ padding: "0 28px 24px" }}>
        <div style={{
          background: "linear-gradient(135deg, #1A0F06 0%, #2C1A0E 100%)",
          borderRadius: 24, padding: "20px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
        }} onClick={() => window.open("mailto:partenaires@afrotresse.com", "_blank")}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "rgba(201,150,58,0.6)", textTransform: "uppercase", fontWeight: 800, marginBottom: 5 }}>
              Coiffeuse ou marque ?
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#F7F3EE", lineHeight: 1.2, fontFamily: "Georgia, serif" }}>
              Rejoins la vitrine
            </div>
            <div style={{ fontSize: 11, color: "rgba(247,243,238,0.35)", marginTop: 3 }}>
              Visibilité gratuite · 1er mois offert
            </div>
          </div>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: "#C9963A", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#1A0F06", fontWeight: 900, fontSize: 18,
          }}>→</div>
        </div>
      </div>

      {/* ── LISTE ── */}
      <div style={{ padding: "0 28px 120px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#B0A090" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Aucun résultat</div>
          </div>
        ) : filtered.map((p, i) => (
          <div key={p.id} className="card" style={{ animationDelay: `${i * 0.06}s` }}
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => p.available && setSelected(p)}>
            <div style={{
              background: hoveredId === p.id ? "#EAE4DC" : "#EEEAE4",
              borderRadius: 22, padding: "16px 18px",
              cursor: p.available ? "pointer" : "default",
              opacity: p.available ? 1 : 0.45,
              transition: "all 0.25s ease",
              border: p.sponsored ? "1.5px solid rgba(201,150,58,0.28)" : "1.5px solid transparent",
              transform: hoveredId === p.id && p.available ? "translateY(-2px)" : "none",
              boxShadow: hoveredId === p.id && p.available ? "0 8px 28px rgba(26,15,6,0.09)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>

                {/* Logo ou emoji */}
                <div style={{
                  width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                  background: p.logo ? "transparent" : "#E4DDD5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", fontSize: 22, position: "relative",
                  border: "1px solid rgba(0,0,0,0.05)",
                }}>
                  {p.logo
                    ? <img src={p.logo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : p.emoji
                  }
                  {p.sponsored && (
                    <div style={{
                      position: "absolute", top: -3, right: -3,
                      width: 12, height: 12, borderRadius: 99,
                      background: "#C9963A", border: "2px solid #F7F3EE",
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ minWidth: 0, paddingRight: 8 }}>
                      <div style={{ fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "#B0A090", fontWeight: 700, marginBottom: 2 }}>
                        {p.category} · {p.city}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#1A0F06", lineHeight: 1.2, fontFamily: "Georgia, serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </div>
                    </div>
                    {/* Dots rating */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <div key={s} style={{ width: 5, height: 5, borderRadius: 99, background: s <= Math.round(p.rating) ? "#C9963A" : "#D5CEC7" }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 9, color: "#B0A090", fontWeight: 600 }}>{p.rating}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#8A7060", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.specialty}
                  </div>
                </div>
              </div>

              {/* Footer card */}
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em",
                  padding: "4px 10px", borderRadius: 99,
                  background: `${p.badgeColor}15`, color: p.badgeColor,
                }}>
                  {p.badge}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Icônes socials miniatures */}
                  {p.socials && Object.keys(p.socials).slice(0, 3).map(network => (
                    <span key={network} style={{ color: socialColors[network], opacity: 0.7 }}>
                      {SocialIcons[network]}
                    </span>
                  ))}
                  {p.whatsapp && <span style={{ color: "#25D366", opacity: 0.8 }}>{SocialIcons.whatsapp}</span>}
                </div>
                <span style={{ fontSize: 11, color: "#C9963A", fontWeight: 700 }}>🎁 {p.promo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL ── */}
      {selected && <Modal p={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const socialColors = {
  instagram: "#E1306C",
  facebook:  "#1877F2",
  tiktok:    "#010101",
  youtube:   "#FF0000",
  twitter:   "#000000",
};

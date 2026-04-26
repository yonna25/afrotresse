import { useState, useEffect } from "react";

const PARTNERS = [
  {
    id: 1, category: "Salon", name: "Queens Hair Studio", city: "Paris",
    specialty: "Box Braids · Knotless · Fulani", rating: 4.9, reviews: 312,
    badge: "Top Partenaire", badgeColor: "#C9963A", promo: "-10% avec AfroTresse",
    promoCode: "AFRO10", description: "Spécialiste des tresses afro depuis 2015. Cadre luxueux, coiffeuses certifiées.",
    tags: ["Tresses africaines", "Extensions", "Soins"], available: true, emoji: "👑", sponsored: true,
  },
  {
    id: 2, category: "Produits", name: "AfroGlow Cosmetics", city: "En ligne",
    specialty: "Soins · Huiles · Extensions", rating: 4.8, reviews: 1240,
    badge: "Naturel & Bio", badgeColor: "#4CAF50", promo: "2 achetés = 1 crédit",
    promoCode: "GLOW2024", description: "Produits capillaires 100% naturels pour cheveux afro-texturés.",
    tags: ["Bio", "Sans sulfate", "Vegan"], available: true, emoji: "🌿", sponsored: false,
  },
  {
    id: 3, category: "Salon", name: "Nappy Palace", city: "Lyon",
    specialty: "Cornrows · Twist · Locks", rating: 4.7, reviews: 189,
    badge: "Tendance", badgeColor: "#FF6B35", promo: "Consultation offerte",
    promoCode: "PALACE1", description: "Le salon de référence à Lyon pour toutes les coiffures naturelles.",
    tags: ["Naturel", "Protecteur", "Conseil"], available: true, emoji: "🔥", sponsored: false,
  },
  {
    id: 4, category: "Formation", name: "Tress Academy", city: "Paris & Online",
    specialty: "Formation · Certification", rating: 5.0, reviews: 87,
    badge: "Certifiante", badgeColor: "#9C27B0", promo: "1er module gratuit",
    promoCode: "ACADEMY1", description: "Devenez coiffeuse professionnelle certifiée en tresses africaines.",
    tags: ["Certification", "Pro", "En ligne"], available: true, emoji: "🎓", sponsored: false,
  },
  {
    id: 5, category: "Salon", name: "Braids & Beauty", city: "Marseille",
    specialty: "Goddess · Boho · Crochet", rating: 4.6, reviews: 203,
    badge: "Premium", badgeColor: "#00BCD4", promo: "-15% 1ère visite",
    promoCode: "BB15", description: "Salon premium spécialisé dans les styles tendance et créations sur mesure.",
    tags: ["Sur mesure", "Premium", "Tendance"], available: false, emoji: "💎", sponsored: false,
  },
];

const CATEGORIES = ["Tous", "Salon", "Produits", "Formation"];

function Modal({ p, onClose, copied, onCopy }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      background: "rgba(8,6,4,0.7)", backdropFilter: "blur(20px)",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 430,
        background: "#F7F3EE",
        borderRadius: "32px 32px 0 0",
        maxHeight: "88vh", overflowY: "auto",
        animation: "slideUp 0.4s cubic-bezier(0.32,0.72,0,1)",
      }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(0,0,0,0.12)" }} />
        </div>

        <div style={{ padding: "20px 28px 48px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: "#EDE8E2", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 28,
              }}>{p.emoji}</div>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#C9963A", fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>{p.category}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#1A0F06", lineHeight: 1.1, fontFamily: "Georgia, serif" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#8A7060", marginTop: 4, fontWeight: 500 }}>{p.city}</div>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 99, background: "#EDE8E2",
              border: "none", cursor: "pointer", fontSize: 14, color: "#8A7060",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>

          {/* Rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 2 }}>
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
          <p style={{ fontSize: 13, color: "#5A4A3A", lineHeight: 1.75, marginBottom: 20 }}>{p.description}</p>

          {/* Spécialité */}
          <div style={{ fontSize: 11, color: "#8A7060", marginBottom: 20, fontStyle: "italic" }}>{p.specialty}</div>

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
            border: "1px solid rgba(201,150,58,0.25)",
            borderRadius: 20, padding: "16px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9963A", fontWeight: 800, marginBottom: 4 }}>Offre exclusive</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0F06" }}>{p.promo}</div>
              <div style={{ fontSize: 11, color: "#C9963A", fontWeight: 700, marginTop: 3, fontFamily: "monospace", letterSpacing: "0.1em" }}>{p.promoCode}</div>
            </div>
            <button onClick={onCopy} style={{
              width: 42, height: 42, borderRadius: 14,
              background: copied ? "#C9963A" : "#EDE8E2",
              border: "none", cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {copied ? "✓" : "📋"}
            </button>
          </div>

          {/* CTA */}
          <button style={{
            width: "100%", padding: "16px", borderRadius: 18,
            background: "#1A0F06", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 900, color: "#F7F3EE",
            letterSpacing: "0.05em",
          }}>
            Contacter →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PartnersMinimal() {
  const [cat, setCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = PARTNERS.filter(p => {
    const matchCat = cat === "Tous" || p.category === cat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0));

  const handleCopy = () => {
    if (selected?.promoCode) navigator.clipboard.writeText(selected.promoCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F7F3EE",
      fontFamily: "'Trebuchet MS', Georgia, serif",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #B0A090; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ padding: "52px 28px 28px", position: "relative" }}>
        {/* Texture top-right */}
        <div style={{
          position: "absolute", top: 0, right: 0, width: 160, height: 160,
          background: "radial-gradient(circle at 80% 20%, rgba(201,150,58,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ fontSize: 9, letterSpacing: "0.35em", color: "#C9963A", fontWeight: 800, textTransform: "uppercase", marginBottom: 10 }}>
          AfroTresse
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 900, color: "#1A0F06", lineHeight: 1.05,
          fontFamily: "Georgia, serif", margin: 0, marginBottom: 8,
        }}>
          Nos<br /><em style={{ fontStyle: "italic", color: "#C9963A" }}>Partenaires</em>
        </h1>
        <p style={{ fontSize: 12, color: "#8A7060", lineHeight: 1.6, maxWidth: 220 }}>
          Salons, produits & formations triés sur le volet pour toi.
        </p>
      </div>

      {/* ── RECHERCHE ── */}
      <div style={{ padding: "0 28px 20px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#EDE8E2", borderRadius: 16, padding: "12px 18px",
        }}>
          <span style={{ color: "#B0A090", fontSize: 14 }}>○</span>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: "none", border: "none", fontSize: 13, color: "#1A0F06", fontFamily: "inherit" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#B0A090", fontSize: 12 }}>✕</button>
          )}
        </div>
      </div>

      {/* ── FILTRES ── */}
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
        }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: "0.25em", color: "rgba(201,150,58,0.6)", textTransform: "uppercase", fontWeight: 800, marginBottom: 5 }}>
              Coiffeuse ou marque ?
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#F7F3EE", lineHeight: 1.2, fontFamily: "Georgia, serif" }}>
              Rejoins la vitrine
            </div>
            <div style={{ fontSize: 11, color: "rgba(247,243,238,0.4)", marginTop: 3 }}>
              1er mois gratuit
            </div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: "#C9963A", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, cursor: "pointer",
          }}>→</div>
        </div>
      </div>

      {/* ── LISTE ── */}
      <div style={{ padding: "0 28px 120px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((p, i) => (
          <div
            key={p.id}
            className="card"
            style={{ animationDelay: `${i * 0.07}s` }}
            onMouseEnter={() => setHoveredId(p.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => p.available && setSelected(p)}
          >
            <div style={{
              background: hoveredId === p.id ? "#F0EAE2" : "#EEEAE4",
              borderRadius: 24,
              padding: "18px 20px",
              cursor: p.available ? "pointer" : "default",
              opacity: p.available ? 1 : 0.45,
              transition: "all 0.25s ease",
              border: p.sponsored ? "1px solid rgba(201,150,58,0.3)" : "1px solid transparent",
              transform: hoveredId === p.id ? "translateY(-1px)" : "none",
              boxShadow: hoveredId === p.id ? "0 8px 32px rgba(26,15,6,0.08)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>

                {/* Emoji */}
                <div style={{
                  width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                  background: "#E4DDD5", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 22,
                  position: "relative",
                }}>
                  {p.emoji}
                  {p.sponsored && (
                    <div style={{
                      position: "absolute", top: -4, right: -4,
                      width: 14, height: 14, borderRadius: 99,
                      background: "#C9963A", border: "2px solid #F7F3EE",
                    }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "#B0A090", fontWeight: 700, marginBottom: 3 }}>
                        {p.category} · {p.city}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#1A0F06", lineHeight: 1.2, fontFamily: "Georgia, serif" }}>
                        {p.name}
                      </div>
                    </div>
                    {/* Rating dots */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <div key={s} style={{
                            width: 5, height: 5, borderRadius: 99,
                            background: s <= Math.round(p.rating) ? "#C9963A" : "#D5CEC7",
                          }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 9, color: "#B0A090", fontWeight: 600 }}>{p.rating}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: "#8A7060", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.specialty}
                  </div>
                </div>
              </div>

              {/* Footer card */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                  padding: "4px 10px", borderRadius: 99,
                  background: `${p.badgeColor}15`, color: p.badgeColor,
                }}>
                  {p.badge}
                </span>
                <span style={{ fontSize: 11, color: "#C9963A", fontWeight: 700 }}>
                  🎁 {p.promo}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL ── */}
      {selected && (
        <Modal
          p={selected}
          onClose={() => { setSelected(null); setCopied(false); }}
          copied={copied}
          onCopy={handleCopy}
        />
      )}
    </div>
  );
}

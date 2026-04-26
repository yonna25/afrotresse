import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";

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

const CATEGORIES = ["Tous", "Salon", "Produits", "Formation"];

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ p, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleCopy = () => {
    if (!p.promo_code) return;
    navigator.clipboard.writeText(p.promo_code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!p.whatsapp) return;
    const phone = p.whatsapp.replace(/\D/g, "");
    const msg = encodeURIComponent(`Bonjour ${p.name}, je vous contacte via AfroTresse 👑`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
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

        <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(0,0,0,0.1)" }} />
        </div>

        <div style={{ padding: "20px 28px 52px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{
                width: 68, height: 68, borderRadius: 22,
                background: p.logo_url ? "transparent" : "#EDE8E2",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden", flexShrink: 0,
                border: "1px solid rgba(0,0,0,0.06)",
              }}>
                {p.logo_url
                  ? <img src={p.logo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
              width: 32, height: 32, borderRadius: 99, background: "#EDE8E2", border: "none", cursor: "pointer", color: "#8A7060"
            }}>✕</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: "#8A7060", fontWeight: 600 }}>⭐ {p.rating} avis</span>
            <div style={{
              marginLeft: "auto", fontSize: 9, fontWeight: 800, textTransform: "uppercase", padding: "4px 10px", borderRadius: 99,
              background: `#C9963A18`, color: "#C9963A",
            }}>{p.badge || "Partenaire"}</div>
          </div>

          <p style={{ fontSize: 13, color: "#5A4A3A", lineHeight: 1.75, marginBottom: 16 }}>{p.description}</p>
          <p style={{ fontSize: 11, color: "#8A7060", marginBottom: 20, fontStyle: "italic" }}>{p.specialty}</p>

          {p.promo && (
            <div style={{
              background: "linear-gradient(135deg, #FBF6EE, #F5EEE4)", border: "1px solid rgba(201,150,58,0.25)", borderRadius: 20,
              padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24,
            }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C9963A", fontWeight: 800 }}>Offre exclusive</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0F06" }}>{p.promo}</div>
                <div style={{ fontSize: 12, color: "#C9963A", fontWeight: 700, fontFamily: "monospace" }}>{p.promo_code}</div>
              </div>
              <button onClick={handleCopy} style={{
                width: 42, height: 42, borderRadius: 14, background: copied ? "#C9963A" : "#EDE8E2", border: "none",
                color: copied ? "#fff" : "#8A7060", fontSize: 16
              }}>
                {copied ? "✓" : "📋"}
              </button>
            </div>
          )}

          {p.whatsapp && (
            <button onClick={handleWhatsApp} style={{
              width: "100%", padding: "16px", borderRadius: 18, background: "#25D366", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}>
              <span>{SocialIcons.whatsapp}</span>
              Contacter sur WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .eq("active", true)
      .order("position", { ascending: true });

    if (!error) setPartners(data || []);
    setLoading(false);
  };

  const filtered = partners.filter(p => {
    const matchCat = cat === "Tous" || p.category === cat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F7F3EE", fontFamily: "sans-serif", maxWidth: 430, margin: "0 auto", paddingBottom: 100 }}>
      <style>{`
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .card { animation: fadeUp 0.5s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "52px 28px 20px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#1A0F06", fontFamily: "Georgia, serif" }}>Nos Partenaires</h1>
        <p style={{ color: "#8A7060", fontSize: 14 }}>Coiffeuses et salons certifiés AfroTresse.</p>
      </div>

      {/* Filtres */}
      <div style={{ padding: "0 28px 20px" }}>
        <input 
          type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "14px 20px", borderRadius: 16, border: "1px solid #EDE8E2", background: "#FFF", outline: "none" }}
        />
        <div style={{ display: "flex", gap:

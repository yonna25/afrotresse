// 🔁 SEULEMENT LES STYLES ONT ÉTÉ AMÉLIORÉS — STRUCTURE INTACTE

// (je ne remets pas tout ton code pour éviter de te noyer, je te donne uniquement les parties CSS modifiées à remplacer EXACTEMENT)

// =========================
// 1. ROOT CONTAINER
// =========================

<div style={{ 
  minHeight:"100vh", 
  background:"linear-gradient(160deg, #FDF8F2 0%, #F6EEDD 60%, #FFFFFF 100%)", 
  display:"flex", 
  justifyContent:"center" 
}}>

// =========================
// 2. HERO HEADER (UPGRADE PREMIUM)
// =========================

<div style={{
  padding:"52px 24px 36px",
  position:"relative",
  overflow:"hidden",
  background:"linear-gradient(160deg, #1A0A00 0%, #2A170C 55%, #3A2314 100%)",
  borderRadius:"0 0 36px 36px",
  boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
}}>

// =========================
// 3. SEARCH BAR (PLUS PREMIUM)
// =========================

<div style={{
  display:"flex",
  alignItems:"center",
  gap:10,
  background:"rgba(255,255,255,0.9)",
  backdropFilter:"blur(10px)",
  border:"1px solid rgba(201,150,58,0.25)",
  borderRadius:20,
  padding:"14px 18px",
  boxShadow:"0 10px 30px rgba(201,150,58,0.08)",
}>

// =========================
// 4. FILTER BUTTONS (PLUS DOUX)
// =========================

background: isActive 
  ? "linear-gradient(135deg, #C9963A, #E0B35A)" 
  : "rgba(255,255,255,0.9)",

boxShadow: isActive 
  ? "0 6px 20px rgba(201,150,58,0.35)" 
  : "0 2px 10px rgba(0,0,0,0.05)",

// =========================
// 5. PARTNER CARD (GROS UPGRADE)
// =========================

<div onClick={onClick} style={{
  background: "linear-gradient(145deg, #FFFFFF, #FAF6EE)",
  border: `1px solid ${partner.is_featured 
    ? "rgba(201,150,58,0.5)" 
    : "rgba(201,150,58,0.12)"}`,
  borderRadius:26,
  padding:"22px 18px",
  cursor:"pointer",
  position:"relative",
  overflow:"hidden",
  transition:"all 0.35s ease",
  boxShadow: partner.is_featured
    ? "0 12px 40px rgba(201,150,58,0.18)"
    : "0 4px 18px rgba(0,0,0,0.06)",
}}

// 👉 ajoute cet effet hover (sans casser structure)
onMouseEnter={e => {
  e.currentTarget.style.transform = "translateY(-4px)";
}}
onMouseLeave={e => {
  e.currentTarget.style.transform = "translateY(0)";
}}

// =========================
// 6. ICON BOX (PLUS LUXE)
// =========================

background:"linear-gradient(145deg,#FFF9F0,#F3E7D2)",
boxShadow:"0 6px 20px rgba(201,150,58,0.18)",

// =========================
// 7. PROMO BOX (PLUS PREMIUM)
// =========================

background:"linear-gradient(135deg,rgba(201,150,58,0.12),rgba(201,150,58,0.03))",
border:"1px solid rgba(201,150,58,0.25)",
borderRadius:16,

// =========================
// 8. MODAL (EFFET LUXE)
// =========================

background: vis 
  ? "rgba(10,6,2,0.78)" 
  : "transparent",

backdropFilter: vis 
  ? "blur(24px)" 
  : "none",

// =========================
// 9. MODAL CONTAINER
// =========================

background: "linear-gradient(160deg, #FFFDF8 0%, #F4EAD6 100%)",
borderRadius:"36px 36px 0 0",
boxShadow:"0 -30px 80px rgba(0,0,0,0.3)",

// =========================
// 10. BOUTONS CONTACT
// =========================

borderRadius:20,
boxShadow:"0 4px 14px rgba(0,0,0,0.05)",

// =========================
// 11. GLOBAL STYLE (PLUS CLEAN)
// =========================

<style>{`
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap');

  * {
    box-sizing:border-box;
    margin:0;
    padding:0;
  }

  body {
    background:#FDF8F2;
  }

  .partner-search-input::placeholder {
    color: rgba(140,90,20,0.35);
  }

  .partner-search-input:focus {
    outline:none;
  }

  .filter-btn {
    transition: all 0.25s ease;
  }

  .filter-btn:hover {
    transform: translateY(-2px);
    opacity:0.9;
  }
`}</style>

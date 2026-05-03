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
  { id: "all",       label: "Tous",      emoji: "✦" },
  { id: "salon",     label: "Salon",     emoji: "💇🏾‍♀️" },
  { id: "produits",  label: "Produits",  emoji: "🧴" },
  { id: "formation", label: "Formation", emoji: "🎓" },
];

// ─── DATA MAPPER ──────────────────────────────────────────────────────────────
function mapPartner(row) {
  return {
    ...row,
    categoryLabel:  row.category_label || "",
    promo:          row.promo_text || row.promo || null,
    promo_deadline: row.promo_end_date || row.promo_deadline || null,
    socials: {
      instagram: row.instagram_url || row.instagram || null,
      tiktok:    row.tiktok_url    || null,
      facebook:  row.facebook_url  || row.facebook || null,
    },
  };
}

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function useCountdown(deadline) {
  const [t, setT] = useState({ h:"00", m:"00", s:"00", expired:false });
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setT({ h:"00", m:"00", s:"00", expired:true }); return; }
      setT({
        h: String(Math.floor(diff/3600000)).padStart(2,"0"),
        m: String(Math.floor((diff%3600000)/60000)).padStart(2,"0"),
        s: String(Math.floor((diff%60000)/1000)).padStart(2,"0"),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return t;
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IGIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const TKIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
function WarmDivider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 28px" }}>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg, transparent, ${T.amberLine})` }}/>
      <svg width="10" height="10" viewBox="0 0 12 12" fill={T.amber} opacity="0.5">
        <polygon points="6,0 7,5 12,6 7,7 6,12 5,7 0,6 5,5"/>
      </svg>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${T.amberLine}, transparent)` }}/>
    </div>
  );
}

// ─── MODAL PREMIUM CLAIR ──────────────────────────────────────────────────────
function Modal({ partner, onClose }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  const [vis, setVis] = useState(false);
  const [hovWa, setHovWa] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 420); };
  const wa = () => window.open(
    `https://wa.me/${((partner.whatsapp || partner.phone)||"").replace(/\D/g,"")}?text=${encodeURIComponent("Bonjour, je vous contacte via AfroTresse 👑")}`,
    "_blank"
  );

  return (
    <div onClick={close} style={{
      position:"fixed", inset:0, zIndex:100,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      background: vis ? "rgba(28,15,6,0.55)" : "transparent",
      backdropFilter: vis ? "blur(16px)" : "none",
      transition:"all 0.45s cubic-bezier(0.23,1,0.32,1)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", maxWidth:460,
        maxHeight:"94vh", overflowY:"auto",
        background:T.white,
        borderRadius:"32px 32px 0 0",
        transform: vis ? "translateY(0)" : "translateY(105%)",
        transition:"transform 0.55s cubic-bezier(0.19,1,0.22,1)",
        position:"relative",
        border:`1px solid ${T.amberLine}`,
        borderBottom:"none",
        boxShadow:"0 -32px 80px rgba(28,15,6,0.18), 0 -1px 0 rgba(200,135,58,0.3)",
        overflow:"hidden",
      }}>

        {/* Amber top stripe */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg, transparent, ${T.amber} 30%, ${T.amberLight} 50%, ${T.amber} 70%, transparent)`,
        }}/>

        {/* Warm texture bg top */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:220,
          background:`radial-gradient(ellipse at 60% 0%, ${T.amberPale}60 0%, transparent 70%)`,
          pointerEvents:"none",
        }}/>

        <div style={{ position:"relative", zIndex:2 }}>
          {/* Handle */}
          <div style={{ display:"flex", justifyContent:"center", paddingTop:16 }}>
            <div style={{ width:40, height:4, borderRadius:2, background:T.amberLine }}/>
          </div>

          {/* Close */}
          <button onClick={close} style={{
            position:"absolute", top:16, right:18,
            width:34, height:34, borderRadius:"50%",
            background:T.bgDeep, border:`1px solid ${T.amberLine}`,
            color:T.inkMid, fontSize:12, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.2s",
          }}>✕</button>

          {/* Header */}
          <div style={{ textAlign:"center", padding:"28px 28px 0" }}>

            {/* Category pill */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:5,
              padding:"4px 12px", borderRadius:99,
              background:T.amberDim,
              border:`1px solid ${T.amberLine}`,
              fontFamily:"'Jost', sans-serif",
              fontSize:9, fontWeight:700,
              letterSpacing:"0.3em", textTransform:"uppercase",
              color:T.amber, marginBottom:20,
            }}>
              ✦ {partner.categoryLabel || partner.category}
            </div>

            {/* Emoji avatar */}
            <div style={{
              width:88, height:88, margin:"0 auto 20px",
              borderRadius:24,
              background:`linear-gradient(145deg, ${T.amberPale}, ${T.bgDeep})`,
              border:`2px solid ${T.amberLine}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:40,
              boxShadow:`0 8px 32px ${T.amberDim}, 0 2px 0 ${T.white}`,
            }}>{partner.emoji}</div>

            {/* Name */}
            <h2 style={{
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize:34, fontWeight:700,
              color:T.ink, margin:0, lineHeight:1.1,
            }}>{partner.name}</h2>

            {/* City */}
            <div style={{
              fontFamily:"'Jost', sans-serif",
              fontSize:11, fontWeight:500,
              color:T.inkLight, marginTop:6, letterSpacing:"0.15em",
              textTransform:"uppercase",
            }}>{partner.city}</div>

            {/* Stars */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"center",
              gap:6, marginTop:14,
            }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="13" height="13" viewBox="0 0 12 12" fill={T.amber}>
                  <polygon points="6,1 7.5,4.5 11,4.5 8.5,7 9.5,11 6,8.8 2.5,11 3.5,7 1,4.5 4.5,4.5"/>
                </svg>
              ))}
              <span style={{
                fontFamily:"'Jost', sans-serif",
                fontSize:12, color:T.inkLight, marginLeft:2,
              }}>Partenaire vérifié</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ margin:"24px 0 20px" }}>
            <WarmDivider/>
          </div>

          {/* Promo */}
          {hasPromo && (
            <div style={{
              margin:"0 24px 20px",
              padding:"14px 18px",
              background:`linear-gradient(90deg, ${T.amberDim}, rgba(200,135,58,0.06))`,
              border:`1px solid ${T.amberLine}`,
              borderRadius:12,
              display:"flex", alignItems:"center", gap:12,
            }}>
              <div style={{
                width:36, height:36, borderRadius:"50%",
                background:T.amber, display:"flex",
                alignItems:"center", justifyContent:"center", flexShrink:0,
                fontSize:16,
              }}>⏳</div>
              <div>
                <div style={{
                  fontFamily:"'Jost', sans-serif",
                  fontSize:11.5, fontWeight:700,
                  color:T.spice, letterSpacing:"0.05em",
                }}>{partner.promo}</div>
                {!cd.expired && (
                  <div style={{
                    fontFamily:"'Jost', sans-serif",
                    fontSize:11, color:T.inkLight, marginTop:2,
                  }}>Expire dans {cd.h}:{cd.m}:{cd.s}</div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <p style={{
            fontFamily:"'Jost', sans-serif",
            fontSize:14, fontWeight:300,
            color:T.inkMid, lineHeight:1.8,
            margin:"0 0 24px", padding:"0 28px",
            textAlign:"center",
          }}>{partner.description}</p>

          {/* Socials */}
          {(partner.socials?.instagram || partner.socials?.tiktok) && (
            <div style={{
              display:"flex", justifyContent:"center", gap:10, marginBottom:24,
            }}>
              {partner.socials.instagram && (
                <a href={partner.socials.instagram} target="_blank" rel="noreferrer" style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"8px 16px", borderRadius:99,
                  border:`1px solid ${T.amberLine}`,
                  background:T.bgDeep,
                  color:T.inkMid, textDecoration:"none",
                  fontFamily:"'Jost', sans-serif",
                  fontSize:10, fontWeight:600, letterSpacing:"0.1em",
                  transition:"all 0.2s",
                }}>
                  <IGIcon/> INSTAGRAM
                </a>
              )}
              {partner.socials.tiktok && (
                <a href={partner.socials.tiktok} target="_blank" rel="noreferrer" style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"8px 16px", borderRadius:99,
                  border:`1px solid ${T.amberLine}`,
                  background:T.bgDeep,
                  color:T.inkMid, textDecoration:"none",
                  fontFamily:"'Jost', sans-serif",
                  fontSize:10, fontWeight:600, letterSpacing:"0.1em",
                }}>
                  <TKIcon/> TIKTOK
                </a>
              )}
            </div>
          )}

          {/* Reassurance pills */}
          <div style={{
            display:"flex", justifyContent:"center", gap:8,
            padding:"0 20px 24px",
          }}>
            {[["✓", "Vérifié"], ["⭐", "Sélectionné"], ["🤝", "De confiance"]].map(([icon, label]) => (
              <div key={label} style={{
                padding:"5px 12px", borderRadius:99,
                background:T.bgDeep,
                border:`1px solid ${T.amberLine}`,
                fontFamily:"'Jost', sans-serif",
                fontSize:10, fontWeight:500,
                color:T.inkLight,
                display:"flex", alignItems:"center", gap:4,
              }}>
                <span style={{ fontSize:10 }}>{icon}</span> {label}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ padding:"0 24px 16px" }}>
            <button
              onClick={wa}
              onMouseEnter={() => setHovWa(true)}
              onMouseLeave={() => setHovWa(false)}
              style={{
                width:"100%", padding:"18px",
                borderRadius:16, border:"none",
                background: hovWa
                  ? `linear-gradient(135deg, ${T.amberLight}, ${T.amber})`
                  : `linear-gradient(135deg, ${T.amber}, ${T.spice})`,
                color:T.white,
                fontFamily:"'Jost', sans-serif",
                fontSize:11, fontWeight:700,
                letterSpacing:"0.2em", textTransform:"uppercase",
                cursor:"pointer",
                boxShadow: hovWa
                  ? `0 10px 36px ${T.amber}55`
                  : `0 6px 24px ${T.amber}35`,
                transform: hovWa ? "translateY(-1px)" : "translateY(0)",
                transition:"all 0.3s ease",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              }}>
              <span style={{ fontSize:18 }}>💬</span>
              Contacter via WhatsApp
            </button>
          </div>

          {/* Footer */}
          <div style={{
            textAlign:"center", padding:"12px 28px 32px",
            fontFamily:"'Cormorant Garamond', Georgia, serif",
            fontSize:12, fontStyle:"italic",
            color:T.inkFade,
          }}>
            Partenaire certifié AfroTresse ✦
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PARTNER CARD ─────────────────────────────────────────────────────────────
function PartnerCard({ partner, onClick }) {
  const [hov, setHov] = useState(false);
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? T.bgCardHov : T.bgCard,
        border:`1px solid ${hov ? T.amberLine : "rgba(200,135,58,0.10)"}`,
        borderRadius:20,
        padding:"18px 20px",
        cursor:"pointer",
        display:"flex", alignItems:"center", gap:16,
        transition:"all 0.28s cubic-bezier(.22,1,.36,1)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov
          ? `0 12px 40px rgba(200,135,58,0.12), 0 2px 0 ${T.amberPale}`
          : `0 2px 12px rgba(28,15,6,0.06)`,
        position:"relative", overflow:"hidden",
      }}
    >
      {/* Warm left accent */}
      <div style={{
        position:"absolute", left:0, top:"18%", bottom:"18%", width:3,
        background: hov
          ? `linear-gradient(180deg, transparent, ${T.amber}, transparent)`
          : "transparent",
        borderRadius:"0 2px 2px 0",
        transition:"all 0.3s",
      }}/>

      {/* Hover warm wash */}
      {hov && (
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(ellipse at 0% 50%, ${T.amberDim} 0%, transparent 60%)`,
        }}/>
      )}

      {/* Avatar */}
      <div style={{
        width:60, height:60, borderRadius:18, flexShrink:0,
        background: hov
          ? `linear-gradient(145deg, ${T.amberPale}, ${T.bgDeep})`
          : `linear-gradient(145deg, ${T.bgDeep}, ${T.cream})`,
        border:`1.5px solid ${hov ? T.amberLine : "rgba(200,135,58,0.12)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:28, transition:"all 0.28s",
        boxShadow: hov ? `0 4px 16px ${T.amberDim}` : "none",
      }}>{partner.emoji}</div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:"'Cormorant Garamond', Georgia, serif",
          fontSize:21, fontWeight:700,
          color:T.ink, lineHeight:1.2, marginBottom:3,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{partner.name}</div>

        <div style={{
          fontFamily:"'Jost', sans-serif",
          fontSize:9.5, fontWeight:600,
          letterSpacing:"0.2em", textTransform:"uppercase",
          color: hov ? T.amber : T.inkLight,
          transition:"color 0.2s",
        }}>{partner.city}</div>

        {hasPromo && (
          <div style={{
            display:"inline-flex", alignItems:"center", gap:4,
            marginTop:6, padding:"3px 9px",
            background:T.amberDim,
            border:`1px solid ${T.amberLine}`,
            borderRadius:99,
            fontFamily:"'Jost', sans-serif",
            fontSize:9, fontWeight:700,
            color:T.amber, letterSpacing:"0.08em",
          }}>
            ✦ {partner.promo}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div style={{
        color: hov ? T.amber : T.inkFade,
        fontSize:20, transition:"all 0.28s",
        transform: hov ? "translateX(3px)" : "translateX(0)",
        fontFamily:"serif", fontWeight:300,
      }}>›</div>
    </div>
  );
}

// ─── FEATURED CARD ────────────────────────────────────────────────────────────
function FeaturedCard({ partner, onClick }) {
  const [hov, setHov] = useState(false);
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? T.bgCardHov : T.white,
        border:`1.5px solid ${hov ? T.amber + "60" : T.amberLine}`,
        borderRadius:24, padding:"26px 22px",
        cursor:"pointer", position:"relative", overflow:"hidden",
        transition:"all 0.32s cubic-bezier(.22,1,.36,1)",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hov
          ? `0 20px 60px rgba(200,135,58,0.16), 0 2px 0 ${T.amberPale}`
          : `0 4px 24px rgba(28,15,6,0.07)`,
        marginBottom:4,
      }}
    >
      {/* Warm ambient top right */}
      <div style={{
        position:"absolute", top:-30, right:-30,
        width:150, height:150, borderRadius:"50%",
        background:`radial-gradient(circle, ${T.amberPale}80 0%, transparent 70%)`,
        pointerEvents:"none", transition:"opacity 0.3s",
        opacity: hov ? 1 : 0.5,
      }}/>

      {/* Top amber stripe */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:3,
        background:`linear-gradient(90deg, ${T.amber}, ${T.amberLight}, ${T.amber})`,
        borderRadius:"24px 24px 0 0",
      }}/>

      {/* Badge */}
      <div style={{
        position:"absolute", top:16, right:16,
        padding:"4px 12px", borderRadius:99,
        background:`linear-gradient(90deg, ${T.amber}, ${T.amberLight})`,
        fontFamily:"'Jost', sans-serif",
        fontSize:8, fontWeight:800,
        letterSpacing:"0.22em", textTransform:"uppercase",
        color:T.white,
        boxShadow:`0 3px 12px ${T.amber}40`,
      }}>✦ À la Une</div>

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:16, position:"relative", zIndex:1 }}>
        <div style={{
          width:72, height:72, borderRadius:20, flexShrink:0,
          background:`linear-gradient(145deg, ${T.amberPale}, ${T.bgDeep})`,
          border:`2px solid ${hov ? T.amber + "50" : T.amberLine}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:34, transition:"all 0.3s",
          boxShadow: hov ? `0 6px 24px ${T.amberDim}` : `0 2px 8px ${T.amberDim}`,
        }}>{partner.emoji}</div>

        <div>
          <div style={{
            fontFamily:"'Jost', sans-serif",
            fontSize:9, fontWeight:700,
            letterSpacing:"0.3em", textTransform:"uppercase",
            color:T.amber, marginBottom:5,
          }}>{partner.categoryLabel || partner.category}</div>
          <div style={{
            fontFamily:"'Cormorant Garamond', Georgia, serif",
            fontSize:27, fontWeight:700,
            color:T.ink, lineHeight:1.1,
          }}>{partner.name}</div>
          <div style={{
            fontFamily:"'Jost', sans-serif",
            fontSize:10, fontWeight:500,
            color:T.inkLight, marginTop:4, letterSpacing:"0.12em",
          }}>{partner.city?.toUpperCase()}</div>
        </div>
      </div>

      {/* Description */}
      {partner.description && (
        <p style={{
          fontFamily:"'Jost', sans-serif",
          fontSize:13, fontWeight:300,
          color:T.inkMid, lineHeight:1.75,
          margin:"0 0 16px", position:"relative", zIndex:1,
          display:"-webkit-box", WebkitLineClamp:2,
          WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>{partner.description}</p>
      )}

      {hasPromo && (
        <div style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"5px 14px", borderRadius:99,
          background:T.amberDim,
          border:`1px solid ${T.amberLine}`,
          fontFamily:"'Jost', sans-serif",
          fontSize:10, fontWeight:700,
          color:T.amber, letterSpacing:"0.08em",
        }}>⏳ {partner.promo}</div>
      )}

      <div style={{
        position:"absolute", bottom:20, right:20,
        color: hov ? T.amber : T.inkFade,
        fontSize:22, transition:"all 0.28s",
        transform: hov ? "translateX(4px)" : "translateX(0)",
        fontFamily:"serif",
      }}>›</div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Partners() {
  const [partners, setPartners]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const [heroLogoUrl, setHeroLogoUrl]   = useState(undefined); // undefined = chargement, null = pas de logo, string = URL
  const searchRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      // Charger le logo hero AfroTresse depuis settings
      const { data: settingData } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "partners_hero_logo")
        .single();
      setHeroLogoUrl(settingData?.value || null);

      const { data, error } = await supabase
        .from("partners").select("*")
        .eq("active", true)
        .order("is_featured", { ascending: false });
      if (!error) setPartners(data.map(mapPartner));
      setLoading(false);
    };
    fetch();
  }, []);

  const counts = {
    all:       partners.length,
    salon:     partners.filter(p => p.category === "salon").length,
    produits:  partners.filter(p => p.category === "produits").length,
    formation: partners.filter(p => p.category === "formation").length,
  };

  const filtered = partners.filter(p => {
    const matchCat = activeFilter === "all" || p.category === activeFilter;
    const q = search.trim().toLowerCase();
    return matchCat && (!q || p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q));
  });

  const featured = filtered.filter(p => p.is_featured);
  const standard = filtered.filter(p => !p.is_featured);

  return (
    <div style={{
      minHeight:"100vh",
      background:T.bg,
      display:"flex", justifyContent:"center",
      color:T.ink,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300;1,400&family=Jost:wght@300;400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
        input::placeholder { color: rgba(92,53,32,0.35); font-family:'Jost',sans-serif; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>

      <div style={{ width:"100%", maxWidth:440, paddingBottom:100 }}>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div style={{
          position:"relative", overflow:"hidden",
          padding:"56px 24px 80px",
          textAlign:"center",
          background:`linear-gradient(160deg, #3D1F0A 0%, #2C1A0E 60%, #1C0F06 100%)`,
          borderRadius:"0 0 44px 44px",
          boxShadow:`0 20px 60px rgba(28,15,6,0.20)`,
        }}>
          {/* Decorative circles */}
          <div style={{
            position:"absolute", top:-60, right:-60,
            width:200, height:200, borderRadius:"50%",
            border:`1px solid ${T.amberLine}`,
            opacity:0.3, pointerEvents:"none",
          }}/>
          <div style={{
            position:"absolute", top:-30, right:-30,
            width:120, height:120, borderRadius:"50%",
            border:`1px solid ${T.amberLine}`,
            opacity:0.4, pointerEvents:"none",
          }}/>
          <div style={{
            position:"absolute", bottom:-40, left:-40,
            width:140, height:140, borderRadius:"50%",
            border:`1px solid ${T.amberLine}`,
            opacity:0.25, pointerEvents:"none",
          }}/>

          {/* Amber top line */}
          <div style={{
            position:"absolute", top:0, left:0, right:0, height:2,
            background:`linear-gradient(90deg, transparent, ${T.amber}, ${T.amberLight}, ${T.amber}, transparent)`,
          }}/>

          <div style={{ position:"relative", zIndex:2 }}>
            {/* Logo AfroTresse — chargé depuis Supabase settings ou emoji fallback */}
            <div style={{
              width:66, height:66, margin:"0 auto 20px",
              borderRadius:20,
              background:`linear-gradient(145deg, ${T.amberPale}, ${T.bgDeep})`,
              border:`1.5px solid ${T.amberLine}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:30, overflow:"hidden",
              boxShadow:`0 8px 32px rgba(200,135,58,0.25)`,
              animation:"float 4s ease-in-out infinite",
            }}>
              {heroLogoUrl === undefined
                ? null
                : heroLogoUrl
                  ? <img src={heroLogoUrl} alt="AfroTresse" style={{ width:"100%", height:"100%", objectFit:"contain", padding:6 }} />
                  : "🌿"
              }
            </div>

            <div style={{
              fontFamily:"'Jost', sans-serif",
              fontSize:9, fontWeight:700,
              letterSpacing:"0.4em", textTransform:"uppercase",
              color:T.amber, marginBottom:12,
            }}>Expertise & Excellence</div>

            <h1 style={{
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize:38, fontWeight:700,
              color:T.cream, lineHeight:1.1, marginBottom:12,
            }}>
              Nos Partenaires<br/>
              <span style={{
                color:T.amberLight, fontStyle:"italic", fontWeight:300,
              }}>de confiance</span>
            </h1>

            <p style={{
              fontFamily:"'Jost', sans-serif",
              fontSize:12.5, fontWeight:300,
              color:"rgba(251,246,238,0.6)",
              lineHeight:1.75, maxWidth:255, margin:"0 auto",
            }}>
              Une sélection rigoureuse pour sublimer votre beauté afro.
            </p>

            {/* Trust bar */}
            <div style={{
              display:"flex", justifyContent:"center", gap:20,
              marginTop:22,
              fontFamily:"'Jost', sans-serif",
              fontSize:10, fontWeight:500,
              color:"rgba(251,246,238,0.45)",
            }}>
              {["Vérifiés", "Engagés", "Excellence"].map((l, i) => (
                <span key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                  {i > 0 && <span style={{ opacity:0.3 }}>·</span>}
                  <span style={{ color:T.amberLight }}>✦</span> {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── SEARCH ─────────────────────────────────────────────── */}
        <div style={{ padding:"0 20px", marginTop:"-30px", position:"relative", zIndex:20 }}>
          <div style={{
            display:"flex", alignItems:"center", gap:12,
            background:T.white,
            borderRadius:20, padding:"16px 20px",
            border:`1px solid ${T.amberLine}`,
            boxShadow:`0 16px 40px rgba(28,15,6,0.10)`,
          }}>
            <span style={{ fontSize:16, color:T.inkFade }}>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Chercher un salon, une ville..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex:1, border:"none", outline:"none",
                background:"transparent",
                fontFamily:"'Jost', sans-serif",
                fontSize:13.5, fontWeight:300,
                color:T.ink,
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                border:"none", background:T.bgDeep,
                color:T.amber, width:24, height:24, borderRadius:"50%",
                fontWeight:800, fontSize:10, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>✕</button>
            )}
          </div>
        </div>

        {/* ── FILTERS ────────────────────────────────────────────── */}
        <div style={{ padding:"22px 20px 8px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:8 }}>
            {CATEGORIES.map(cat => {
              const active = activeFilter === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveFilter(cat.id)} style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"9px 18px", borderRadius:99,
                  border:`1px solid ${active ? T.amber : T.amberLine}`,
                  background: active
                    ? `linear-gradient(135deg, ${T.amber}, ${T.spice})`
                    : T.white,
                  color: active ? T.white : T.inkMid,
                  fontFamily:"'Jost', sans-serif",
                  fontSize:11, fontWeight:600,
                  letterSpacing:"0.05em",
                  cursor:"pointer",
                  boxShadow: active ? `0 4px 16px ${T.amber}35` : "none",
                  transition:"all 0.22s ease",
                }}>
                  <span>{cat.emoji}</span>
                  {cat.label}
                  <span style={{ opacity:0.5, fontSize:10 }}>{counts[cat.id]}</span>
                </button>
              );
            })}
          </div>

          <div style={{
            textAlign:"center", marginTop:16,
            fontFamily:"'Jost', sans-serif",
            fontSize:9, fontWeight:600,
            color:T.inkFade, letterSpacing:"0.2em", textTransform:"uppercase",
          }}>
            {loading ? "Chargement..." : `${filtered.length} partenaires disponibles`}
          </div>
        </div>

        {/* ── LIST ───────────────────────────────────────────────── */}
        <div style={{ padding:"12px 20px 0", display:"flex", flexDirection:"column", gap:12 }}>
          {loading ? (
            <div style={{
              padding:"80px 0", textAlign:"center",
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize:18, fontStyle:"italic", color:T.inkFade,
            }}>Chargement des partenaires…</div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding:"60px 0", textAlign:"center",
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize:20, fontStyle:"italic", color:T.inkFade,
            }}>Aucun partenaire trouvé</div>
          ) : (
            <>
              {featured.map(p => (
                <FeaturedCard key={p.id} partner={p} onClick={() => setSelected(p)}/>
              ))}
              {featured.length > 0 && standard.length > 0 && (
                <div style={{ margin:"4px 0 8px" }}>
                  <WarmDivider/>
                </div>
              )}
              {standard.map(p => (
                <PartnerCard key={p.id} partner={p} onClick={() => setSelected(p)}/>
              ))}
            </>
          )}
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <div style={{
          textAlign:"center", padding:"40px 28px 20px",
          fontFamily:"'Cormorant Garamond', Georgia, serif",
          fontSize:13, fontStyle:"italic",
          color:T.inkFade, letterSpacing:"0.06em",
        }}>
          AfroTresse · Partenaires certifiés ✦
        </div>
      </div>

      {selected && <Modal partner={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}

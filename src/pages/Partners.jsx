import { useState, useEffect, useRef } from "react";
import { supabase } from "../services/supabase";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const T = {
  gold:      "#C9A84C",
  goldLight: "#E8C97A",
  goldPale:  "#F5E6C0",
  goldDim:   "rgba(201,168,76,0.18)",
  goldLine:  "rgba(201,168,76,0.30)",
  dark:      "#0A0705",
  dark2:     "#14100B",
  dark3:     "#1E1710",
  cream:     "#FAF5EC",
  creamDim:  "rgba(250,245,236,0.60)",
  creamFade: "rgba(250,245,236,0.25)",
  ink:       "#2C1A0E",
};

// ─── CATEGORIES ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",       label: "Tous",      emoji: "✦" },
  { id: "salon",     label: "Salon",     emoji: "💇🏾‍♀️" },
  { id: "produits",  label: "Produits",  emoji: "🧴" },
  { id: "formation", label: "Formation", emoji: "🎓" },
];

// ─── DATA MAPPER ─────────────────────────────────────────────────────────────
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

// ─── COUNTDOWN HOOK ──────────────────────────────────────────────────────────
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

// ─── GOLD PARTICLES (canvas) ─────────────────────────────────────────────────
function GoldParticles({ height = 220 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const pts = Array.from({ length: 22 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.3,
      s: Math.random() * 0.28 + 0.08,
      o: Math.random() * 0.45 + 0.08,
      d: (Math.random() - 0.5) * 0.25,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.o})`;
        ctx.fill();
        p.y -= p.s; p.x += p.d;
        if (p.y < -4) { p.y = canvas.height + 4; p.x = Math.random() * canvas.width; }
        if (p.x < -4 || p.x > canvas.width + 4) p.x = Math.random() * canvas.width;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [height]);
  return (
    <canvas ref={ref} style={{
      position:"absolute", inset:0, width:"100%", height,
      pointerEvents:"none", zIndex:0,
    }}/>
  );
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 28px" }}>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg, transparent, ${T.gold}50)` }}/>
      <svg width="10" height="10" viewBox="0 0 12 12" fill={T.gold} opacity="0.7">
        <polygon points="6,0 7,5 12,6 7,7 6,12 5,7 0,6 5,5"/>
      </svg>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${T.gold}50, transparent)` }}/>
    </div>
  );
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
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

// ─── MODAL PREMIUM ────────────────────────────────────────────────────────────
function Modal({ partner, onClose }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  const [vis, setVis] = useState(false);
  const [hovWa, setHovWa] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);

  const close = () => { setVis(false); setTimeout(onClose, 420); };
  const wa = () => window.open(
    `https://wa.me/${((partner.whatsapp || partner.phone) || "").replace(/\D/g,"")}?text=${encodeURIComponent("Bonjour, je vous contacte via AfroTresse 👑")}`,
    "_blank"
  );

  return (
    <div
      onClick={close}
      style={{
        position:"fixed", inset:0, zIndex:100,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        background: vis ? "rgba(8,4,2,0.88)" : "transparent",
        backdropFilter: vis ? "blur(14px)" : "none",
        transition:"all 0.45s cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:460,
          maxHeight:"94vh", overflowY:"auto",
          background:`linear-gradient(180deg, ${T.dark2} 0%, ${T.dark} 100%)`,
          borderRadius:"28px 28px 0 0",
          border:`1px solid ${T.goldLine}`,
          borderBottom:"none",
          transform: vis ? "translateY(0)" : "translateY(105%)",
          transition:"transform 0.55s cubic-bezier(0.19,1,0.22,1)",
          position:"relative",
          boxShadow:`0 -24px 80px rgba(0,0,0,0.7), 0 -1px 0 ${T.gold}35`,
          overflow:"hidden",
        }}
      >
        {/* Gold top line */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:1,
          background:`linear-gradient(90deg, transparent 0%, ${T.gold}90 40%, ${T.gold} 50%, ${T.gold}90 60%, transparent 100%)`,
        }}/>

        {/* Particles */}
        <GoldParticles height={300}/>

        {/* Content */}
        <div style={{ position:"relative", zIndex:2 }}>
          {/* Handle */}
          <div style={{ display:"flex", justifyContent:"center", paddingTop:16 }}>
            <div style={{ width:38, height:3, borderRadius:2, background:`${T.gold}35` }}/>
          </div>

          {/* Close */}
          <button onClick={close} style={{
            position:"absolute", top:16, right:18,
            width:34, height:34, borderRadius:"50%",
            background:`${T.gold}12`, border:`1px solid ${T.goldLine}`,
            color:T.gold, fontSize:12, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background 0.2s",
          }}>✕</button>

          {/* Header */}
          <div style={{ textAlign:"center", padding:"24px 28px 0" }}>
            {/* Orbe logo */}
            <div style={{
              width:84, height:84, margin:"0 auto 20px",
              borderRadius:"50%",
              background:`radial-gradient(circle at 35% 35%, ${T.gold}30, ${T.dark} 70%)`,
              border:`1px solid ${T.gold}55`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:38,
              boxShadow:`0 0 0 8px ${T.gold}08`,
            }}>{partner.emoji}</div>

            {/* Category overline */}
            <div style={{
              fontFamily:"'Jost', sans-serif",
              fontSize:9, fontWeight:600,
              letterSpacing:"0.35em", textTransform:"uppercase",
              color:T.gold, marginBottom:8,
            }}>{partner.categoryLabel || partner.category}</div>

            {/* Name */}
            <h2 style={{
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize:34, fontWeight:700,
              color:T.cream, margin:0, lineHeight:1.1,
            }}>{partner.name}</h2>

            {/* City */}
            <div style={{
              fontFamily:"'Jost', sans-serif",
              fontSize:11, fontWeight:400,
              color:T.creamDim, marginTop:6, letterSpacing:"0.12em",
            }}>{partner.city?.toUpperCase()}</div>
          </div>

          {/* Divider */}
          <div style={{ margin:"22px 0 18px" }}>
            <GoldDivider/>
          </div>

          {/* Promo countdown */}
          {hasPromo && (
            <div style={{
              margin:"0 24px 20px",
              padding:"14px 18px",
              background:`linear-gradient(90deg, ${T.gold}14, ${T.gold}08)`,
              border:`1px solid ${T.gold}35`,
              borderRadius:4,
              display:"flex", alignItems:"center", gap:12,
            }}>
              <span style={{ fontSize:20 }}>⏳</span>
              <div style={{ flex:1 }}>
                <div style={{
                  fontFamily:"'Jost', sans-serif",
                  fontSize:11, fontWeight:700,
                  color:T.goldLight, letterSpacing:"0.1em",
                  textTransform:"uppercase",
                }}>{partner.promo}</div>
                {!cd.expired && (
                  <div style={{
                    fontFamily:"'Jost', sans-serif",
                    fontSize:11, color:T.creamDim, marginTop:3,
                  }}>Expire dans {cd.h}:{cd.m}:{cd.s}</div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <p style={{
            fontFamily:"'Jost', sans-serif",
            fontSize:13.5, fontWeight:300,
            color:T.creamDim,
            lineHeight:1.75, margin:"0 0 24px",
            padding:"0 28px",
            textAlign:"center",
          }}>{partner.description}</p>

          {/* Socials */}
          {(partner.socials?.instagram || partner.socials?.tiktok || partner.socials?.facebook) && (
            <div style={{
              display:"flex", justifyContent:"center", gap:10, marginBottom:24,
            }}>
              {partner.socials.instagram && (
                <a href={partner.socials.instagram} target="_blank" rel="noreferrer"
                  style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"7px 14px", borderRadius:3,
                    border:`1px solid ${T.goldLine}`,
                    background:`${T.gold}0A`,
                    color:T.goldLight, textDecoration:"none",
                    fontFamily:"'Jost', sans-serif",
                    fontSize:10, fontWeight:600, letterSpacing:"0.1em",
                    transition:"background 0.2s",
                  }}>
                  <IGIcon/> INSTAGRAM
                </a>
              )}
              {partner.socials.tiktok && (
                <a href={partner.socials.tiktok} target="_blank" rel="noreferrer"
                  style={{
                    display:"flex", alignItems:"center", gap:6,
                    padding:"7px 14px", borderRadius:3,
                    border:`1px solid ${T.goldLine}`,
                    background:`${T.gold}0A`,
                    color:T.goldLight, textDecoration:"none",
                    fontFamily:"'Jost', sans-serif",
                    fontSize:10, fontWeight:600, letterSpacing:"0.1em",
                  }}>
                  <TKIcon/> TIKTOK
                </a>
              )}
            </div>
          )}

          {/* CTA WhatsApp */}
          <div style={{ padding:"0 24px 36px" }}>
            <button
              onClick={wa}
              onMouseEnter={() => setHovWa(true)}
              onMouseLeave={() => setHovWa(false)}
              style={{
                width:"100%", padding:"17px",
                borderRadius:3, border:"none",
                background: hovWa
                  ? `linear-gradient(135deg, ${T.goldLight}, ${T.gold})`
                  : `linear-gradient(135deg, ${T.gold}, #A07830)`,
                color:T.dark,
                fontFamily:"'Jost', sans-serif",
                fontSize:11, fontWeight:700,
                letterSpacing:"0.22em", textTransform:"uppercase",
                cursor:"pointer",
                boxShadow: hovWa
                  ? `0 8px 32px ${T.gold}55`
                  : `0 4px 20px ${T.gold}30`,
                transform: hovWa ? "translateY(-1px)" : "translateY(0)",
                transition:"all 0.3s ease",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              }}>
              <span style={{ fontSize:16 }}>💬</span>
              Contacter via WhatsApp
            </button>
          </div>

          {/* Bottom line */}
          <div style={{
            height:1, margin:"0 24px 20px",
            background:`linear-gradient(90deg, transparent, ${T.gold}30, transparent)`,
          }}/>

          {/* Footer trust */}
          <div style={{
            textAlign:"center", paddingBottom:32,
            fontFamily:"'Cormorant Garamond', Georgia, serif",
            fontSize:12, fontStyle:"italic",
            color:T.creamFade, letterSpacing:"0.06em",
          }}>
            Partenaire vérifié AfroTresse ✦
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PARTNER CARD PREMIUM ─────────────────────────────────────────────────────
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
        background: hov
          ? `linear-gradient(135deg, ${T.dark3} 0%, ${T.dark2} 100%)`
          : `linear-gradient(135deg, ${T.dark2} 0%, ${T.dark} 100%)`,
        border:`1px solid ${hov ? T.goldLine : T.gold + "18"}`,
        borderRadius:16,
        padding:"20px",
        cursor:"pointer",
        display:"flex", alignItems:"center", gap:16,
        transition:"all 0.3s cubic-bezier(.22,1,.36,1)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov
          ? `0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px ${T.gold}25`
          : `0 4px 20px rgba(0,0,0,0.35)`,
        position:"relative", overflow:"hidden",
      }}
    >
      {/* Subtle gold shimmer on hover */}
      {hov && (
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(ellipse at 20% 50%, ${T.gold}08 0%, transparent 60%)`,
        }}/>
      )}

      {/* Gold left accent bar */}
      <div style={{
        position:"absolute", left:0, top:"20%", bottom:"20%", width:2,
        background: hov
          ? `linear-gradient(180deg, transparent, ${T.gold}, transparent)`
          : "transparent",
        borderRadius:1, transition:"all 0.3s",
      }}/>

      {/* Emoji orb */}
      <div style={{
        width:58, height:58, borderRadius:"50%", flexShrink:0,
        background:`radial-gradient(circle at 35% 35%, ${T.gold}25, ${T.dark} 70%)`,
        border:`1px solid ${hov ? T.gold + "60" : T.gold + "25"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:26, transition:"all 0.3s",
        boxShadow: hov ? `0 0 16px ${T.gold}20` : "none",
      }}>{partner.emoji}</div>

      {/* Text */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:"'Cormorant Garamond', Georgia, serif",
          fontSize:20, fontWeight:700,
          color: hov ? T.cream : T.cream,
          lineHeight:1.2, marginBottom:3,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>{partner.name}</div>
        <div style={{
          fontFamily:"'Jost', sans-serif",
          fontSize:9, fontWeight:600,
          letterSpacing:"0.22em", textTransform:"uppercase",
          color: hov ? T.goldLight : T.gold,
          transition:"color 0.2s",
        }}>{partner.city}</div>

        {/* Promo badge inline */}
        {hasPromo && (
          <div style={{
            display:"inline-flex", alignItems:"center", gap:4,
            marginTop:6, padding:"3px 8px",
            background:`${T.gold}20`,
            border:`1px solid ${T.gold}35`,
            borderRadius:2,
            fontFamily:"'Jost', sans-serif",
            fontSize:9, fontWeight:700,
            color:T.goldLight, letterSpacing:"0.1em",
            textTransform:"uppercase",
          }}>
            ✦ {partner.promo}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div style={{
        color: hov ? T.gold : `${T.gold}40`,
        fontSize:18, transition:"all 0.3s",
        transform: hov ? "translateX(3px)" : "translateX(0)",
        fontFamily:"serif",
      }}>›</div>
    </div>
  );
}

// ─── FEATURED CARD (grande carte mise en avant) ────────────────────────────
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
        background:`linear-gradient(145deg, ${T.dark3} 0%, ${T.dark2} 60%, ${T.dark} 100%)`,
        border:`1px solid ${hov ? T.gold + "60" : T.gold + "30"}`,
        borderRadius:20, padding:"28px 24px",
        cursor:"pointer", position:"relative", overflow:"hidden",
        transition:"all 0.35s cubic-bezier(.22,1,.36,1)",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hov
          ? `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${T.gold}30`
          : `0 8px 32px rgba(0,0,0,0.45)`,
        marginBottom:8,
      }}
    >
      {/* Background glow */}
      <div style={{
        position:"absolute", top:-40, right:-40,
        width:160, height:160, borderRadius:"50%",
        background:`radial-gradient(circle, ${T.gold}15 0%, transparent 70%)`,
        pointerEvents:"none",
      }}/>

      {/* Featured badge */}
      <div style={{
        position:"absolute", top:16, right:16,
        padding:"4px 10px", borderRadius:2,
        background:`linear-gradient(90deg, ${T.gold}, #A07830)`,
        fontFamily:"'Jost', sans-serif",
        fontSize:8, fontWeight:700,
        letterSpacing:"0.25em", textTransform:"uppercase",
        color:T.dark,
      }}>✦ À la Une</div>

      <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:16, position:"relative", zIndex:1 }}>
        {/* Orb */}
        <div style={{
          width:70, height:70, borderRadius:"50%",
          background:`radial-gradient(circle at 35% 35%, ${T.gold}35, ${T.dark} 70%)`,
          border:`1px solid ${T.gold}60`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:32, flexShrink:0,
          boxShadow:`0 0 24px ${T.gold}20`,
        }}>{partner.emoji}</div>

        <div>
          <div style={{
            fontFamily:"'Jost', sans-serif",
            fontSize:9, fontWeight:600,
            letterSpacing:"0.3em", textTransform:"uppercase",
            color:T.gold, marginBottom:5,
          }}>{partner.categoryLabel || partner.category}</div>
          <div style={{
            fontFamily:"'Cormorant Garamond', Georgia, serif",
            fontSize:26, fontWeight:700, color:T.cream, lineHeight:1.1,
          }}>{partner.name}</div>
          <div style={{
            fontFamily:"'Jost', sans-serif",
            fontSize:10, fontWeight:400,
            color:T.creamDim, marginTop:4, letterSpacing:"0.12em",
          }}>{partner.city?.toUpperCase()}</div>
        </div>
      </div>

      {/* Description snippet */}
      {partner.description && (
        <p style={{
          fontFamily:"'Jost', sans-serif",
          fontSize:12.5, fontWeight:300,
          color:T.creamDim, lineHeight:1.7,
          margin:"0 0 16px", position:"relative", zIndex:1,
          display:"-webkit-box", WebkitLineClamp:2,
          WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>{partner.description}</p>
      )}

      {hasPromo && (
        <div style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"5px 12px", borderRadius:2,
          background:`${T.gold}18`,
          border:`1px solid ${T.gold}40`,
          fontFamily:"'Jost', sans-serif",
          fontSize:10, fontWeight:700,
          color:T.goldLight, letterSpacing:"0.1em",
          textTransform:"uppercase",
        }}>⏳ {partner.promo}</div>
      )}

      <div style={{
        position:"absolute", bottom:20, right:20,
        color: hov ? T.gold : `${T.gold}40`,
        fontSize:22, transition:"all 0.3s",
        transform: hov ? "translateX(4px)" : "translateX(0)",
        fontFamily:"serif",
      }}>›</div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Partners() {
  const [partners, setPartners]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("active", true)
        .order("is_featured", { ascending: false });
      if (!error) setPartners(data.map(mapPartner));
      setLoading(false);
    };
    fetchPartners();
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

  const featured  = filtered.filter(p => p.is_featured);
  const standard  = filtered.filter(p => !p.is_featured);

  return (
    <div style={{
      minHeight:"100vh",
      background:`radial-gradient(ellipse at 50% 0%, #1a0e06 0%, ${T.dark} 60%)`,
      display:"flex", justifyContent:"center",
      color:T.cream,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;0,700;1,300&family=Jost:wght@300;400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:${T.dark}; }
        ::-webkit-scrollbar-thumb { background:${T.gold}40; border-radius:2px; }
        .filter-btn { transition:all 0.22s ease; }
        .filter-btn:hover { border-color: ${T.gold}60 !important; color: ${T.goldLight} !important; }
        .filter-btn.active { background:${T.gold} !important; color:${T.dark} !important; border-color:${T.gold} !important; }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(201,168,76,0.3); }
          70%  { box-shadow: 0 0 0 10px rgba(201,168,76,0); }
          100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
        }
      `}</style>

      <div style={{ width:"100%", maxWidth:440, paddingBottom:100 }}>

        {/* ── HEADER PREMIUM ───────────────────────────────────────── */}
        <div style={{
          position:"relative", overflow:"hidden",
          padding:"64px 24px 88px",
          textAlign:"center",
          background:`linear-gradient(180deg, #1a0e06 0%, ${T.dark2} 100%)`,
          borderRadius:"0 0 40px 40px",
          boxShadow:`0 20px 60px rgba(0,0,0,0.5), inset 0 -1px 0 ${T.gold}30`,
        }}>
          <GoldParticles height={220}/>

          {/* Gold top accent */}
          <div style={{
            position:"absolute", top:0, left:0, right:0, height:1,
            background:`linear-gradient(90deg, transparent, ${T.gold}80, ${T.gold}, ${T.gold}80, transparent)`,
          }}/>

          <div style={{ position:"relative", zIndex:2 }}>
            {/* Logo orb */}
            <div style={{
              width:68, height:68, margin:"0 auto 20px",
              borderRadius:"50%",
              background:`radial-gradient(circle at 35% 35%, ${T.gold}30, ${T.dark} 70%)`,
              border:`1px solid ${T.gold}55`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:30,
              animation:"pulse-ring 3.5s ease-out infinite",
            }}>🌿</div>

            <div style={{
              fontFamily:"'Jost', sans-serif",
              fontSize:9, fontWeight:600,
              letterSpacing:"0.4em", textTransform:"uppercase",
              color:T.gold, marginBottom:12,
            }}>Expertise & Excellence</div>

            <h1 style={{
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize:38, fontWeight:700,
              color:T.cream, lineHeight:1.1,
              marginBottom:10,
            }}>
              Nos Partenaires<br/>
              <span style={{ color:T.gold, fontStyle:"italic", fontWeight:300 }}>de confiance</span>
            </h1>

            <p style={{
              fontFamily:"'Jost', sans-serif",
              fontSize:12.5, fontWeight:300,
              color:T.creamDim, lineHeight:1.7,
              maxWidth:260, margin:"0 auto",
            }}>
              Une sélection rigoureuse pour sublimer votre beauté afro.
            </p>
          </div>
        </div>

        {/* ── SEARCH BAR ───────────────────────────────────────────── */}
        <div style={{ padding:"0 20px", marginTop:"-30px", position:"relative", zIndex:20 }}>
          <div style={{
            display:"flex", alignItems:"center", gap:12,
            background:T.dark2,
            borderRadius:14,
            padding:"16px 20px",
            border:`1px solid ${T.goldLine}`,
            boxShadow:`0 16px 40px rgba(0,0,0,0.5)`,
          }}>
            <span style={{ fontSize:15, opacity:0.5 }}>🔍</span>
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
                color:T.cream,
                "::placeholder":{ color:T.creamFade },
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                border:"none",
                background:`${T.gold}18`,
                color:T.gold,
                width:24, height:24,
                borderRadius:"50%",
                fontWeight:700, fontSize:10,
                cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>✕</button>
            )}
          </div>
        </div>

        {/* ── FILTERS ──────────────────────────────────────────────── */}
        <div style={{ padding:"24px 20px 8px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`filter-btn${activeFilter === cat.id ? " active" : ""}`}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"9px 16px", borderRadius:3,
                  border:`1px solid ${T.goldLine}`,
                  background: activeFilter === cat.id ? T.gold : `${T.gold}08`,
                  color: activeFilter === cat.id ? T.dark : T.creamDim,
                  fontFamily:"'Jost', sans-serif",
                  fontSize:11, fontWeight:600,
                  letterSpacing:"0.06em",
                  cursor:"pointer",
                }}
              >
                <span>{cat.emoji}</span>
                {cat.label}
                <span style={{ opacity:0.5, fontSize:10 }}>{counts[cat.id]}</span>
              </button>
            ))}
          </div>

          <div style={{
            textAlign:"center", marginTop:16,
            fontFamily:"'Jost', sans-serif",
            fontSize:9, fontWeight:600,
            color:`${T.gold}50`, letterSpacing:"0.2em", textTransform:"uppercase",
          }}>
            {loading ? "Chargement..." : `${filtered.length} partenaires`}
          </div>
        </div>

        {/* ── PARTNER LIST ─────────────────────────────────────────── */}
        <div style={{ padding:"12px 20px 0", display:"flex", flexDirection:"column", gap:12 }}>
          {loading ? (
            <div style={{
              padding:"80px 0", textAlign:"center",
              fontFamily:"'Jost', sans-serif",
              fontSize:9, fontWeight:600,
              color:`${T.gold}40`, letterSpacing:"0.3em", textTransform:"uppercase",
            }}>
              ✦ &nbsp; Chargement en cours...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding:"60px 0", textAlign:"center",
              fontFamily:"'Cormorant Garamond', Georgia, serif",
              fontSize:20, fontStyle:"italic", color:T.creamFade,
            }}>
              Aucun partenaire trouvé
            </div>
          ) : (
            <>
              {/* Featured cards (grandes) */}
              {featured.map(p => (
                <FeaturedCard key={p.id} partner={p} onClick={() => setSelected(p)}/>
              ))}

              {/* Separator if both types present */}
              {featured.length > 0 && standard.length > 0 && (
                <div style={{ margin:"4px 0 8px" }}>
                  <GoldDivider/>
                </div>
              )}

              {/* Standard cards */}
              {standard.map(p => (
                <PartnerCard key={p.id} partner={p} onClick={() => setSelected(p)}/>
              ))}
            </>
          )}
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <div style={{
          textAlign:"center", padding:"40px 28px 20px",
          fontFamily:"'Cormorant Garamond', Georgia, serif",
          fontSize:12, fontStyle:"italic",
          color:`${T.cream}20`, letterSpacing:"0.08em",
        }}>
          AfroTresse · Partenaires vérifiés ✦
        </div>
      </div>

      {selected && <Modal partner={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}

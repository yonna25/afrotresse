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

// ─── CATEGORIES (Indépendante ajoutée) ────────────────────────────────────────
const CATEGORIES = [
  { id: "all",         label: "Tous",          emoji: "✦" },
  { id: "salon",       label: "Salon",         emoji: "💇🏾‍♀️" },
  { id: "independante",label: "Indépendante",  emoji: "✨" },
  { id: "domicile",    label: "À domicile",    emoji: "🏠" },
  { id: "produits",    label: "Produits",      emoji: "🧴" },
  { id: "formation",   label: "Formation",     emoji: "🎓" },
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

// ─── MODAL (Avec WhatsApp flouté pour Freemium) ───────────────────────────────
function Modal({ partner, onClose }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  const [vis, setVis] = useState(false);
  const [hovWa, setHovWa] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 420); };
  const wa = () => {
    if (!partner.is_premium) return;
    window.open(`https://wa.me/${(partner.whatsapp || "").replace(/\D/g,"")}?text=${encodeURIComponent("Bonjour, je vous contacte via AfroTresse 👑")}`, "_blank");
  };

  return (
    <div onClick={close} style={{
      position:"fixed", inset:0, zIndex:100,
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      background: vis ? "rgba(28,15,6,0.55)" : "transparent",
      backdropFilter: vis ? "blur(16px)" : "none",
      transition:"all 0.45s cubic-bezier(0.23,1,0.32,1)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width:"100%", maxWidth:460, maxHeight:"94vh", overflowY:"auto",
        background:T.white, borderRadius:"32px 32px 0 0",
        transform: vis ? "translateY(0)" : "translateY(105%)",
        transition:"transform 0.55s cubic-bezier(0.19,1,0.22,1)",
        position:"relative", border:`1px solid ${T.amberLine}`, borderBottom:"none",
        boxShadow:"0 -32px 80px rgba(28,15,6,0.18)", overflow:"hidden",
      }}>
        <div style={{ position:"relative", zIndex:2 }}>
          <div style={{ display:"flex", justifyContent:"center", paddingTop:16 }}>
            <div style={{ width:40, height:4, borderRadius:2, background:T.amberLine }}/>
          </div>

          <button onClick={close} style={{
            position:"absolute", top:16, right:18, width:34, height:34, borderRadius:"50%",
            background:T.bgDeep, border:`1px solid ${T.amberLine}`, color:T.inkMid, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>✕</button>

          <div style={{ textAlign:"center", padding:"28px 28px 0" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 99,
              background: T.amberDim, border: `1px solid ${T.amberLine}`, fontFamily: "'Jost', sans-serif",
              fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: T.amber, marginBottom: 20,
            }}>✦ {partner.categoryLabel}</div>

            <div style={{
              width:88, height:88, margin:"0 auto 20px", borderRadius:24,
              background:`linear-gradient(145deg, ${T.amberPale}, ${T.bgDeep})`,
              border:`2px solid ${T.amberLine}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40,
            }}>{partner.emoji}</div>

            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:34, fontWeight:700, color:T.ink, margin:0 }}>{partner.name}</h2>
            <div style={{ fontFamily:"'Jost', sans-serif", fontSize:11, fontWeight:500, color:T.inkLight, marginTop:6, letterSpacing:"0.15em", textTransform:"uppercase" }}>{partner.city}</div>
          </div>

          <div style={{ margin:"24px 0 20px" }}><WarmDivider/></div>

          <p style={{ padding:"0 28px", textAlign:"center", fontSize:14, color:T.inkMid, lineHeight:1.8 }}>{partner.description}</p>

          <div style={{ padding:"24px 24px 32px" }}>
            <button
              onClick={wa}
              onMouseEnter={() => setHovWa(true)}
              onMouseLeave={() => setHovWa(false)}
              style={{
                width:"100%", padding:"18px", borderRadius:16, border:"none",
                background: partner.is_premium ? `linear-gradient(135deg, ${T.amber}, ${T.spice})` : T.bgDeep,
                color: partner.is_premium ? T.white : T.inkFade,
                fontFamily:"'Jost', sans-serif", fontSize:11, fontWeight:700,
                letterSpacing:"0.2em", textTransform:"uppercase",
                cursor: partner.is_premium ? "pointer" : "default",
                boxShadow: (hovWa && partner.is_premium) ? `0 10px 36px ${T.amber}55` : "none",
                transition:"all 0.3s", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              }}>
              <span style={{ fontSize:18 }}>{partner.is_premium ? "💬" : "🔒"}</span>
              <span style={{ filter: partner.is_premium ? "none" : "blur(4px)" }}>
                {partner.is_premium ? `Contacter ${partner.whatsapp}` : "Contact Réservé Premium"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INSCRIPTION FORM (Multi-step logic préservée) ────────────────────────────
function InscriptionForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", city:"", category:"salon", whatsapp:"", description:"", email:"" });
  const [status, setStatus] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const next = () => setStep(s => s + 1);
  
  const submit = async () => {
    if (!form.name || !form.city || !form.whatsapp) { setStatus("error"); return; }
    setStatus("loading");
    const { error } = await supabase.from("partners").insert([{
      ...form, active: false, is_premium: false,
      emoji: CATEGORIES.find(c => c.id === form.category)?.emoji || "✨"
    }]);
    setStatus(error ? "error" : "success");
  };

  if (status === "success") return <div style={{ textAlign:"center", padding:20 }}>Demande envoyée ! ✦</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, paddingBottom: 20 }}>
      {step === 1 ? (
        <>
          <input type="text" placeholder="Nom du salon / Nom d'indépendante" value={form.name} onChange={e => set("name", e.target.value)} style={inS} />
          <input type="text" placeholder="Ville" value={form.city} onChange={e => set("city", e.target.value)} style={inS} />
          <select value={form.category} onChange={e => set("category", e.target.value)} style={inS}>
            {CATEGORIES.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button onClick={next} style={btnS}>Continuer</button>
        </>
      ) : (
        <>
          <input type="tel" placeholder="WhatsApp (ex: +33...)" value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} style={inS} />
          <textarea placeholder="Description..." value={form.description} onChange={e => set("description", e.target.value)} rows={3} style={inS} />
          <button onClick={submit} disabled={status === "loading"} style={btnS}>
            {status === "loading" ? "Envoi..." : "✦ Finaliser l'inscription"}
          </button>
          <button onClick={() => setStep(1)} style={{ background:"none", border:"none", color:T.inkLight, cursor:"pointer", fontSize:11 }}>Retour</button>
        </>
      )}
    </div>
  );
}

const inS = { width:"100%", padding:14, borderRadius:12, border:`1px solid ${T.amberLine}`, outline:"none", fontSize:14 };
const btnS = { width:"100%", padding:16, borderRadius:14, border:"none", background:T.ink, color:T.white, fontWeight:700, cursor:"pointer" };

// ─── MAIN PARTNERS COMPONENT ──────────────────────────────────────────────────
export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchPartners = async () => {
      const { data } = await supabase.from("partners").select("*").eq("active", true);
      if (data) setPartners(data.map(mapPartner));
      setLoading(false);
    };
    fetchPartners();
  }, []);

  const filtered = filter === "all" ? partners : partners.filter(p => p.category === filter);

  return (
    <div style={{ backgroundColor:T.bg, minHeight:"100vh", padding:"40px 20px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        
        {/* Filtres */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center", marginBottom:40 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setFilter(cat.id)} style={{
              padding:"10px 20px", borderRadius:30, border:`1px solid ${T.amberLine}`,
              background: filter === cat.id ? T.amber : T.white,
              color: filter === cat.id ? T.white : T.inkMid,
              cursor:"pointer", transition:"0.2s"
            }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Accordéon Inscription */}
        <div style={{ maxWidth: 500, margin: "0 auto 60px", background:T.white, borderRadius:24, border:`1px solid ${T.amberLine}`, overflow:"hidden", boxShadow:`0 10px 40px ${T.amberDim}` }}>
          <button onClick={() => setShowForm(!showForm)} style={{
            width:"100%", padding:24, border:"none", background:"none", cursor:"pointer",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            fontFamily:"'Jost', sans-serif", fontWeight:700, color:T.spice
          }}>
            <span>✦ INSCRIRE MON ACTIVITÉ GRATUITEMENT</span>
            <span style={{ transform: showForm ? "rotate(180deg)" : "rotate(0deg)", transition:"0.3s" }}>▼</span>
          </button>
          <div style={{ maxHeight: showForm ? "1000px" : "0", transition:"max-height 0.5s ease-in-out", overflow:"hidden", padding: showForm ? "0 24px 24px" : "0 24px" }}>
            <InscriptionForm />
          </div>
        </div>

        {/* Grille des Partenaires */}
        {loading ? (
          <div style={{ textAlign:"center", color:T.amber }}>Chargement...</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:24 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelected(p)} style={{
                background:T.white, padding:28, borderRadius:24, border:`1px solid ${T.amberLine}`, cursor:"pointer",
                transition:"all 0.3s cubic-bezier(0.23,1,0.32,1)",
              }}>
                <div style={{ fontSize:36, marginBottom:16 }}>{p.emoji}</div>
                <h3 style={{ margin:"0 0 6px", fontFamily:"'Cormorant Garamond', serif", fontSize:22 }}>{p.name}</h3>
                <div style={{ fontSize:11, color:T.amber, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em" }}>
                  {p.city} • {p.categoryLabel}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:80, opacity:0.4, fontSize:12 }}>
          AfroTresse · Partenaires certifiés ✦ 2026
        </div>
      </div>
      {selected && <Modal partner={selected} onClose={() => setSelected(null)} />}
    </div>
  );
    }
      

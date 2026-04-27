import { useState, useEffect } from "react";

const CATEGORIES = [
  { id: "all", label: "Tous", emoji: "✺" },
  { id: "salon", label: "Salon", emoji: "💇🏾‍♀️" },
  { id: "produits", label: "Produits", emoji: "🧴" },
  { id: "formation", label: "Formation", emoji: "🎓" },
];

const PARTNERS = [
  { id:1, category:"salon", name:"Queens Hair Studio", city:"Paris · 10ème", categoryLabel:"Salon d'exception", emoji:"👑", description:"Un sanctuaire dédié à la beauté afro depuis 2015. Nos artistes certifiées sculptent chaque tresse avec la précision et l'amour qu'une reine mérite.", promo:"-15% sur toutes les nattes", promo_deadline:new Date(Date.now()+1000*60*60*8+1000*60*27).toISOString(), whatsapp:"+33612345678", socials:{instagram:"queenshairstudio",tiktok:"queenshairstudio"}, rating:4.9, reviews:312, badge:"Top Partenaire" },
  { id:2, category:"salon", name:"Nappy Kingdom", city:"Abidjan · Cocody", categoryLabel:"Salon Premium", emoji:"✨", description:"Depuis 2019, Nappy Kingdom est la référence des tresses créatives à Abidjan. Chaque cliente repart couronnée d'une œuvre unique.", promo:"Offre duo : 2 coiffures pour le prix d'1", promo_deadline:new Date(Date.now()+1000*60*60*3+1000*60*15).toISOString(), whatsapp:"+2250712345678", socials:{instagram:"nappykingdom_ci",tiktok:"nappykingdom"}, rating:4.8, reviews:214, badge:"Certifié AfroTresse" },
  { id:3, category:"salon", name:"Tresses & Majesté", city:"Dakar · Almadies", categoryLabel:"Atelier Artisanal", emoji:"🌿", description:"Un atelier familial qui perpétue les traditions de tressage sénégalais depuis trois générations.", promo:null, promo_deadline:null, whatsapp:"+221771234567", socials:{instagram:"tresses_majeste"}, rating:5.0, reviews:89, badge:"Coup de cœur" },
  { id:4, category:"produits", name:"NaturAfro Shop", city:"Cotonou · en ligne", categoryLabel:"Cosmétiques Naturels", emoji:"🌺", description:"Huiles, beurres et soins 100% naturels formulés pour les cheveux afro texturés. Expédition dans toute l'UEMOA.", promo:"-10% avec le code AFROTRESSE", promo_deadline:new Date(Date.now()+1000*60*60*24*5).toISOString(), whatsapp:"+22997123456", socials:{instagram:"naturafro_shop",tiktok:"naturafro"}, rating:4.7, reviews:203, badge:"Partenaire Officiel" },
  { id:5, category:"produits", name:"Kanekalon Premium", city:"Lomé · Adidogomé", categoryLabel:"Accessoires & Fibres", emoji:"🪢", description:"Importateur exclusif de fibres kanekalon haute qualité au Togo. Toutes les couleurs, toutes les textures pour vos créations.", promo:null, promo_deadline:null, whatsapp:"+22890123456", socials:{instagram:"kanekalon_tg"}, rating:4.6, reviews:118, badge:"Fournisseur Certifié" },
  { id:6, category:"formation", name:"École des Tresses", city:"Bamako · Hamdallaye", categoryLabel:"Centre de Formation", emoji:"🎓", description:"Formation certifiante en tressage africain : de débutante à professionnelle en 3 mois. Cours en présentiel et en ligne disponibles.", promo:"Inscription offerte en juillet", promo_deadline:new Date(Date.now()+1000*60*60*24*12).toISOString(), whatsapp:"+22376123456", socials:{instagram:"ecoledestresses_ml",tiktok:"ecoledestresses"}, rating:4.9, reviews:67, badge:"Formation Certifiante" },
  { id:7, category:"formation", name:"BraidsAcademy CI", city:"Abidjan · Plateau", categoryLabel:"Académie Professionnelle", emoji:"🏆", description:"L'académie de référence pour les professionnelles du tressage en Côte d'Ivoire. Masterclasses, techniques avancées, business coaching.", promo:null, promo_deadline:null, whatsapp:"+2250512345678", socials:{instagram:"braidsacademy_ci"}, rating:4.8, reviews:45, badge:"Expert AfroTresse" },
];

function useCountdown(deadline) {
  const [t, setT] = useState({ h:"00", m:"00", s:"00", expired:false });
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setT({ h:"00",m:"00",s:"00",expired:true }); return; }
      setT({ h:String(Math.floor(diff/3600000)).padStart(2,"0"), m:String(Math.floor((diff%3600000)/60000)).padStart(2,"0"), s:String(Math.floor((diff%60000)/1000)).padStart(2,"0"), expired:false });
    };
    tick();
    const id = setInterval(tick,1000);
    return () => clearInterval(id);
  }, [deadline]);
  return t;
}

const IGIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
const TKIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>;
const WAIcon = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>;

function Modal({ partner, onClose }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  const [vis, setVis] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  const close = () => { setVis(false); setTimeout(onClose, 380); };
  const wa = () => window.open(`https://wa.me/${partner.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent("Bonjour, je vous contacte via AfroTresse 👑")}`, "_blank");

  return (
    <div onClick={close} style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"center", background:vis?"rgba(4,2,0,0.85)":"transparent", backdropFilter:vis?"blur(24px)":"none", transition:"all 0.4s ease" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto", background:"#0A0602", borderRadius:"32px 32px 0 0", transform:vis?"translateY(0)":"translateY(100%)", transition:"transform 0.42s cubic-bezier(0.22,1,0.36,1)", position:"relative", overflow:"hidden", border:"1px solid rgba(201,150,58,0.2)", borderBottom:"none" }}>
        <div style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)" }}/>
        <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"60%", height:1, background:"linear-gradient(90deg,transparent,rgba(201,150,58,0.6),transparent)", zIndex:1 }}/>
        <div style={{ display:"flex", justifyContent:"center", padding:"16px 0 8px", position:"relative", zIndex:2 }}>
          <div style={{ width:36, height:3, borderRadius:99, background:"rgba(201,150,58,0.25)" }}/>
        </div>
        <button onClick={close} style={{ position:"absolute", top:14, right:18, zIndex:10, width:34, height:34, borderRadius:99, background:"rgba(201,150,58,0.08)", border:"1px solid rgba(201,150,58,0.15)", cursor:"pointer", color:"rgba(201,150,58,0.6)", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>

        <div style={{ padding:"4px 26px 56px", position:"relative", zIndex:2 }}>
          {/* Identité */}
          <div style={{ marginBottom:28, paddingTop:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
              <div style={{ width:72, height:72, borderRadius:20, flexShrink:0, background:"linear-gradient(145deg,#1C1008,#120A04)", border:"1px solid rgba(201,150,58,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>{partner.emoji}</div>
              <div>
                <div style={{ fontSize:8, fontWeight:800, letterSpacing:"0.35em", textTransform:"uppercase", color:"rgba(201,150,58,0.55)", marginBottom:6, fontFamily:"sans-serif" }}>{partner.categoryLabel}</div>
                <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:26, fontWeight:700, color:"#F7F0E6", lineHeight:1.0 }}>{partner.name}</div>
                <div style={{ fontSize:9, fontWeight:800, letterSpacing:"0.35em", textTransform:"uppercase", color:"#C9963A", marginTop:7, fontFamily:"sans-serif" }}>{partner.city}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display:"flex", gap:3 }}>{[1,2,3,4,5].map(i=><svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i<=Math.round(partner.rating)?"#C9963A":"none"} stroke={i<=Math.round(partner.rating)?"#C9963A":"rgba(201,150,58,0.3)"} strokeWidth="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>)}</div>
              <span style={{ fontSize:12, color:"rgba(247,240,230,0.5)", fontFamily:"sans-serif" }}>{partner.rating} · {partner.reviews} avis</span>
              <div style={{ marginLeft:"auto", fontSize:8, fontWeight:800, letterSpacing:"0.15em", textTransform:"uppercase", padding:"4px 10px", borderRadius:99, background:"rgba(201,150,58,0.1)", color:"#C9963A", border:"1px solid rgba(201,150,58,0.2)", fontFamily:"sans-serif" }}>{partner.badge}</div>
            </div>
          </div>

          {/* Promo */}
          {hasPromo && (
            <div style={{ marginBottom:26, borderRadius:20, overflow:"hidden", border:"1px solid rgba(201,150,58,0.25)" }}>
              <div style={{ height:2, background:"linear-gradient(90deg,#C9963A,#E8B96A,#C9963A)" }}/>
              <div style={{ background:"rgba(201,150,58,0.06)", padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <div style={{ width:7, height:7, borderRadius:99, background:"#C9963A", animation:"flicker 1.8s ease-in-out infinite" }}/>
                  <span style={{ fontSize:8, fontWeight:800, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(201,150,58,0.7)", fontFamily:"sans-serif" }}>Offre Exclusive · Durée limitée</span>
                </div>
                <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:20, fontWeight:600, fontStyle:"italic", color:"#F7F0E6", marginBottom:16, lineHeight:1.2 }}>{partner.promo}</div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:9, color:"rgba(247,240,230,0.3)", fontWeight:700, letterSpacing:"0.1em", fontFamily:"sans-serif" }}>EXPIRE DANS</span>
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    {[{v:cd.h,l:"H"},{v:cd.m,l:"M"},{v:cd.s,l:"S"}].map(({v,l},i)=>(
                      <div key={l} style={{ display:"flex", alignItems:"center", gap:i<2?4:0 }}>
                        <div style={{ background:"rgba(0,0,0,0.4)", border:"1px solid rgba(201,150,58,0.2)", borderRadius:8, padding:"5px 8px", textAlign:"center", minWidth:36 }}>
                          <div style={{ fontSize:17, fontWeight:900, color:"#C9963A", lineHeight:1 }}>{v}</div>
                          <div style={{ fontSize:6, color:"rgba(201,150,58,0.35)", fontWeight:800, marginTop:2 }}>{l}</div>
                        </div>
                        {i<2&&<span style={{ color:"rgba(201,150,58,0.3)", fontSize:16, fontWeight:900 }}>:</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom:26 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,rgba(201,150,58,0.4),transparent)" }}/>
              <span style={{ fontSize:8, fontWeight:800, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(201,150,58,0.4)", fontFamily:"sans-serif" }}>Notre histoire</span>
              <div style={{ flex:1, height:"1px", background:"linear-gradient(270deg,rgba(201,150,58,0.4),transparent)" }}/>
            </div>
            <p style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:15, fontStyle:"italic", color:"rgba(247,240,230,0.65)", lineHeight:1.85, margin:0 }}>« {partner.description} »</p>
          </div>

          {/* Réseaux */}
          {partner.socials && Object.keys(partner.socials).length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,rgba(201,150,58,0.4),transparent)" }}/>
                <span style={{ fontSize:8, fontWeight:800, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(201,150,58,0.4)", fontFamily:"sans-serif" }}>Nous suivre</span>
                <div style={{ flex:1, height:"1px", background:"linear-gradient(270deg,rgba(201,150,58,0.4),transparent)" }}/>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {partner.socials.instagram && <button onClick={()=>window.open(`https://instagram.com/${partner.socials.instagram}`,"_blank")} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px 0", borderRadius:14, cursor:"pointer", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(247,240,230,0.5)", fontSize:12, fontWeight:700, fontFamily:"sans-serif" }}><IGIcon/> Instagram</button>}
                {partner.socials.tiktok && <button onClick={()=>window.open(`https://tiktok.com/@${partner.socials.tiktok}`,"_blank")} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px 0", borderRadius:14, cursor:"pointer", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", color:"rgba(247,240,230,0.5)", fontSize:12, fontWeight:700, fontFamily:"sans-serif" }}><TKIcon/> TikTok</button>}
              </div>
            </div>
          )}

          <button onClick={wa} style={{ width:"100%", padding:"18px 0", borderRadius:20, cursor:"pointer", background:"linear-gradient(135deg,#1C1008,#0A0602)", border:"1px solid rgba(201,150,58,0.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:12, color:"#C9963A", fontSize:14, fontWeight:800, letterSpacing:"0.05em", fontFamily:"sans-serif" }}>
            <WAIcon/> Prendre rendez-vous sur WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function PartnerCard({ partner, onClick }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  return (
    <div onClick={onClick} style={{ background:"linear-gradient(145deg,#120A04,#0A0602)", border:"1px solid rgba(201,150,58,0.18)", borderRadius:24, padding:"18px 18px 16px", cursor:"pointer", position:"relative", overflow:"hidden", transition:"transform 0.2s,box-shadow 0.2s" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(201,150,58,0.12)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none"}}
    >
      <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background:"linear-gradient(90deg,transparent,rgba(201,150,58,0.4),transparent)" }}/>
      {hasPromo && (
        <div style={{ position:"absolute", top:14, right:14, background:"rgba(201,150,58,0.15)", border:"1px solid rgba(201,150,58,0.3)", borderRadius:99, padding:"3px 10px", fontSize:8, fontWeight:800, letterSpacing:"0.2em", textTransform:"uppercase", color:"#C9963A", fontFamily:"sans-serif", display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:5, height:5, borderRadius:99, background:"#C9963A", animation:"flicker 1.8s ease-in-out infinite" }}/> Promo
        </div>
      )}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
        <div style={{ width:56, height:56, borderRadius:16, flexShrink:0, background:"linear-gradient(145deg,#2A1A0A,#180E04)", border:"1px solid rgba(201,150,58,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{partner.emoji}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:7, fontWeight:800, letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(201,150,58,0.5)", marginBottom:4, fontFamily:"sans-serif" }}>{partner.categoryLabel}</div>
          <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:19, fontWeight:700, color:"#F7F0E6", lineHeight:1.1 }}>{partner.name}</div>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:"0.25em", textTransform:"uppercase", color:"#C9963A", marginTop:4, fontFamily:"sans-serif" }}>{partner.city}</div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:12, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ display:"flex", gap:2 }}>{[1,2,3,4,5].map(i=><svg key={i} width="9" height="9" viewBox="0 0 24 24" fill={i<=Math.round(partner.rating)?"#C9963A":"none"} stroke={i<=Math.round(partner.rating)?"#C9963A":"rgba(201,150,58,0.25)"} strokeWidth="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>)}</div>
          <span style={{ fontSize:11, color:"rgba(247,240,230,0.45)", fontFamily:"sans-serif" }}>{partner.rating} · {partner.reviews} avis</span>
        </div>
        <div style={{ fontSize:7, fontWeight:800, letterSpacing:"0.15em", textTransform:"uppercase", padding:"3px 9px", borderRadius:99, background:"rgba(201,150,58,0.08)", color:"rgba(201,150,58,0.7)", border:"1px solid rgba(201,150,58,0.15)", fontFamily:"sans-serif" }}>{partner.badge}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const counts = { all:PARTNERS.length, salon:PARTNERS.filter(p=>p.category==="salon").length, produits:PARTNERS.filter(p=>p.category==="produits").length, formation:PARTNERS.filter(p=>p.category==="formation").length };
  const filtered = activeFilter === "all" ? PARTNERS : PARTNERS.filter(p => p.category === activeFilter);

  return (
    <div style={{ minHeight:"100vh", background:"#0A0602", display:"flex", justifyContent:"center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        @keyframes flicker { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      <div style={{ width:"100%", maxWidth:430, paddingBottom:80 }}>

        {/* Header */}
        <div style={{ padding:"32px 22px 20px", position:"relative" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:"40%", background:"radial-gradient(ellipse at top,rgba(201,150,58,0.07),transparent)", pointerEvents:"none" }}/>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(201,150,58,0.5)", marginBottom:10, fontFamily:"sans-serif" }}>AfroTresse · Partenaires</div>
          <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:30, fontWeight:700, color:"#F7F0E6", lineHeight:1.1, marginBottom:8 }}>
            Nos partenaires<br/><span style={{ color:"#C9963A" }}>de confiance</span>
          </div>
          <p style={{ fontSize:12, color:"rgba(247,240,230,0.4)", fontFamily:"sans-serif", lineHeight:1.6 }}>
            Des professionnelles sélectionnées par AfroTresse pour vous accompagner.
          </p>
        </div>

        {/* Filtres */}
        <div style={{ padding:"0 16px 20px" }}>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
            {CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.id;
              return (
                <button key={cat.id} onClick={() => setActiveFilter(cat.id)} style={{ flexShrink:0, display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:99, cursor:"pointer", fontFamily:"sans-serif", fontSize:11, fontWeight:800, letterSpacing:"0.05em", transition:"all 0.2s", background:isActive?"#C9963A":"rgba(201,150,58,0.08)", border:isActive?"1px solid #C9963A":"1px solid rgba(201,150,58,0.2)", color:isActive?"#0A0602":"rgba(201,150,58,0.7)", boxShadow:isActive?"0 4px 16px rgba(201,150,58,0.3)":"none" }}>
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span style={{ fontSize:9, fontWeight:900, background:isActive?"rgba(0,0,0,0.2)":"rgba(201,150,58,0.15)", color:isActive?"#0A0602":"#C9963A", borderRadius:99, padding:"1px 6px", marginLeft:2 }}>{counts[cat.id]}</span>
                </button>
              );
            })}

            {/* Bouton Reset — visible seulement si filtre actif */}
            {activeFilter !== "all" && (
              <button onClick={() => setActiveFilter("all")} style={{ flexShrink:0, display:"flex", alignItems:"center", gap:5, padding:"8px 12px", borderRadius:99, cursor:"pointer", fontFamily:"sans-serif", fontSize:10, fontWeight:800, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(247,240,230,0.35)", transition:"all 0.2s" }}>
                ✕ Reset
              </button>
            )}
          </div>

          {/* Compteur */}
          <div style={{ marginTop:14, fontSize:10, color:"rgba(247,240,230,0.25)", fontFamily:"sans-serif", letterSpacing:"0.1em" }}>
            {filtered.length} partenaire{filtered.length > 1 ? "s" : ""}
            {activeFilter !== "all" && <span style={{ color:"rgba(201,150,58,0.4)" }}> · {CATEGORIES.find(c=>c.id===activeFilter)?.label}</span>}
          </div>
        </div>

        {/* Liste */}
        <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:14 }}>
          {filtered.map(p => <PartnerCard key={p.id} partner={p} onClick={() => setSelected(p)} />)}
        </div>
      </div>

      {selected && <Modal partner={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

import { useState, useEffect } from "react";

const PARTNER = {
  name: "Queens Hair Studio",
  city: "Paris · 10ème",
  category: "Salon d'exception",
  emoji: "👑",
  logo: null,
  description: "Un sanctuaire dédié à la beauté afro depuis 2015. Nos artistes certifiées sculptent chaque tresse avec la précision et l'amour qu'une reine mérite.",
  promo: "-15% sur toutes les nattes",
  promo_deadline: new Date(Date.now() + 1000 * 60 * 60 * 8 + 1000 * 60 * 27 + 1000 * 14).toISOString(),
  whatsapp: "+33612345678",
  socials: { instagram: "queenshairstudio", tiktok: "queenshairstudio" },
  rating: 4.9,
  reviews: 312,
  badge: "Top Partenaire",
};

function useCountdown(deadline) {
  const [t, setT] = useState({ h:"00", m:"00", s:"00", expired:false });
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline) - Date.now();
      if (diff <= 0) { setT({ h:"00",m:"00",s:"00",expired:true }); return; }
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

const IGIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TKIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const WAIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

function Modal({ partner, onClose }) {
  const cd = useCountdown(partner.promo_deadline);
  const hasPromo = partner.promo && !cd.expired;
  const [vis, setVis] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);

  const close = () => { setVis(false); setTimeout(onClose, 380); };

  const wa = () => {
    const p = partner.whatsapp.replace(/\D/g,"");
    window.open(`https://wa.me/${p}?text=${encodeURIComponent("Bonjour, je vous contacte via AfroTresse 👑")}`, "_blank");
  };

  return (
    <div onClick={close} style={{
      position:"fixed",inset:0,zIndex:100,
      display:"flex",alignItems:"flex-end",justifyContent:"center",
      background: vis ? "rgba(4,2,0,0.8)" : "transparent",
      backdropFilter: vis ? "blur(24px)" : "none",
      transition:"all 0.4s ease",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        @keyframes flicker { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        ::-webkit-scrollbar{display:none}
      `}</style>

      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%",maxWidth:430,
        maxHeight:"92vh",overflowY:"auto",
        background:"#0A0602",
        borderRadius:"32px 32px 0 0",
        transform: vis ? "translateY(0)" : "translateY(100%)",
        transition:"transform 0.42s cubic-bezier(0.22,1,0.36,1)",
        position:"relative",overflow:"hidden",
        border:"1px solid rgba(201,150,58,0.2)",
        borderBottom:"none",
      }}>

        {/* Scanline texture */}
        <div style={{
          position:"absolute",inset:0,zIndex:0,pointerEvents:"none",
          backgroundImage:"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)",
        }}/>

        {/* Top glow */}
        <div style={{
          position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
          width:"60%",height:1,
          background:"linear-gradient(90deg,transparent,rgba(201,150,58,0.6),transparent)",
          zIndex:1,
        }}/>

        {/* Notch */}
        <div style={{display:"flex",justifyContent:"center",padding:"16px 0 8px",position:"relative",zIndex:2}}>
          <div style={{width:36,height:3,borderRadius:99,background:"rgba(201,150,58,0.25)"}}/>
        </div>

        {/* Close */}
        <button onClick={close} style={{
          position:"absolute",top:14,right:18,zIndex:10,
          width:34,height:34,borderRadius:99,
          background:"rgba(201,150,58,0.08)",
          border:"1px solid rgba(201,150,58,0.15)",
          cursor:"pointer",color:"rgba(201,150,58,0.6)",fontSize:13,fontWeight:700,
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"all 0.2s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,150,58,0.15)";e.currentTarget.style.color="#C9963A"}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(201,150,58,0.08)";e.currentTarget.style.color="rgba(201,150,58,0.6)"}}
        >✕</button>

        <div style={{padding:"4px 26px 56px",position:"relative",zIndex:2}}>

          {/* ══ SECTION 1 — IDENTITÉ ══ */}
          <div style={{marginBottom:28,paddingTop:4}}>

            {/* Logo + catégorie */}
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
              <div style={{
                width:72,height:72,borderRadius:20,flexShrink:0,
                background:"linear-gradient(145deg,#1C1008,#120A04)",
                border:"1px solid rgba(201,150,58,0.3)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:32,
                boxShadow:"inset 0 1px 0 rgba(201,150,58,0.15), 0 8px 32px rgba(0,0,0,0.4)",
                position:"relative",overflow:"hidden",
              }}>
                {/* Shimmer */}
                <div style={{
                  position:"absolute",top:0,left:"-100%",width:"50%",height:"100%",
                  background:"linear-gradient(90deg,transparent,rgba(201,150,58,0.08),transparent)",
                  animation:"scanline 3s ease-in-out infinite",
                }}/>
                {partner.logo
                  ? <img src={partner.logo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{filter:"drop-shadow(0 2px 8px rgba(201,150,58,0.3))"}}>{partner.emoji}</span>
                }
              </div>

              <div>
                <div style={{
                  fontSize:8,fontWeight:800,letterSpacing:"0.35em",
                  textTransform:"uppercase",color:"rgba(201,150,58,0.55)",
                  marginBottom:6,fontFamily:"'Trebuchet MS',sans-serif",
                }}>
                  {partner.category}
                </div>

                {/* Nom principal */}
                <div style={{
                  fontFamily:"'Cormorant Garamond','Georgia',serif",
                  fontSize:26,fontWeight:700,
                  color:"#F7F0E6",lineHeight:1.0,
                  letterSpacing:"-0.01em",
                }}>
                  {partner.name}
                </div>

                {/* Ville */}
                <div style={{
                  fontSize:9,fontWeight:800,letterSpacing:"0.35em",
                  textTransform:"uppercase",color:"#C9963A",
                  marginTop:7,fontFamily:"'Trebuchet MS',sans-serif",
                }}>
                  {partner.city}
                </div>
              </div>
            </div>

            {/* Rating bar */}
            <div style={{
              display:"flex",alignItems:"center",gap:10,
              paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.06)",
            }}>
              {/* Étoiles filaires */}
              <div style={{display:"flex",gap:3}}>
                {[1,2,3,4,5].map(i=>(
                  <svg key={i} width="11" height="11" viewBox="0 0 24 24"
                    fill={i<=Math.round(partner.rating)?"#C9963A":"none"}
                    stroke={i<=Math.round(partner.rating)?"#C9963A":"rgba(201,150,58,0.3)"}
                    strokeWidth="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                ))}
              </div>
              <span style={{fontSize:12,color:"rgba(247,240,230,0.5)",fontWeight:600,fontFamily:"'Trebuchet MS',sans-serif"}}>
                {partner.rating} · {partner.reviews} avis
              </span>
              {/* Badge */}
              <div style={{
                marginLeft:"auto",
                fontSize:8,fontWeight:800,letterSpacing:"0.15em",
                textTransform:"uppercase",padding:"4px 10px",borderRadius:99,
                background:"rgba(201,150,58,0.1)",color:"#C9963A",
                border:"1px solid rgba(201,150,58,0.2)",
                fontFamily:"'Trebuchet MS',sans-serif",
              }}>
                {partner.badge}
              </div>
            </div>
          </div>

          {/* ══ SECTION 2 — OFFRE FLASH ══ */}
          {hasPromo && (
            <div style={{
              marginBottom:26,borderRadius:20,overflow:"hidden",
              border:"1px solid rgba(201,150,58,0.25)",position:"relative",
            }}>
              {/* Top accent line */}
              <div style={{height:2,background:"linear-gradient(90deg,#C9963A,#E8B96A,#C9963A)"}}/>

              <div style={{background:"rgba(201,150,58,0.06)",padding:"16px 18px"}}>
                {/* Label pulsant */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{
                    width:7,height:7,borderRadius:99,background:"#C9963A",
                    animation:"flicker 1.8s ease-in-out infinite",
                  }}/>
                  <span style={{
                    fontSize:8,fontWeight:800,letterSpacing:"0.3em",
                    textTransform:"uppercase",color:"rgba(201,150,58,0.7)",
                    fontFamily:"'Trebuchet MS',sans-serif",
                  }}>
                    Offre Exclusive · Durée limitée
                  </span>
                </div>

                {/* Texte promo */}
                <div style={{
                  fontFamily:"'Cormorant Garamond','Georgia',serif",
                  fontSize:20,fontWeight:600,fontStyle:"italic",
                  color:"#F7F0E6",marginBottom:16,lineHeight:1.2,
                }}>
                  {partner.promo}
                </div>

                {/* Countdown */}
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:9,color:"rgba(247,240,230,0.3)",fontWeight:700,letterSpacing:"0.1em",fontFamily:"'Trebuchet MS',sans-serif"}}>
                    EXPIRE DANS
                  </span>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    {[{v:cd.h,l:"H"},{v:cd.m,l:"M"},{v:cd.s,l:"S"}].map(({v,l},i)=>(
                      <div key={l} style={{display:"flex",alignItems:"center",gap:i<2?4:0}}>
                        <div style={{
                          background:"rgba(0,0,0,0.4)",
                          border:"1px solid rgba(201,150,58,0.2)",
                          borderRadius:8,padding:"5px 8px",
                          textAlign:"center",minWidth:36,
                          backdropFilter:"blur(4px)",
                        }}>
                          <div style={{
                            fontFamily:"'Trebuchet MS',monospace",
                            fontSize:17,fontWeight:900,
                            color:"#C9963A",lineHeight:1,
                            textShadow:"0 0 12px rgba(201,150,58,0.4)",
                          }}>{v}</div>
                          <div style={{fontSize:6,color:"rgba(201,150,58,0.35)",fontWeight:800,letterSpacing:"0.15em",marginTop:2}}>{l}</div>
                        </div>
                        {i<2&&<span style={{color:"rgba(201,150,58,0.3)",fontSize:16,fontWeight:900}}>:</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ SECTION 3 — DESCRIPTION ══ */}
          <div style={{marginBottom:26}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,rgba(201,150,58,0.4),transparent)"}}/>
              <span style={{fontSize:8,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(201,150,58,0.4)",fontFamily:"'Trebuchet MS',sans-serif"}}>
                Notre histoire
              </span>
              <div style={{flex:1,height:"1px",background:"linear-gradient(270deg,rgba(201,150,58,0.4),transparent)"}}/>
            </div>

            <p style={{
              fontFamily:"'Cormorant Garamond','Georgia',serif",
              fontSize:15,fontStyle:"italic",
              color:"rgba(247,240,230,0.65)",lineHeight:1.85,
              letterSpacing:"0.015em",margin:0,
            }}>
              « {partner.description} »
            </p>
          </div>

          {/* ══ SECTION 4 — RÉSEAUX SOCIAUX ══ */}
          {partner.socials && Object.keys(partner.socials).length > 0 && (
            <div style={{marginBottom:28}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{flex:1,height:"1px",background:"linear-gradient(90deg,rgba(201,150,58,0.4),transparent)"}}/>
                <span style={{fontSize:8,fontWeight:800,letterSpacing:"0.3em",textTransform:"uppercase",color:"rgba(201,150,58,0.4)",fontFamily:"'Trebuchet MS',sans-serif"}}>
                  Nous suivre
                </span>
                <div style={{flex:1,height:"1px",background:"linear-gradient(270deg,rgba(201,150,58,0.4),transparent)"}}/>
              </div>

              <div style={{display:"flex",gap:8}}>
                {partner.socials.instagram && (
                  <button onClick={()=>window.open(`https://instagram.com/${partner.socials.instagram}`,"_blank")}
                    style={{
                      flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                      padding:"12px 0",borderRadius:14,cursor:"pointer",
                      background:"rgba(255,255,255,0.03)",
                      border:"1px solid rgba(255,255,255,0.07)",
                      color:"rgba(247,240,230,0.5)",
                      fontSize:12,fontWeight:700,letterSpacing:"0.05em",
                      transition:"all 0.2s",fontFamily:"'Trebuchet MS',sans-serif",
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(225,48,108,0.4)";e.currentTarget.style.color="#E1306C";e.currentTarget.style.background="rgba(225,48,108,0.06)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.color="rgba(247,240,230,0.5)";e.currentTarget.style.background="rgba(255,255,255,0.03)"}}
                  >
                    <IGIcon/> Instagram
                  </button>
                )}
                {partner.socials.tiktok && (
                  <button onClick={()=>window.open(`https://tiktok.com/@${partner.socials.tiktok}`,"_blank")}
                    style={{
                      flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                      padding:"12px 0",borderRadius:14,cursor:"pointer",
                      background:"rgba(255,255,255,0.03)",
                      border:"1px solid rgba(255,255,255,0.07)",
                      color:"rgba(247,240,230,0.5)",
                      fontSize:12,fontWeight:700,letterSpacing:"0.05em",
                      transition:"all 0.2s",fontFamily:"'Trebuchet MS',sans-serif",
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.25)";e.currentTarget.style.color="#F7F0E6";e.currentTarget.style.background="rgba(255,255,255,0.07)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.color="rgba(247,240,230,0.5)";e.currentTarget.style.background="rgba(255,255,255,0.03)"}}
                  >
                    <TKIcon/> TikTok
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ══ SECTION 5 — WHATSAPP CTA ══ */}
          <button onClick={wa} style={{
            width:"100%",padding:"0",borderRadius:20,
            background:"transparent",border:"none",cursor:"pointer",
            position:"relative",overflow:"hidden",
          }}>
            {/* Fond avec bordure animée */}
            <div style={{
              position:"absolute",inset:0,borderRadius:20,
              background:"linear-gradient(135deg,#1C1008,#0A0602)",
              border:"1px solid rgba(201,150,58,0.3)",
            }}/>
            {/* Glow top */}
            <div style={{
              position:"absolute",top:0,left:"20%",right:"20%",height:1,
              background:"linear-gradient(90deg,transparent,rgba(201,150,58,0.5),transparent)",
            }}/>

            <div style={{
              position:"relative",
              display:"flex",alignItems:"center",gap:14,
              padding:"18px 22px",
            }}>
              {/* Icône WA */}
              <div style={{
                width:44,height:44,borderRadius:14,flexShrink:0,
                background:"#25D366",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:"#fff",
                boxShadow:"0 4px 16px rgba(37,211,102,0.3)",
              }}>
                <WAIcon/>
              </div>

              <div style={{textAlign:"left",flex:1}}>
                <div style={{
                  fontFamily:"'Cormorant Garamond','Georgia',serif",
                  fontSize:17,fontWeight:700,color:"#F7F0E6",
                  letterSpacing:"0.01em",lineHeight:1.1,
                }}>
                  Réserver via WhatsApp
                </div>
                <div style={{
                  fontSize:10,color:"rgba(201,150,58,0.45)",
                  marginTop:4,fontWeight:700,letterSpacing:"0.1em",
                  textTransform:"uppercase",fontFamily:"'Trebuchet MS',sans-serif",
                }}>
                  Réponse garantie · {partner.name}
                </div>
              </div>

              <div style={{color:"rgba(201,150,58,0.5)",fontSize:20}}>›</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Preview() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      minHeight:"100vh",
      background:"radial-gradient(ellipse at 30% 20%, #1C1008 0%, #080401 60%)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:24,fontFamily:"'Trebuchet MS',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        *{box-sizing:border-box} ::-webkit-scrollbar{display:none}
      `}</style>

      {/* Carte déclencheur */}
      <div style={{
        maxWidth:340,width:"100%",
        background:"linear-gradient(145deg,#140C04,#0A0602)",
        borderRadius:24,padding:"28px 24px",
        border:"1px solid rgba(201,150,58,0.2)",
        boxShadow:"0 32px 80px rgba(0,0,0,0.5)",
        textAlign:"center",marginBottom:24,
        position:"relative",overflow:"hidden",
      }}>
        {/* Grain */}
        <div style={{
          position:"absolute",inset:0,opacity:0.03,
          backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          pointerEvents:"none",
        }}/>

        <div style={{fontSize:44,marginBottom:14,filter:"drop-shadow(0 4px 12px rgba(201,150,58,0.3))"}}>👑</div>

        <div style={{fontSize:8,letterSpacing:"0.35em",textTransform:"uppercase",color:"rgba(201,150,58,0.5)",fontWeight:800,marginBottom:10}}>
          Salon d'exception · Paris
        </div>
        <div style={{
          fontFamily:"'Cormorant Garamond','Georgia',serif",
          fontSize:26,fontWeight:700,color:"#F7F0E6",marginBottom:6,lineHeight:1,
        }}>
          Queens Hair Studio
        </div>
        <div style={{fontSize:12,color:"rgba(247,240,230,0.3)",marginBottom:20}}>
          ⭐ 4.9 · 312 avis
        </div>

        <div style={{
          background:"rgba(201,150,58,0.08)",border:"1px solid rgba(201,150,58,0.2)",
          borderRadius:12,padding:"10px 14px",marginBottom:22,
          fontSize:12,color:"rgba(201,150,58,0.8)",fontWeight:600,
          fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic",
        }}>
          🎁 -15% sur toutes les nattes ce mois-ci
        </div>

        <button onClick={()=>setOpen(true)} style={{
          width:"100%",padding:"15px",borderRadius:16,
          background:"linear-gradient(135deg,#C9963A,#E8B96A)",
          border:"none",cursor:"pointer",
          fontSize:14,fontWeight:900,color:"#0A0602",
          fontFamily:"'Trebuchet MS',sans-serif",
          letterSpacing:"0.05em",
          boxShadow:"0 8px 28px rgba(201,150,58,0.35)",
          transition:"transform 0.15s,box-shadow 0.15s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 12px 36px rgba(201,150,58,0.45)"}}
          onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 8px 28px rgba(201,150,58,0.35)"}}
        >
          Voir la fiche partenaire →
        </button>
      </div>

      <div style={{fontSize:9,color:"rgba(201,150,58,0.3)",letterSpacing:"0.3em",textTransform:"uppercase",fontWeight:800}}>
        Cliquez pour ouvrir · Fond pour fermer
      </div>

      {open && <Modal partner={PARTNER} onClose={()=>setOpen(false)}/>}
    </div>
  );
}

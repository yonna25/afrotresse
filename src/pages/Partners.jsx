import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    fetchActivePartners();
  }, []);

  const fetchActivePartners = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("active", true)
      .order("is_featured", { ascending: false })
      .order("name");
    
    setPartners(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedPartner?.promo_end_date) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(selectedPartner.promo_end_date).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft("EXPIRÉ");
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [selectedPartner]);

  return (
    <div className="min-h-screen bg-[#FAF4EC] p-6 pb-24 text-[#2C1A0E]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
        .font-serif { font-family: 'Playfair Display', serif; }
      `}</style>

      <h1 className="text-3xl font-serif mb-8 tracking-tight">Nos Partenaires</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="flex justify-center py-20 opacity-20 text-[10px] uppercase tracking-widest font-black">Chargement...</div>
        ) : (
          partners.map(p => (
            <div 
              key={p.id} 
              onClick={() => setSelectedPartner(p)} 
              className={`bg-white p-5 rounded-[2.5rem] shadow-sm border flex items-center gap-5 active:scale-95 transition-all cursor-pointer ${p.is_featured ? 'border-[#C9963A]/40 ring-1 ring-[#C9963A]/5' : 'border-black/5'}`}
            >
              <div className="w-16 h-16 rounded-[1.5rem] bg-[#2C1A0E]/5 flex items-center justify-center text-3xl relative overflow-hidden shadow-inner">
                {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover" alt="" /> : p.emoji}
                {p.is_featured && <div className="absolute top-0 right-0 bg-[#C9963A] px-1.5 py-0.5 rounded-bl-lg text-[7px]">✨</div>}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-sm leading-tight mb-0.5">{p.name}</h2>
                <p className="text-[10px] opacity-40 uppercase tracking-[0.2em] font-medium">{p.city}</p>
              </div>
              {p.promo_text && <div className="w-2 h-2 rounded-full bg-[#C9963A] animate-pulse"></div>}
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedPartner && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedPartner(null)} 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" 
            />
            
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }} 
              className="fixed bottom-0 left-0 w-full bg-white rounded-t-[3.5rem] p-8 pb-12 z-[101] shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedPartner(null)} 
                className="absolute top-8 right-8 w-10 h-10 bg-[#2C1A0E]/5 rounded-full flex items-center justify-center text-[#2C1A0E] text-lg"
              >
                ✕
              </button>

              <div className="text-center mt-6">
                <div className="w-24 h-24 bg-[#2C1A0E]/5 rounded-[2.5rem] mx-auto flex items-center justify-center text-4xl mb-6 overflow-hidden shadow-inner border border-black/5">
                  {selectedPartner.logo_url ? <img src={selectedPartner.logo_url} className="w-full h-full object-cover" alt="" /> : selectedPartner.emoji}
                </div>
                
                <h2 className="text-2xl font-serif text-[#2C1A0E]">{selectedPartner.name}</h2>
                <p className="text-[#C9963A] font-black uppercase text-[10px] tracking-[0.3em] mt-2 mb-8">{selectedPartner.city}</p>
                
                {selectedPartner.promo_text && timeLeft !== "EXPIRÉ" && (
                  <div className="bg-[#C9963A]/10 border border-[#C9963A]/20 p-5 rounded-3xl mb-8">
                    <p className="text-[#C9963A] text-[9px] font-black uppercase tracking-widest mb-1">Offre Exclusive</p>
                    <p className="font-bold text-base mb-2 text-[#2C1A0E]">{selectedPartner.promo_text}</p>
                    <span className="bg-[#C9963A] text-white text-[10px] font-mono px-4 py-1.5 rounded-full inline-block font-bold">
                      {timeLeft}
                    </span>
                  </div>
                )}

                <p className="text-[#2C1A0E]/60 text-sm leading-relaxed mb-10 px-4">
                  {selectedPartner.description || "Expertise et raffinement pour sublimer votre nature."}
                </p>

                <div className="flex justify-center gap-10 mb-10">
                  {selectedPartner.instagram_url && (
                    <a href={`https://instagram.com/${selectedPartner.instagram_url}`} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest border-b-2 border-[#2C1A0E]/10 pb-1 hover:border-[#C9963A] transition-colors">Instagram</a>
                  )}
                  {selectedPartner.tiktok_url && (
                    <a href={`https://tiktok.com/@${selectedPartner.tiktok_url}`} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest border-b-2 border-[#2C1A0E]/10 pb-1 hover:border-[#C9963A] transition-colors">TikTok</a>
                  )}
                </div>

                {selectedPartner.whatsapp && (
                  <a 
                    href={`https://wa.me/${selectedPartner.whatsapp}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block w-full py-5 bg-[#2C1A0E] text-[#FAF4EC] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                  >
                    Réserver maintenant
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePartners();
  }, []);

  const fetchActivePartners = async () => {
    setLoading(true);
    // On ne récupère que ceux qui sont 'active' = true
    const { data } = await supabase.from("partners").select("*").eq("active", true).order("name");
    setPartners(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF4EC] p-6 pb-24">
      <h1 className="text-3xl font-serif text-[#2C1A0E] mb-8">Nos Partenaires</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {partners.map(p => (
          <div key={p.id} onClick={() => setSelectedPartner(p)} className="bg-white p-4 rounded-[2rem] shadow-sm border border-black/5 flex items-center gap-4 active:scale-95 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-[#2C1A0E]/5 flex items-center justify-center text-2xl">
              {p.logo_url ? <img src={p.logo_url} className="w-full h-full object-cover rounded-2xl" alt="" /> : p.emoji}
            </div>
            <div>
              <h2 className="font-bold text-[#2C1A0E]">{p.name}</h2>
              <p className="text-xs opacity-50 uppercase tracking-widest">{p.city}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPartner && (
          <>
            {/* Overlay qui ferme aussi au clic à côté */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPartner(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 w-full bg-white rounded-t-[3rem] p-8 z-[101] shadow-2xl max-h-[90vh] overflow-y-auto">
              
              {/* BOUTON FERMETURE (X) */}
              <button onClick={() => setSelectedPartner(null)} className="absolute top-6 right-6 w-10 h-10 bg-[#2C1A0E]/5 rounded-full flex items-center justify-center text-[#2C1A0E] font-light text-xl">✕</button>

              <div className="text-center mt-4">
                <div className="w-24 h-24 bg-[#2C1A0E]/5 rounded-[2.5rem] mx-auto flex items-center justify-center text-4xl mb-6 shadow-inner">
                  {selectedPartner.logo_url ? <img src={selectedPartner.logo_url} className="w-full h-full object-cover rounded-[2.5rem]" alt="" /> : selectedPartner.emoji}
                </div>
                <h2 className="text-2xl font-serif text-[#2C1A0E]">{selectedPartner.name}</h2>
                <p className="text-[#C9963A] font-black uppercase text-[10px] tracking-[0.3em] mt-2 mb-6">{selectedPartner.city}</p>
                
                <p className="text-[#2C1A0E]/70 text-sm leading-relaxed mb-8">{selectedPartner.description || "Aucune description disponible."}</p>

                {selectedPartner.whatsapp && (
                  <a href={`https://wa.me/${selectedPartner.whatsapp}`} className="block w-full py-5 bg-[#2C1A0E] text-[#FAF4EC] rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Prendre rendez-vous</a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

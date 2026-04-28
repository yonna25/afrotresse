import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Seo from "../components/Seo.jsx";

const PARTNERS = [
  {
    id: 1,
    name: "Luxe Coiffure",
    logo: "/partners/luxe-coiffure.png", // Remplace par tes vrais chemins
    fullImage: "/partners/luxe-full.webp",
    description: "Expert en soins capillaires premium et extensions.",
    longDescription: "Luxe Coiffure est notre partenaire privilégié pour tout ce qui concerne la santé du cheveu afro. Ils proposent des soins profonds et des conseils personnalisés pour préparer vos cheveux avant une tresse.",
    specialOffer: "10% de réduction pour les membres AfroTresse"
  }
];

export default function Partners() {
  const [selectedPartner, setSelectedPartner] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF4EC] to-white text-[#2C1A0E] pb-20">
      <Seo title="Nos Partenaires — AfroTresse" />

      {/* HERO SECTION */}
      <section className="pt-24 pb-16 px-6 text-center">
        <span className="text-[#C9963A] uppercase tracking-[0.3em] text-[10px] font-bold mb-4 block">Réseau d'Excellence</span>
        <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Ils nous font <span className="text-[#C9963A]">confiance</span></h1>
      </section>

      {/* GRID PARTENAIRES */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {PARTNERS.map((partner) => (
            <motion.div
              key={partner.id}
              layoutId={`card-${partner.id}`}
              onClick={() => setSelectedPartner(partner)}
              className="cursor-pointer group bg-white rounded-[2.5rem] p-8 border border-[#C9963A]/10 shadow-[0_20px_40px_rgba(44,26,14,0.04)] hover:shadow-[0_30px_60px_rgba(44,26,14,0.08)] transition-all duration-500"
            >
              <div className="h-32 flex items-center justify-center mb-8 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all">
                <img src={partner.logo} alt={partner.name} className="max-h-full max-w-[160px] object-contain" />
              </div>
              <h3 className="font-bold text-xl mb-2">{partner.name}</h3>
              <p className="text-xs opacity-50 leading-relaxed line-clamp-2">{partner.description}</p>
              <div className="mt-4 text-[#C9963A] text-[10px] font-bold uppercase tracking-widest">En savoir plus →</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MODAL RÉTABLIE */}
      <AnimatePresence>
        {selectedPartner && (
          <>
            {/* Overlay sombre */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPartner(null)}
              className="fixed inset-0 bg-[#2C1A0E]/80 backdrop-blur-md z-[1000]"
            />
            
            {/* Contenu de la Modal */}
            <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none">
              <motion.div 
                layoutId={`card-${selectedPartner.id}`}
                className="bg-[#FAF4EC] w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl pointer-events-auto relative"
              >
                <button 
                  onClick={() => setSelectedPartner(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors z-20"
                >
                  ✕
                </button>

                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2 h-64 md:h-auto bg-white flex items-center justify-center p-12">
                    <img src={selectedPartner.logo} alt={selectedPartner.name} className="max-h-full object-contain" />
                  </div>
                  
                  <div className="md:w-1/2 p-8 md:p-12">
                    <span className="text-[#C9963A] text-[10px] font-bold uppercase tracking-widest">Partenaire Officiel</span>
                    <h2 className="text-3xl font-black mt-2 mb-4">{selectedPartner.name}</h2>
                    <p className="text-sm opacity-70 leading-relaxed mb-6">{selectedPartner.longDescription}</p>
                    
                    {selectedPartner.specialOffer && (
                      <div className="bg-[#C9963A]/10 border border-[#C9963A]/20 p-4 rounded-2xl mb-8">
                        <p className="text-[#C9963A] text-xs font-bold italic">🎁 {selectedPartner.specialOffer}</p>
                      </div>
                    )}

                    <button className="w-full py-4 bg-[#2C1A0E] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#C9963A] transition-colors">
                      Visiter le site
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

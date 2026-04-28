import { motion } from "framer-motion";
import Seo from "../components/Seo.jsx";

const PARTNERS = [
  {
    id: 1,
    name: "Luxe Coiffure",
    logo: "/partners/luxe-coiffure.png",
    description: "Expert en soins capillaires premium et extensions.",
    link: "https://example.com"
  },
  // Ajoute tes autres partenaires ici
];

export default function Partners() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF4EC] to-white text-[#2C1A0E] pb-20">
      <Seo title="Nos Partenaires — AfroTresse" />

      {/* SECTION HERO - Plus de contraste */}
      <section className="pt-24 pb-16 px-6 text-center">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[#C9963A] uppercase tracking-[0.3em] text-[10px] font-bold mb-4 block"
        >
          Réseau d'Excellence
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-black mb-6 leading-tight"
        >
          Ils nous font <span className="text-[#C9963A]">confiance</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-sm opacity-70 leading-relaxed font-light"
        >
          AfroTresse collabore avec les meilleurs salons et marques pour vous offrir 
          une expérience de coiffure augmentée sans compromis.
        </motion.p>
      </section>

      {/* GRID PARTENAIRES - Le coeur du Re-design */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {PARTNERS.map((partner, index) => (
            <motion.a
              key={partner.id}
              href={partner.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative bg-white rounded-[2.5rem] p-8 border border-[#C9963A]/10 shadow-[0_20px_40px_rgba(44,26,14,0.04)] hover:shadow-[0_30px_60px_rgba(44,26,14,0.08)] transition-all duration-500"
            >
              {/* Logo avec traitement niveaux de gris -> couleur */}
              <div className="h-32 flex items-center justify-center mb-8 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-700">
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  className="max-h-full max-w-[160px] object-contain"
                />
              </div>

              {/* Texte & Détails */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xl">{partner.name}</h3>
                  <span className="text-[#C9963A] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 17L17 7M17 7H7M17 7V17" />
                    </svg>
                  </span>
                </div>
                <p className="text-xs opacity-50 leading-relaxed group-hover:opacity-80 transition-opacity">
                  {partner.description}
                </p>
              </div>

              {/* Ligne Gold décorative discrète */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#C9963A] group-hover:w-1/3 transition-all duration-500 rounded-full" />
            </motion.a>
          ))}
        </div>
      </section>

      {/* SECTION CTA / CONTACT - Minimaliste Soft */}
      <section className="mt-32 px-6">
        <div className="max-w-4xl mx-auto bg-[#2C1A0E] rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl">
          {/* Décoration de fond */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9963A] opacity-5 blur-[100px]" />
          
          <h2 className="text-white text-3xl font-bold mb-4 relative z-10">Devenir Partenaire ?</h2>
          <p className="text-white/60 text-sm mb-10 max-w-md mx-auto relative z-10">
            Rejoignez l'écosystème AfroTresse et proposez vos services à une audience passionnée par l'innovation.
          </p>
          <button className="relative z-10 bg-[#C9963A] text-[#2C1A0E] px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
            Nous Contacter
          </button>
        </div>
      </section>
    </div>
  );
}

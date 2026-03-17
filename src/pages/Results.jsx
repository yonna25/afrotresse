import { motion } from "framer-motion";

export default function Results({ styles = [] }) {
  if (!styles.length) return null;

  return (
    <div className="px-4 py-6 space-y-6 bg-[#2b1810] min-h-screen">
      <h2 className="text-white text-xl font-semibold">
        Tes résultats
      </h2>

      {styles.map((style, index) => {
        const imgSrc = style.generatedImage
          ? style.generatedImage
          : `/styles/${style.localImage}`;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#3a2118] rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="relative">
              <img
                src={imgSrc}
                alt={style.name}
                className="w-full h-80 object-cover"
                onError={(e) => {
                  e.target.src = "/styles/napi1.jpg";
                }}
              />
              <div className="absolute top-3 left-3 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full">
                +100 vues
              </div>
            </div>

            <div className="p-4 space-y-3">
              <h3 className="text-white text-lg font-semibold">
                {style.name}
              </h3>

              <p className="text-sm text-gray-300">
                {style.description || "Style tendance adapté à ton visage"}
              </p>

              <div className="flex gap-2 flex-wrap">
                <span className="bg-[#5a3225] text-xs px-3 py-1 rounded-full text-white">
                  Moderne
                </span>
                <span className="bg-[#5a3225] text-xs px-3 py-1 rounded-full text-white">
                  Chic
                </span>
                <span className="bg-[#5a3225] text-xs px-3 py-1 rounded-full text-white">
                  Populaire
                </span>
              </div>

              <button className="w-full bg-yellow-400 text-black py-3 rounded-xl font-semibold mt-2">
                Essayer ce style
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

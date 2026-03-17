import { motion } from "framer-motion";

export default function Results({ styles = [] }) {
  if (!styles.length) {
    return (
      <div className="text-center mt-10 text-gray-500">
        Aucun style trouvé...
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {styles.map((style, index) => {
        console.log("STYLE:", style);

        const imgSrc = style.generatedImage
          ? style.generatedImage
          : `/styles/${style.localImage}`;

        console.log("IMG SRC:", imgSrc);

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-md overflow-hidden"
          >
            <img
              src={imgSrc}
              alt={style.name}
              className="w-full h-72 object-cover"
              onError={(e) => {
                console.log("ERREUR IMAGE → fallback");
                e.target.src = "/styles/napi1.jpg";
              }}
            />

            <div className="p-4">
              <h3 className="text-lg font-semibold">{style.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {style.description || "Style tendance adapté à ton visage"}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

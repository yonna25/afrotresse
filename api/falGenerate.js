import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { selfieUrl, stylePath } = req.body; 

    // Déterminer l'URL absolue du style sur ton site en production
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const fullStyleUrl = `${protocol}://${host}${stylePath}`;

    console.log("🛠️ Utilisation du style :", fullStyleUrl);

    // Appel au modèle InstantID (plus robuste pour le visage)
    const output = await replicate.run(
      "lucataco/instantid:90264627d26ca0244795b5a2ca23d2da085a6a3dc8f615e449a56285a854a938",
      {
        input: {
          image: selfieUrl,
          pose_image: fullStyleUrl,
          prompt: "High-end beauty photography, woman with intricate African braids, Ghana weaving, precise parting, 8k resolution",
          identity_net_strength: 0.8,
          adapter_strength: 0.8
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("❌ Erreur Production:", error.message);
    return res.status(500).json({ error: "Erreur lors de la génération IA." });
  }
}

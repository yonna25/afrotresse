import { generateMask } from "./generate-mask"; // Import de ta nouvelle logique
import { applyStyle } from "./apply-style";     // Import de ta nouvelle logique

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { selfieUrl, styleImageUrl } = req.body; // Utilise des URLs (Cloudinary/S3)

    if (!selfieUrl || !styleImageUrl) {
      return res.status(400).json({ error: "Données manquantes (Selfie ou Style)" });
    }

    console.log("🚀 Étape 1 : Génération du masque de cheveux...");
    const maskUrl = await generateMask(selfieUrl);

    if (!maskUrl) {
      throw new Error("Échec de la création du masque");
    }

    console.log("🎨 Étape 2 : Application de la coiffure sur le masque...");
    const finalImage = await applyStyle(selfieUrl, maskUrl, styleImageUrl);

    console.log("✅ Transformation réussie !");
    return res.status(200).json({ imageUrl: finalImage });

  } catch (err) {
    console.error("❌ Erreur Pipeline:", err.message);
    return res.status(500).json({ error: "Le pipeline AfroTresse a échoué", details: err.message });
  }
}

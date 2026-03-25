import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      selfieBase64,
      selfieType,
      styleImageUrl
    } = req.body;

    if (!selfieBase64 || !styleImageUrl) {
      return res.status(400).json({ error: "Missing data" });
    }

    // Si l'URL est relative, la rendre absolue avec le domaine Vercel
    const absoluteStyleImageUrl = styleImageUrl.startsWith("http")
      ? styleImageUrl
      : `https://afrotresse-hfwf.vercel.app${styleImageUrl}`;

    // Convertir base64 en File
    const buffer = Buffer.from(selfieBase64, "base64");
    const file = new File([buffer], "selfie.jpg", { type: selfieType || "image/jpeg" });

    // Upload selfie vers Fal storage
    const selfieUrl = await fal.storage.upload(file);

    // Génération
    const result = await fal.subscribe("fal-ai/image-apps-v2/hair-change", {
      input: {
        image_url: selfieUrl,
        reference_image_url: absoluteStyleImageUrl,
      },
    });

    // Vérifier la structure de la réponse avant d'y accéder
    const imageUrl = result?.data?.image?.url || result?.data?.images?.[0]?.url;
    if (!imageUrl) {
      console.error("Réponse Fal inattendue :", JSON.stringify(result));
      return res.status(500).json({ error: "Fal.ai n'a pas retourné d'image." });
    }

    return res.status(200).json({ imageUrl });

  } catch (err) {
    console.error("Fal.ai error:", err);
    return res.status(500).json({
      error: err?.message || "Erreur génération Fal.ai",
    });
  }
}

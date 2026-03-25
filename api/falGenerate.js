import { fal } from "@fal-ai/client";

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

    // Vérifier que styleImageUrl est une URL publique absolue
    // (Fal.ai ne peut pas accéder à une URL locale comme /styles/xxx.jpg)
    if (!styleImageUrl.startsWith("http")) {
      return res.status(400).json({
        error: "L'image de style doit être une URL publique accessible. URL locale reçue : " + styleImageUrl
      });
    }

    // Convertir base64 en File
    const buffer = Buffer.from(selfieBase64, "base64");
    const file = new File([buffer], "selfie.jpg", { type: selfieType || "image/jpeg" });

    // Upload selfie vers Fal storage
    const selfieUrl = await fal.storage.upload(file);

    // Génération
    const result = await fal.subscribe("fal-ai/image-apps-v2/hair-change", {
      input: {
        image_url: selfieUrl,
        reference_image_url: styleImageUrl,
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

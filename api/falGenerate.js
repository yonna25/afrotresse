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

    // Convertir base64 en File
    const buffer = Buffer.from(selfieBase64, "base64");
    const file = new File([buffer], "selfie.jpg", { type: selfieType });

    // Upload vers Fal
    const selfieUrl = await fal.storage.upload(file);

    // Génération
    const result = await fal.subscribe("fal-ai/image-apps-v2/hair-change", {
      input: {
        image_url: selfieUrl,
        reference_image_url: styleImageUrl,
      },
    });

    return res.status(200).json({
      imageUrl: result.data.image.url,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erreur generation",
    });
  }
}

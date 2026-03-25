import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { selfieBase64, selfieType, styleImageUrl } = req.body;

    if (!selfieBase64 || !styleImageUrl) {
      return res.status(400).json({ error: "Missing data" });
    }

    const buffer = Buffer.from(selfieBase64, "base64");
    const file = new File([buffer], "selfie.jpg", { type: selfieType || "image/jpeg" });
    const selfieUrl = await fal.storage.upload(file);
    console.log("✅ Selfie uploadé:", selfieUrl);

    const absoluteStyleImageUrl = styleImageUrl.startsWith("http")
      ? styleImageUrl
      : `https://afrotresse-hfwf.vercel.app${styleImageUrl}`;

    let referenceUrl = absoluteStyleImageUrl;
    try {
      const refResponse = await fetch(absoluteStyleImageUrl);
      if (refResponse.ok) {
        const refBuffer = await refResponse.arrayBuffer();
        const refFile = new File([refBuffer], "reference.jpg", { type: "image/jpeg" });
        referenceUrl = await fal.storage.upload(refFile);
        console.log("✅ Référence uploadée:", referenceUrl);
      }
    } catch (err) {
      console.warn("⚠️ Upload référence échoué:", err.message);
    }

    console.log("📤 Envoi à Fal avec image_url et reference_image_url");

    const result = await fal.subscribe("fal-ai/image-apps-v2/hair-change", {
      input: {
        image_url: selfieUrl,
        reference_image_url: referenceUrl,
      },
    });

    console.log("📥 Réponse Fal reçue");

    const imageUrl = result?.data?.image?.url;
    if (!imageUrl) {
      return res.status(500).json({ error: "Fal n'a pas retourné d'image" });
    }

    return res.status(200).json({ imageUrl });

  } catch (err) {
    console.error("❌ Erreur:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

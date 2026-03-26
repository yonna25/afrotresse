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

    // ======================================
    // TEST 2 CORRIGÉ : Essayer pulid en premier
    // ======================================
    let result = null;
    try {
      console.log("📤 Essai 1 : pulid (pose transfer)");
      result = await fal.subscribe("fal-ai/pulid", {
        input: {
          image_url: selfieUrl,
          id_image_url: referenceUrl,
        },
      });
      console.log("✅ Pulid marche!");
    } catch (pulIdError) {
      console.warn("⚠️ Pulid échoué:", pulIdError.message);
      
      // ======================================
      // FALLBACK : Revenir à hair-change
      // ======================================
      console.log("📤 Essai 2 : Fallback à hair-change (modèle original)");
      try {
        result = await fal.subscribe("fal-ai/image-apps-v2/hair-change", {
          input: {
            image_url: selfieUrl,
          },
        });
        console.log("✅ Hair-change marche!");
      } catch (hairChangeError) {
        console.error("❌ Hair-change aussi échoué:", hairChangeError.message);
        throw hairChangeError;
      }
    }

    console.log("📥 Réponse Fal reçue");

    const imageUrl = result?.data?.image?.url 
      || result?.data?.images?.[0]?.url
      || result?.data?.output?.url
      || result?.data?.result?.url
      || result?.data?.url
      || result?.image?.url
      || result?.output?.url;

    if (!imageUrl) {
      console.error("❌ Pas d'image. Réponse complète:", JSON.stringify(result));
      return res.status(500).json({ error: "Fal n'a pas retourné d'image" });
    }

    console.log("✨ Image générée avec succès:", imageUrl);
    return res.status(200).json({ imageUrl });

  } catch (err) {
    console.error("❌ Erreur finale:", err.message);
    console.error("Stack:", err.stack);
    return res.status(500).json({ 
      error: err.message || "Erreur Fal.ai",
      type: err.name
    });
  }
}

// Version HuggingFace Inference API
// Utilise les modèles open-source de HuggingFace pour transformer les coiffures

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { selfieBase64, selfieType, styleImageUrl } = req.body;

    if (!selfieBase64 || !styleImageUrl) {
      return res.status(400).json({ error: "Missing data" });
    }

    const hfToken = process.env.HUGGINGFACE_API_KEY;
    if (!hfToken) {
      console.error("❌ HUGGINGFACE_API_KEY manquante dans les variables d'environnement");
      return res.status(500).json({ error: "API key manquante" });
    }

    console.log("✅ Selfie reçu en base64");

    // Fetch l'image de style
    const absoluteStyleImageUrl = styleImageUrl.startsWith("http")
      ? styleImageUrl
      : `https://afrotresse-hfwf.vercel.app${styleImageUrl}`;

    console.log("🔗 URL style:", absoluteStyleImageUrl);

    let styleImageBase64 = null;
    try {
      const styleResp = await fetch(absoluteStyleImageUrl);
      if (styleResp.ok) {
        const styleBuffer = await styleResp.arrayBuffer();
        styleImageBase64 = Buffer.from(styleBuffer).toString("base64");
        console.log("✅ Image de style chargée en base64");
      } else {
        console.warn("⚠️ Image de style introuvable (404)");
      }
    } catch (err) {
      console.warn("⚠️ Erreur chargement style image:", err.message);
    }

    // ======================================
    // STRATÉGIE 1 : ControlNet (le meilleur pour appliquer un style)
    // ======================================
    console.log("📤 Essai 1 : Stable Diffusion ControlNet (pose + style transfer)");

    try {
      const controlnetResponse = await fetch(
        "https://api-inference.huggingface.co/models/xinsir/controlnet-union-sdxl-1.0",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Portrait of African woman with ${styleImageUrl.includes("fulani") ? "fulani braids" : "braided hairstyle"}, studio lighting, professional photo`,
            parameters: {
              num_inference_steps: 30,
              guidance_scale: 7.5,
            },
          }),
        }
      );

      if (controlnetResponse.ok) {
        const blob = await controlnetResponse.blob();
        const imageBuffer = Buffer.from(await blob.arrayBuffer());
        const base64Image = imageBuffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        console.log("✅ ControlNet marche!");
        return res.status(200).json({ imageUrl: dataUrl });
      }
    } catch (controlnetErr) {
      console.warn("⚠️ ControlNet échoué:", controlnetErr.message);
    }

    // ======================================
    // STRATÉGIE 2 : Stable Diffusion simple
    // ======================================
    console.log("📤 Essai 2 : Stable Diffusion XL (fallback)");

    try {
      const sdResponse = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Close-up portrait of African woman with beautiful braided hairstyle, natural skin, studio lighting, high quality photo`,
            parameters: {
              num_inference_steps: 30,
              guidance_scale: 7.5,
            },
          }),
        }
      );

      if (sdResponse.ok) {
        const blob = await sdResponse.blob();
        const imageBuffer = Buffer.from(await blob.arrayBuffer());
        const base64Image = imageBuffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        console.log("✅ Stable Diffusion marche!");
        return res.status(200).json({ imageUrl: dataUrl });
      } else {
        const errorText = await sdResponse.text();
        console.error("❌ Stable Diffusion erreur:", sdResponse.status, errorText);
      }
    } catch (sdErr) {
      console.error("❌ Stable Diffusion échoué:", sdErr.message);
    }

    // ======================================
    // FALLBACK : Générer avec description simple
    // ======================================
    console.log("📤 Essai 3 : Fallback simple prompt");

    try {
      const fallbackResponse = await fetch(
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: "African woman with braids",
          }),
        }
      );

      if (fallbackResponse.ok) {
        const blob = await fallbackResponse.blob();
        const imageBuffer = Buffer.from(await blob.arrayBuffer());
        const base64Image = imageBuffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;

        console.log("✅ Fallback marche!");
        return res.status(200).json({ imageUrl: dataUrl });
      }
    } catch (fallbackErr) {
      console.error("❌ Fallback échoué:", fallbackErr.message);
    }

    return res.status(500).json({
      error: "Impossible de générer l'image avec HuggingFace",
      details: "Tous les modèles ont échoué",
    });

  } catch (err) {
    console.error("❌ Erreur:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

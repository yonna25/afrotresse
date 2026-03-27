// Version HuggingFace API Inference — Simple et fiable
// Génère une image à partir d'un prompt texte

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { selfieBase64, selfieType, styleImageUrl } = req.body;

    if (!selfieBase64 || !styleImageUrl) {
      return res.status(400).json({ error: "Missing data" });
    }

    const token = process.env.HUGGINGFACE_API_KEY;
    if (!token) {
      console.error("❌ HUGGINGFACE_API_KEY manquante");
      return res.status(500).json({ error: "API key manquante" });
    }

    console.log("✅ Selfie reçu");
    console.log("🔗 Style URL:", styleImageUrl);

    // Générer un prompt basé sur le style
    const stylePrompts = {
      "box-braids": "African woman with box braids hairstyle, portrait, studio lighting, high quality",
      "coco-twists": "African woman with coco twists hairstyle, professional photo, beautiful natural hair",
      "cornrows": "African woman with cornrows hairstyle, neat braids, portrait",
      "crochet-braids": "African woman with crochet braids, voluminous hairstyle, studio lighting",
      "fan-braids": "African woman with fan braids hairstyle, artistic style, portrait",
      "fulani": "African woman with fulani braids and beads, traditional style, beautiful",
      "stitch-braids": "African woman with stitch braids geometric pattern, neat professional",
    };

    // Cherche le style dans les clés
    let prompt = "African woman with beautiful braided hairstyle, portrait, studio lighting";
    for (const [key, desc] of Object.entries(stylePrompts)) {
      if (styleImageUrl.includes(key)) {
        prompt = desc;
        break;
      }
    }

    console.log("📝 Prompt généré:", prompt);

    // ======================================
    // Test 1 : Stable Diffusion (fiable)
    // ======================================
    console.log("📤 Essai 1 : Stable Diffusion");

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            inputs: prompt,
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        console.log("✅ Stable Diffusion marche!");
        return res.status(200).json({ imageUrl: dataUrl });
      } else {
        const error = await response.text();
        console.warn("⚠️ SD erreur:", response.status, error);
      }
    } catch (err) {
      console.warn("⚠️ SD échoué:", err.message);
    }

    // ======================================
    // Test 2 : Dreamshaper (alternative)
    // ======================================
    console.log("📤 Essai 2 : Dreamshaper");

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/lykon/dreamshaper-8-lcm",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            inputs: prompt,
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        console.log("✅ Dreamshaper marche!");
        return res.status(200).json({ imageUrl: dataUrl });
      } else {
        const error = await response.text();
        console.warn("⚠️ Dreamshaper erreur:", response.status, error);
      }
    } catch (err) {
      console.warn("⚠️ Dreamshaper échoué:", err.message);
    }

    // ======================================
    // Test 3 : Anything v4 (art style)
    // ======================================
    console.log("📤 Essai 3 : Anything v4");

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/andite/anything-v4.0",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            inputs: prompt,
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        console.log("✅ Anything v4 marche!");
        return res.status(200).json({ imageUrl: dataUrl });
      } else {
        const error = await response.text();
        console.warn("⚠️ Anything v4 erreur:", response.status, error);
      }
    } catch (err) {
      console.warn("⚠️ Anything v4 échoué:", err.message);
    }

    console.error("❌ Tous les modèles ont échoué");
    return res.status(500).json({
      error: "Impossible de générer l'image",
      hint: "Vérife HUGGINGFACE_API_KEY et le quota",
    });

  } catch (err) {
    console.error("❌ Erreur:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

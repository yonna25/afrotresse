// api/falGenerate.js
// Version HuggingFace Router stable pour PWA AfroTresse
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { selfieBase64, styleImageUrl } = req.body;

    if (!selfieBase64 || !styleImageUrl) {
      return res.status(400).json({ error: "Missing data" });
    }

    const hfToken = process.env.HUGGINGFACE_API_KEY;
    if (!hfToken) {
      return res.status(500).json({ error: "API key manquante" });
    }

    // URL absolue de l'image style
    const absoluteStyleImageUrl = styleImageUrl.startsWith("http")
      ? styleImageUrl
      : `https://afrotresse-hfwf.vercel.app${styleImageUrl}`;

    console.log("✅ Selfie et style prêts");
    console.log("🔗 URL style:", absoluteStyleImageUrl);

    // Récupérer style image en base64
    const styleResponse = await fetch(absoluteStyleImageUrl);
    const styleArrayBuffer = await styleResponse.arrayBuffer();
    const styleBase64 = Buffer.from(styleArrayBuffer).toString("base64");

    // Appel HuggingFace Router (img2img)
    const hfResponse = await fetch(
      "https://router.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: "Apply hairstyle from reference image, keep face intact, realistic",
          parameters: {
            image: selfieBase64,
            reference_image: styleBase64,
            guidance_scale: 7.5
          }
        }),
      }
    );

    if (hfResponse.ok) {
      const blob = await hfResponse.blob();
      const imageBuffer = Buffer.from(await blob.arrayBuffer());
      const base64Image = imageBuffer.toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      console.log("✅ Image générée avec HuggingFace Router");
      return res.status(200).json({ imageUrl: dataUrl });
    } else {
      const errorText = await hfResponse.text();
      console.error("❌ HF erreur:", hfResponse.status, errorText);
      return res.status(500).json({ error: "Impossible de générer l'image HF" });
    }

  } catch (err) {
    console.error("❌ Erreur générale:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

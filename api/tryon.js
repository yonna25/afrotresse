export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { image, prompt } = req.body;
  const token = process.env.HUGGINGFACE_API_KEY;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt + ", on a real human face, luxury hair photography" }),
      }
    );

    if (!response.ok) throw new Error("HuggingFace indisponible");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

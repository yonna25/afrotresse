export default async function handler(req, res) {
  const token = process.env.HUGGINGFACE_API_KEY;

  // Si c'est un GET, on s'en sert pour tester la clé (comme l'ancien testHF)
  if (req.method === 'GET') {
    return res.status(200).json({ status: "Route active", key_present: !!token });
  }

  // Si c'est un POST, on fait le Try-on
  if (req.method === 'POST') {
    const { prompt } = req.body;
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: prompt }),
        }
      );
      const arrayBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      return res.send(Buffer.from(arrayBuffer));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

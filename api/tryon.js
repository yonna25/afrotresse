export default async function handler(req, res) {
  const token = process.env.HUGGINGFACE_API_KEY;

  if (req.method === 'GET') {
    return res.status(200).json({ status: "Route active", key_present: !!token });
  }

  if (req.method === 'POST') {
    const { prompt } = req.body;
    
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            inputs: prompt + ", high quality luxury hair photography, 8k" 
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ error: "L'IA est occupée", details: errorText });
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      // On renvoie l'image au format JSON Base64
      return res.status(200).json({ 
        image: `data:image/png;base64,${base64}` 
      });

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
  
  return res.status(405).json({ error: "Méthode non autorisée" });
}

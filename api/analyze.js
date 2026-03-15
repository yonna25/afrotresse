API
// ─── Proxy Vercel — AfroTresse IA ────────────────────────────────────────────
// La clé API Anthropic est stockée dans Vercel → Settings → Environment Variables
// Elle n'est JAMAIS dans le code GitHub. ✅
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Autoriser uniquement les POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Récupérer la clé depuis les variables d'environnement Vercel
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Clé API non configurée sur le serveur." });
  }

  try {
    const { model, max_tokens, messages } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("Erreur proxy:", err);
    return res.status(500).json({ error: "Erreur interne du proxy." });
  }
}

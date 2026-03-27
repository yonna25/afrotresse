import Replicate from "replicate";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export default async function handler(req, res) {
  const { image_url } = req.body;

  // Modèle SAM : Il détecte les "cheveux" (hair) et crée le masque
  const output = await replicate.run(
    "lucataco/remove-bg:95f1610e1323751010375990529d2f3066699c6e3b07357c320875b8a5d3f2d2",
    { input: { image: image_url, target: "hair" } } 
  );

  // Retourne l'URL du masque (les cheveux en blanc, le reste en noir)
  res.status(200).json({ mask_url: output });
}


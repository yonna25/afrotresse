import { IncomingForm } from 'formidable';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BRAIDS_DB = [
  { id: "pompom", faceShapes: ["round", "square", "oval", "heart", "diamond"] },
  { id: "tresseplaquees", faceShapes: ["oval", "long", "diamond", "square", "heart"] },
  { id: "ghanabraids", faceShapes: ["square", "heart", "oval", "diamond", "round", "long"] },
  { id: "tressecollees", faceShapes: ["oval", "long", "diamond", "heart", "round", "square"] },
  { id: "box-braids", faceShapes: ["oval", "round", "square", "heart", "long", "diamond"] },
  { id: "stitch-braids", faceShapes: ["oval", "long", "square", "diamond", "round"] }
];

const FACE_SHAPE_NAMES = {
  oval: "Ovale",
  round: "Ronde",
  square: "Carrée",
  heart: "Cœur",
  long: "Allongée",
  diamond: "Diamant"
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown';

  const authHeader = req.headers.authorization;
  let userId = null;
  let credits = 0;

  try {
    // Auth user
    if (authHeader && authHeader !== 'Bearer null') {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) userId = user.id;
    }

    // Récupération crédits
    if (userId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      credits = data?.credits ?? 0;

    } else {
      const { data, error } = await supabase
        .from('anonymous_usage')
        .select('credits')
        .eq('ip_address', ip)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { error: insertError } = await supabase
          .from('anonymous_usage')
          .insert([{ ip_address: ip, credits: 2 }]);

        if (insertError) throw insertError;
        credits = 2;

      } else {
        credits = data.credits ?? 0;
      }
    }

    // Vérif crédits
    if (credits <= 0) {
      return res.status(403).json({ error: "Crédits insuffisants" });
    }

    // Lecture fichier
    const form = new IncomingForm();
    await new Promise((resolve, reject) => {
      form.parse(req, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Simulation analyse
    const faceShape = "long";

    // Décrément crédits
    if (userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: credits - 1 })
        .eq('id', userId);

      if (error) throw error;

    } else {
      const { error } = await supabase
        .from('anonymous_usage')
        .update({ credits: credits - 1 })
        .eq('ip_address', ip);

      if (error) throw error;
    }

    // Réponse
    return res.status(200).json({
      faceShape,
      faceShapeName: FACE_SHAPE_NAMES[faceShape],
      confidence: 88,
      recommendations: BRAIDS_DB.filter(b =>
        b.faceShapes.includes(faceShape)
      )
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erreur serveur",
      details: error.message
    });
  }
}

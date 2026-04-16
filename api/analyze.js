/**
 * API AfroTresse - version corrigée stable (fix Supabase + logs)
 */

import { createClient } from '@supabase/supabase-js';

// 🔥 FIX ENV (CRITIQUE)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ENV MANQUANTES SUPABASE");
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

  console.log("🔥 API HIT");

  try {
    // 🔥 BODY SAFE
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { faceShape } = body || {};

    console.log("👉 faceShape reçu :", faceShape);

    if (!faceShape) {
      return res.status(400).json({ error: "faceShape requis" });
    }

    const allowedShapes = ["oval","round","square","heart","long","diamond"];
    if (!allowedShapes.includes(faceShape)) {
      return res.status(400).json({ error: "faceShape invalide" });
    }

    // 🔥 IP SAFE
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      'unknown';

    console.log("👉 IP :", ip);

    // 🔥 SELECT
    const { data, error } = await supabase
      .from('anonymous_usage')
      .select('credits')
      .eq('ip_address', ip)
      .maybeSingle();

    if (error) {
      console.error("❌ SELECT ERROR:", error);
      throw error;
    }

    let credits = 0;

    // 🔥 INSERT SI NOUVEAU
    if (!data) {
      console.log("🆕 Nouvel utilisateur");

      const { error: insertError } = await supabase
        .from('anonymous_usage')
        .insert([{
          ip_address: ip,
          credits: 2,
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error("❌ INSERT ERROR:", insertError);
        throw insertError;
      }

      credits = 2;

    } else {
      credits = data.credits ?? 0;
      console.log("💰 Credits existants :", credits);
    }

    // 🔴 BLOQUAGE
    if (credits <= 0) {
      return res.status(403).json({ error: "Crédits insuffisants" });
    }

    // 🔥 UPDATE (SAFE)
    const { error: updateError } = await supabase
      .from('anonymous_usage')
      .update({
        credits: credits - 1,
        updated_at: new Date().toISOString()
      })
      .eq('ip_address', ip);

    if (updateError) {
      console.error("❌ UPDATE ERROR:", updateError);
      throw updateError;
    }

    console.log("✅ Crédit décrémenté");

    const recommendations = BRAIDS_DB.filter(b =>
      b.faceShapes.includes(faceShape)
    );

    return res.status(200).json({
      faceShape,
      faceShapeName: FACE_SHAPE_NAMES[faceShape],
      confidence: 95,
      recommendations
    });

  } catch (error) {
    console.error("❌ ERREUR API :", error);

    return res.status(500).json({
      error: "Erreur serveur",
      details: error.message
    });
  }
}

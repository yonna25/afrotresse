import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    console.log("API HIT OK");

    if (req.method !== 'POST') {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // SAFE BODY PARSE
    let body = {};
    try {
      body = typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON" });
    }

    const { faceShape } = body;
    console.log("faceShape reçu:", faceShape);

    if (!faceShape) {
      return res.status(400).json({ error: "faceShape requis" });
    }

    // VÉRIFICATION ENV
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("ENV MISSING — SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY absent");
      return res.status(500).json({ error: "Config serveur manquante" });
    }

    // FIX 1 : Créer le client avec auth désactivée (obligatoire pour service_role server-side)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // EXTRACTION IP
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    console.log("IP résolue:", ip);

    // FIX 2 : Bloquer les requêtes sans IP identifiable
    if (!ip) {
      console.error("IP non identifiable — requête bloquée");
      return res.status(400).json({ error: "IP non identifiable" });
    }

    // SELECT existant
    const { data: existingData, error: selectError } = await supabase
      .from('anonymous_usage')
      .select('*')
      .eq('ip_address', ip)
      .maybeSingle();

    if (selectError) {
      console.error("Erreur SELECT:", selectError);
      return res.status(500).json({ error: "Erreur lecture base de données" });
    }

    console.log("SELECT result:", existingData);

    let currentCredits;

    if (!existingData) {
      // FIX 3 : INSERT puis re-fetch pour avoir les vraies données en base
      const { error: insertError } = await supabase
        .from('anonymous_usage')
        .insert([{ ip_address: ip, credits: 2 }]);

      if (insertError) {
        console.error("Erreur INSERT:", insertError);
        return res.status(500).json({ error: "Insert failed", details: insertError.message });
      }

      console.log("INSERT OK — re-fetch en cours");

      // Re-fetch pour confirmer l'état réel en base
      const { data: freshData, error: reFetchError } = await supabase
        .from('anonymous_usage')
        .select('*')
        .eq('ip_address', ip)
        .maybeSingle();

      if (reFetchError || !freshData) {
        console.error("Erreur re-fetch après INSERT:", reFetchError);
        return res.status(500).json({ error: "Re-fetch failed after insert" });
      }

      console.log("Re-fetch après INSERT:", freshData);
      currentCredits = freshData.credits;

    } else {
      currentCredits = existingData.credits;
    }

    // VÉRIFICATION CRÉDITS
    if ((currentCredits ?? 0) <= 0) {
      console.log("Crédits épuisés pour IP:", ip);
      return res.status(403).json({ error: "No credits" });
    }

    // FIX 4 : UPDATE avec vérification du nombre de lignes affectées
    const { data: updateData, error: updateError } = await supabase
      .from('anonymous_usage')
      .update({
        credits: currentCredits - 1,
        updated_at: new Date().toISOString()
      })
      .eq('ip_address', ip)
      .select(); // retourne les lignes mises à jour pour confirmation

    if (updateError) {
      console.error("Erreur UPDATE:", updateError);
      return res.status(500).json({ error: "Update failed", details: updateError.message });
    }

    if (!updateData || updateData.length === 0) {
      console.error("UPDATE n'a affecté aucune ligne pour IP:", ip);
      return res.status(500).json({ error: "Update affected 0 rows" });
    }

    console.log("UPDATE OK — crédits restants:", currentCredits - 1);

    // RECOMMANDATIONS (à enrichir selon ta logique métier)
    const recommendations = getRecommendations(faceShape);

    return res.status(200).json({
      faceShape,
      faceShapeName: faceShape,
      confidence: 95,
      recommendations,
      creditsRemaining: currentCredits - 1
    });

  } catch (err) {
    console.error("FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err.message
    });
  }
}

// FIX 5 : Logique de recommandations réelle (à adapter selon tes données)
function getRecommendations(faceShape) {
  const map = {
    oval:     ["Tresses classiques", "Box braids", "Twists"],
    round:    ["Tresses hautes", "Cornrows longs", "Senegalese twists"],
    square:   ["Tresses douces sur les côtés", "Halo braids", "Locs"],
    heart:    ["Tresses larges en bas", "Side braids", "Fulani braids"],
    oblong:   ["Tresses volumineuses", "Bantu knots", "Flat twists"],
    diamond:  ["Bob braids", "Tresses centrées", "Crown braids"],
  };

  const key = faceShape?.toLowerCase();
  return map[key] ?? ["Box braids", "Cornrows", "Senegalese twists"];
}

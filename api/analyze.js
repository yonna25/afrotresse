import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. Sécurité : Vérifier les variables d'environnement
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Configuration Supabase manquante sur Vercel" });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { userId, sessionId } = req.body;

  try {
    // 2. Recherche du compte existant
    let query = supabase.from('usage_credits').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data: account, error: fetchError } = await query.maybeSingle();

    if (fetchError) throw fetchError;

    // 3. Cas : Nouveau compte
    if (!account) {
      const { data: newAcc, error: insError } = await supabase
        .from('usage_credits')
        .insert([{ 
          user_id: userId || null, 
          session_id: sessionId || null, 
          credits: 1 // On initialise à 1 (déjà débité)
        }])
        .select()
        .single();

      if (insError) throw insError;
      return res.status(200).json({ success: true, remaining: 1 });
    }

    // 4. Cas : Compte existant
    if (account.credits <= 0) {
      return res.status(403).json({ error: 'Crédits épuisés' });
    }

    const { error: updError } = await supabase
      .from('usage_credits')
      .update({ credits: account.credits - 1 })
      .eq('id', account.id);

    if (updError) throw updError;

    return res.status(200).json({ success: true, remaining: account.credits - 1 });

  } catch (error) {
    console.error("Erreur API Analyze:", error.message);
    return res.status(500).json({ error: error.message });
  }
}

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

  // Autoriser uniquement le POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { userId, sessionId } = req.body;

  // Sécurité : éviter une requête vide
  if (!userId && !sessionId) {
    return res.status(400).json({ error: "Identifiant manquant (userId ou sessionId)" });
  }

  try {
    // 2. Recherche du compte ou de la session existante
    let query = supabase.from('usage_credits').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data: account, error: fetchError } = await query.maybeSingle();

    if (fetchError) throw fetchError;

    // 3. Cas : Nouveau visiteur (Première analyse)
    if (!account) {
      const { data: newAcc, error: insError } = await supabase
        .from('usage_credits')
        .insert([{ 
          user_id: userId || null, 
          session_id: sessionId || null, 
          credits: 1 // On initialise à 1 (car la 1ère analyse consomme le 1er des 2 crédits offerts)
        }])
        .select()
        .single();

      if (insError) throw insError;
      return res.status(200).json({ success: true, remaining: 1 });
    }

    // 4. Cas : Visiteur connu - Vérification des crédits restants
    if (account.credits <= 0) {
      return res.status(403).json({ error: 'Tes analyses gratuites sont terminées — crée un compte pour continuer.' });
    }

    // 5. Décrémentation du crédit
    const { error: updError } = await supabase
      .from('usage_credits')
      .update({ credits: account.credits - 1 })
      .eq('id', account.id);

    if (updError) throw updError;

    return res.status(200).json({ success: true, remaining: account.credits - 1 });

  } catch (error) {
    console.error("Erreur API Analyze:", error.message);
    return res.status(500).json({ error: "Erreur serveur lors de la gestion des crédits" });
  }
}

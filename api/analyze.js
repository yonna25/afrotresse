import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, sessionId } = req.body;
  const filter = userId ? `user_id.eq.${userId}` : `session_id.eq.${sessionId}`;

  try {
    // 1. Récupérer l'état actuel
    let { data: account, error: fetchError } = await supabase
      .from('usage_credits')
      .select('*')
      .or(filter)
      .maybeSingle();

    // 2. Si nouveau : créer avec 1 crédit (2 de base - 1 consommé)
    if (!account) {
      const { data: newAcc, error: insError } = await supabase
        .from('usage_credits')
        .insert([{ 
          user_id: userId || null, 
          session_id: sessionId || null, 
          credits: 1 
        }])
        .select()
        .single();
      
      if (insError) throw insError;
      return res.status(200).json({ success: true, remaining: 1 });
    }

    // 3. Si existant : vérifier et déduire
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
    return res.status(500).json({ error: error.message });
  }
}

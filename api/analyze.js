import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Important : clé service pour bypasser le RLS
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, sessionId } = req.body;
  const identifier = userId ? { user_id: userId } : { session_id: sessionId };

  try {
    // 1. Récupérer ou Créer le compte crédit
    let { data: account, error } = await supabase
      .from('usage_credits')
      .select('credits')
      .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
      .single();

    if (!account) {
      const { data: newAccount } = await supabase
        .from('usage_credits')
        .insert([ { ...identifier, credits: 2 } ])
        .select()
        .single();
      account = newAccount;
    }

    // 2. Vérifier si assez de crédits
    if (account.credits <= 0) {
      return res.status(403).json({ error: 'Crédits épuisés' });
    }

    // 3. Déduire 1 crédit
    const { error: updateError } = await supabase
      .from('usage_credits')
      .update({ credits: account.credits - 1 })
      .match(identifier);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, remaining: account.credits - 1 });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

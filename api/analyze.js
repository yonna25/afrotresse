// ... (haut du fichier identique)

  try {
    let query = supabase.from('usage_credits').select('id, credits');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('session_id', sessionId);
    }

    const { data: account, error: fetchError } = await query.maybeSingle();
    if (fetchError) throw fetchError;

    // 3. Cas : NOUVELLE UTILISATRICE (On offre 2, on consomme 1)
    if (!account) {
      const { error: insError } = await supabase
        .from('usage_credits')
        .insert([{ 
          user_id: userId || null, 
          session_id: sessionId || null, 
          credits: 1 // On initialise à 1 car l'analyse actuelle est déjà "payée" par le cadeau
        }]);

      if (insError) throw insError;
      return res.status(200).json({ success: true, remaining: 1 });
    }

    // 4. Cas : Utilisatrice connue - Vérification
    if (account.credits <= 0) {
      return res.status(403).json({ error: 'Tes analyses gratuites sont terminées — crée un compte pour continuer.' });
    }

    // 5. Décompte pour les utilisatrices qui reviennent
    const { data: updatedAccount, error: updError } = await supabase
      .from('usage_credits')
      .update({ credits: account.credits - 1 })
      .eq('id', account.id)
      .select('credits')
      .single();

    if (updError) throw updError;
    return res.status(200).json({ success: true, remaining: updatedAccount.credits });

// ... (reste du fichier identique)

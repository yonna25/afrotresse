import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getSupabaseCredits } from '../services/useSupabaseCredits';
import { supabase } from '../services/supabase';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        navigate('/login');
        return;
      }

      setUser(currentUser);

      // Correction technique : lecture du solde réel
      const userCredits = await getSupabaseCredits(currentUser.id);
      setCredits(userCredits);
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF4EC] flex items-center justify-center">
        <p className="text-[#2C1A0E]">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF4EC] p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#2C1A0E]">Mon profil</h1>
          <button 
            onClick={handleLogout}
            className="text-sm text-red-600 font-medium"
          >
            Déconnexion
          </button>
        </div>

        {/* Carte Crédits */}
        <div className="bg-[#2C1A0E] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <p className="text-sm opacity-70 mb-2">Crédits disponibles</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-[#C9963A]">{credits}</span>
              <span className="text-[#C9963A] opacity-70">analyses</span>
            </div>
            <button 
              onClick={() => navigate('/credits')}
              className="mt-6 w-full py-3 bg-[#C9963A] hover:bg-[#B08332] text-[#2C1A0E] font-bold rounded-xl transition-colors shadow-lg"
            >
              Acheter des crédits
            </button>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-[#C9963A] opacity-10 rounded-full blur-3xl"></div>
        </div>

        {/* Infos Utilisateur */}
        <div className="bg-white rounded-3xl p-6 border border-[#C9963A]/10 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Email</label>
              <p className="text-[#2C1A0E] font-medium">{user?.email}</p>
            </div>
            <div className="h-[1px] bg-gray-50"></div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Statut</label>
              <p className="text-[#2C1A0E] font-medium">Membre AfroTresse</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

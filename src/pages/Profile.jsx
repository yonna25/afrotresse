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

      // RÉPARATION : Utilisation de la bonne fonction pour lire la table usage_credits
      const userCredits = await getSupabaseCredits(currentUser.id);
      setCredits(userCredits);
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
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
        <p className="text-[#2C1A0E]">Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF4EC] p-6">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8 border border-[#C9963A]/20">
        <h1 className="text-2xl font-bold text-[#2C1A0E] mb-6">Mon Profil</h1>
        
        <div className="space-y-6">
          <div className="pb-6 border-bottom border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Email</p>
            <p className="text-[#2C1A0E] font-medium">{user?.email}</p>
          </div>

          <div className="bg-[#2C1A0E] rounded-xl p-6 text-white">
            <p className="text-sm opacity-80 mb-1">Crédits d'analyse disponibles</p>
            <p className="text-3xl font-bold text-[#C9963A]">{credits}</p>
            <button 
              onClick={() => navigate('/credits')}
              className="mt-4 text-sm bg-white/10 hover:bg-white/20 py-2 px-4 rounded-lg transition-colors"
            >
              Acheter plus de crédits
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

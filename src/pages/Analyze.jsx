import { incrementAnalyses } from '../services/credits.js'

// Exemple de fonction de fin d'analyse
const handleAnalysisFinished = (results) => {
  // 1. On enregistre les résultats pour l'affichage
  sessionStorage.setItem('afrotresse_results', JSON.stringify(results));
  
  // 2. ON DÉCOMPTE / INCRÉMENTE ICI
  // C'est ce qui fera apparaître "1" puis "2" sur le profil
  incrementAnalyses(); 
  
  // 3. On affiche les styles à l'utilisatrice
  navigate('/results'); 
}

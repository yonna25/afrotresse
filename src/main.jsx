import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 1. ALERTE DE DÉMARRAGE (Pour confirmer que le fichier est lu)
console.log("[CRITIQUE] main.jsx: Initialisation du moteur...");

// 2. CAPTUREUR D'ERREURS GLOBAL
// Si un fichier importé (comme Results ou faceAnalysis) a une erreur, 
// ce code l'affichera en rouge sur votre écran au lieu d'un écran blanc.
window.onerror = function(message, source, lineno, colno, error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:red;color:white;z-index:99999;padding:20px;font-family:monospace;';
  errorDiv.innerHTML = `
    <h2 style="margin:0">❌ Erreur Détectée :</h2>
    <p>${message}</p>
    <small>Fichier: ${source} (Ligne: ${lineno})</small>
  `;
  document.body.appendChild(errorDiv);
  return false;
};

// 3. RENDU SÉCURISÉ
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("ERREUR: L'élément #root est introuvable dans index.html");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

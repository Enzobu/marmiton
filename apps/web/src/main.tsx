import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const [status, setStatus] = React.useState('Vérification de l’API…');
  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/health`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('API indisponible');
        const data: unknown = await response.json();
        if (typeof data !== 'object' || data === null || !('status' in data) || data.status !== 'ok') throw new Error('Réponse invalide');
        setStatus('API connectée');
      })
      .catch(error => { if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : 'API indisponible'); });
    return () => controller.abort();
  }, []);
  return <main className="shell"><div className="eyebrow">Cuisine maison</div><h1>Mes recettes</h1><p>Un endroit pour rassembler toutes tes recettes préférées.</p><div className="status">{status}</div><section><h2>Ton carnet démarre ici.</h2><p>La structure frontend, API et base de données est prête pour les premières fonctionnalités.</p></section></main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

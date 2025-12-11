import { useEffect, useState } from 'react';

function App() {
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    window.api.getAppVersion().then(setVersion).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">NSFW Booru Desktop Client</h1>
        <p className="text-muted-foreground">Version: {version || 'Loading...'}</p>
      </div>
    </div>
  );
}

export default App;


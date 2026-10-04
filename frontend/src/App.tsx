import { useEffect, useState } from 'react';
import './styles/tokens.css';
import { checkHealth } from './lib/api';
import CheckForm from './components/CheckForm';

function App() {
  const [health, setHealth] = useState<string>('Checking API...');

  useEffect(() => {
    checkHealth().then((ok) => {
      setHealth(ok ? 'API ok' : 'API unreachable');
    });
  }, []);

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: 'var(--space-6)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1>TrustCheck</h1>
        <p style={{ color: 'var(--color-muted)' }}>Status: {health}</p>
      </header>
      <main>
        <CheckForm />
      </main>
    </div>
  );
}

export default App;

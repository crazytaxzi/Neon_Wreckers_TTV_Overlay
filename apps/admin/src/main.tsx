import { type FormEvent, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { errorMessage, requestApi } from '@neon-wreckers/browser-client';
import '@neon-wreckers/client-theme/styles.css';
import './admin.css';

type StationSummary = {
  name: string;
  power: number;
  integrity: number;
};

type LoyaltyHealth = {
  ok: boolean;
  detail: string;
};

type ConfigVersion = {
  id: string;
  slug: string;
  version: number;
  lifecycle: string;
  createdAt: string;
};

function App() {
  const [config, setConfig] = useState<ConfigVersion[]>([]);
  const [health, setHealth] = useState<LoyaltyHealth | null>(null);
  const [station, setStation] = useState<StationSummary | null>(null);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    const [nextStation, nextHealth, nextConfig] = await Promise.all([
      requestApi<StationSummary>('/api/v1/station'),
      requestApi<LoyaltyHealth>('/api/v1/integrations/streamelements/health'),
      requestApi<ConfigVersion[]>('/api/v1/admin/config')
    ]);
    setStation(nextStation);
    setHealth(nextHealth);
    setConfig(nextConfig);
  };

  useEffect(() => {
    requestApi('/api/v1/me')
      .then(refresh)
      .catch(() => setMessage('Sign in through the main game first, then reopen /admin/.'));
  }, []);

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      await requestApi('/api/v1/admin/config', {
        method: 'POST',
        body: JSON.stringify({
          slug: String(form.get('slug')),
          lifecycle: String(form.get('lifecycle')),
          contentJson: JSON.parse(String(form.get('json') || '{}'))
        })
      });
      setMessage('Config version saved and audited.');
      await refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };

  const spawn = async () => {
    try {
      await requestApi('/api/v1/admin/actions/spawn-wreck', { method: 'POST' });
      setMessage('Fresh wreck spawned.');
      await refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  };

  return (
    <main className="shell admin">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">NW</div>
          <div>
            <h1>Streamer Control Center</h1>
            <p>Friendly forms for station chaos, minus the cursed spreadsheet smell.</p>
          </div>
        </div>
      </header>

      {message && (
        <button className="toast" onClick={() => setMessage('')}>
          <b>{message}</b>
        </button>
      )}

      <section className="two-col">
        <div className="panel">
          <h2>Station Controls</h2>
          <p>{station?.name} · Power {station?.power}% · Integrity {station?.integrity}%</p>
          <button className="primary" onClick={spawn}>Spawn Wreck</button>
          <h3>StreamElements Health</h3>
          <pre>{JSON.stringify(health, null, 2)}</pre>
        </div>

        <form className="panel" onSubmit={publish}>
          <h2>Versioned Config</h2>
          <label>
            Slug
            <input name="slug" defaultValue="balance.patch" required />
          </label>
          <label>
            Lifecycle
            <select name="lifecycle" defaultValue="draft">
              <option>draft</option>
              <option>scheduled</option>
              <option>active</option>
              <option>retired</option>
              <option>archived</option>
            </select>
          </label>
          <label>
            JSON
            <textarea name="json" defaultValue={'{"note":"reviewed configuration record"}'} />
          </label>
          <button className="primary">Validate & Save Draft</button>
        </form>
      </section>

      <section className="panel">
        <h2>Recent Config Versions</h2>
        <table>
          <thead>
            <tr><th>Slug</th><th>Version</th><th>Lifecycle</th><th>Created</th></tr>
          </thead>
          <tbody>
            {config.map(entry => (
              <tr key={entry.id}>
                <td>{entry.slug}</td>
                <td>{entry.version}</td>
                <td>{entry.lifecycle}</td>
                <td>{new Date(entry.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

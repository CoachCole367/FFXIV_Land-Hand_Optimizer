'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Preset = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  isDefault: boolean;
  snapshotId: string;
  createdAt: string;
  updatedAt: string;
};

type ExportPayload = { presets: any[] };

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const shareBase = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), []);

  async function loadPresets() {
    setIsLoading(true);
    const res = await fetch('/api/presets');
    const data = await res.json();
    setPresets(data.presets ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPresets();
  }, []);

  async function handleExport() {
    const res = await fetch('/api/presets/export');
    const payload: ExportPayload = await res.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'presets.json';
    link.click();
    URL.revokeObjectURL(link.href);
    setMessage('Exported presets as presets.json');
  }

  async function handleImport() {
    try {
      const parsed = JSON.parse(importText) as ExportPayload;
      await fetch('/api/presets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presets: parsed.presets ?? [] })
      });
      setMessage('Imported presets successfully');
      setImportText('');
      loadPresets();
    } catch (error) {
      console.error(error);
      setMessage('Failed to import presets. Ensure the JSON payload is valid.');
    }
  }

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <header className="panel">
        <h2 className="section-title">Presets</h2>
        <p className="muted">Save Craftsim-friendly filters as reusable presets, export them, and share links.</p>
      </header>

      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, marginRight: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Import presets</h3>
            <p className="muted">Paste JSON exported from this tool or another user to add their presets.</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              style={{ width: '100%', minHeight: '120px' }}
              placeholder='{"presets": []}'
            />
            <div className="row" style={{ marginTop: '0.5rem' }}>
              <button className="ghost" onClick={handleImport} disabled={!importText.trim()}>
                Import JSON
              </button>
              <button className="ghost" onClick={handleExport}>
                Export all
              </button>
            </div>
          </div>
          <div className="subtle-card" style={{ minWidth: '260px' }}>
            <strong>Sharing</strong>
            <p className="muted" style={{ marginTop: '0.35rem' }}>
              Each preset has a shareable link that will hydrate the Craftsim search form with identical parameters and snapshot
              data.
            </p>
            <p className="muted" style={{ marginTop: '0.35rem' }}>
              Export payloads include the cached market data snapshot so replaying a search uses the original prices.
            </p>
          </div>
        </div>
        {message && <p className="muted" style={{ marginTop: '0.5rem' }}>{message}</p>}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {isLoading && <div className="panel">Loading presets…</div>}
        {!isLoading && presets.length === 0 && <div className="panel">No presets saved yet.</div>}
        {presets.map((preset) => {
          const shareLink = `${shareBase}/craftsim?presetId=${preset.id}`;
          return (
            <div key={preset.id} className="panel">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ marginTop: 0 }}>{preset.name}</h3>
                {preset.isDefault && <span className="badge">Default</span>}
              </div>
              <p className="muted">{preset.description}</p>
              <div className="row">
                {preset.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="subtle-card" style={{ marginTop: '0.5rem' }}>
                <small className="muted">Snapshot {preset.snapshotId.slice(0, 8)}…</small>
                <p className="muted" style={{ marginTop: '0.25rem' }}>
                  <Link href={`/craftsim?presetId=${preset.id}`} className="tag">
                    Load preset
                  </Link>
                  <br />
                  <a href={shareLink} className="tag">
                    Copy share link
                  </a>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

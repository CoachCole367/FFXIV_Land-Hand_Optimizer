'use client';

import { useAppSettings } from '../providers/AppSettingsProvider';

export default function SettingsPage() {
  const { theme, setTheme, compactTable, setCompactTable } = useAppSettings();

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <header className="panel">
        <h2 className="section-title">Settings</h2>
        <p className="muted">Dark theme toggle and compact table preferences carry across Craftsim search.</p>
      </header>

      <div className="panel grid" style={{ gap: '0.75rem' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>Theme</strong>
            <p className="muted" style={{ marginTop: '0.15rem' }}>
              Choose between dark and light visuals.
            </p>
          </div>
          <div className="row">
            <label className="switch">
              <input type="radio" checked={theme === 'dark'} onChange={() => setTheme('dark')} />
              <span>Dark</span>
            </label>
            <label className="switch">
              <input type="radio" checked={theme === 'light'} onChange={() => setTheme('light')} />
              <span>Light</span>
            </label>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>Compact tables</strong>
            <p className="muted" style={{ marginTop: '0.15rem' }}>
              Reduce padding in data-heavy views like the Craftsim results table.
            </p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={compactTable} onChange={(e) => setCompactTable(e.target.checked)} />
            <span>Enable compact layout</span>
          </label>
        </div>
      </div>
    </div>
  );
}

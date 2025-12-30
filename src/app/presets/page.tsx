const presetCards = [
  {
    title: 'Raid consumables',
    description: 'Culinarian HQ food and tinctures filtered by sales velocity.',
    chips: ['Recent sales', 'High velocity', 'Omnicrafter']
  },
  {
    title: 'Expert rotations',
    description: 'Craftsim-ready expert recipe checklist for resplendent and facet sets.',
    chips: ['Expert', 'Rotation notes', 'Materials']
  },
  {
    title: 'Leveling hand-ins',
    description: 'Collectibles and custom deliveries filtered by yields and ROI.',
    chips: ['Collectible', 'Yields aware', 'ROI filters']
  }
];

export default function PresetsPage() {
  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <header className="panel">
        <h2 className="section-title">Presets</h2>
        <p className="muted">Save and recall Craftsim-friendly filters for your favorite shopping routes.</p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {presetCards.map((preset) => (
          <div key={preset.title} className="panel">
            <h3 style={{ marginTop: 0 }}>{preset.title}</h3>
            <p className="muted">{preset.description}</p>
            <div className="row">
              {preset.chips.map((chip) => (
                <span key={chip} className="chip">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

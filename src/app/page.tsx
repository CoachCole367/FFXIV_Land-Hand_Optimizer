import Link from 'next/link';

const quickLinks = [
  { href: '/craftsim', title: 'Craftsim Search', description: 'Search, filter, and compare profitability across data centers.' },
  { href: '/presets', title: 'Presets', description: 'Curate shopping lists, rotations, and preferred regions.' },
  { href: '/settings', title: 'Settings', description: 'Toggle dark mode, compact tables, and Craftsim defaults.' }
];

export default function HomePage() {
  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <header className="panel">
        <h1 className="section-title">FFXIV Land & Hand Optimizer</h1>
        <p className="muted">
          Jump straight into Craftsim-friendly searches, keep your presets close, and configure dark / compact modes to
          match your workflow.
        </p>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {quickLinks.map((card) => (
          <Link key={card.href} href={card.href} className="panel" style={{ textDecoration: 'none' }}>
            <h3 style={{ margin: 0 }}>{card.title}</h3>
            <p className="muted" style={{ marginTop: '0.35rem' }}>
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

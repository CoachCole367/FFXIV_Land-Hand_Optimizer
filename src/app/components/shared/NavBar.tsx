'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const links: { href: string; label: ReactNode }[] = [
  { href: '/', label: 'Home' },
  { href: '/craftsim', label: 'Craftsim Search' },
  { href: '/presets', label: 'Presets' },
  { href: '/settings', label: 'Settings' }
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
        return (
          <Link key={link.href} className={`nav-item ${isActive ? 'active' : ''}`} href={link.href}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

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

const repoBasePath = process.env.NEXT_PUBLIC_BASE_PATH
  ? `/${process.env.NEXT_PUBLIC_BASE_PATH.replace(/^\/+|\/+$/g, '')}`
  : '';

const normalizePath = (path?: string) => {
  if (!path) return '/';
  let normalized = path;
  if (repoBasePath && normalized.startsWith(repoBasePath)) {
    normalized = normalized.slice(repoBasePath.length) || '/';
  }
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || '/';
};

export function NavBar() {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname ?? '/');

  return (
    <nav className="navbar">
      {links.map((link) => {
        const targetPath = normalizePath(link.href);
        const isActive =
          currentPath === targetPath || (targetPath !== '/' && currentPath.startsWith(targetPath));
        return (
          <Link key={link.href} className={`nav-item ${isActive ? 'active' : ''}`} href={link.href}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

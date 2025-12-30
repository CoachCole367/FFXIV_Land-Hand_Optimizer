import type { Metadata } from 'next';
import './globals.css';
import { AppSettingsProvider } from './providers/AppSettingsProvider';
import { NavBar } from './components/shared/NavBar';

export const metadata: Metadata = {
  title: 'FFXIV Land & Hand Optimizer',
  description: 'Crafting search, presets, and settings for Craftsim workflows.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="main-shell">
        <AppSettingsProvider>
          <NavBar />
          <main className="container">{children}</main>
        </AppSettingsProvider>
      </body>
    </html>
  );
}

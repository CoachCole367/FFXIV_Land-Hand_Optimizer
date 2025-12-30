'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light';

type AppSettings = {
  theme: Theme;
  setTheme: (value: Theme) => void;
  compactTable: boolean;
  setCompactTable: (value: boolean) => void;
};

const AppSettingsContext = createContext<AppSettings | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [compactTable, setCompactTable] = useState(false);

  useEffect(() => {
    const body = document.body;
    if (theme === 'light') {
      body.classList.add('light');
    } else {
      body.classList.remove('light');
    }
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, compactTable, setCompactTable }),
    [theme, compactTable]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return ctx;
}

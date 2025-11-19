// components/Header.js
import React from 'react';
import { useTheme } from './ThemeProvider';

export function Header() {
  // useContext may return undefined if provider isn't mounted (shouldn't happen if wrapped),
  // but we guard against it anyway.
  const ctx = useTheme() || {};
  const { theme = null, toggleTheme = () => {}, mounted = false } = ctx;

  // If not mounted, avoid rendering theme-dependent text to prevent hydration mismatch.
  // Show a neutral placeholder or nothing until mounted.
  const ThemeIcon = mounted ? (theme === 'dark' ? '☀️' : '🌙') : '';

  return (
    <header className="w-full py-4 border-b">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="text-xl font-bold">Nandan Traders</div>

        <nav className="flex items-center gap-4">
          <a href="/catalog" className="text-sm">Catalog</a>
          <a href="/admin" className="text-sm">Admin Login</a>

          <button
            onClick={() => {
              // don't call toggleTheme until mounted is true and theme known
              if (!mounted) return;
              toggleTheme();
            }}
            aria-label="Toggle theme"
            className="ml-4 px-3 py-1 rounded-md border"
          >
            {/* Icon text — empty until mounted to avoid hydration mismatch */}
            {ThemeIcon}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;

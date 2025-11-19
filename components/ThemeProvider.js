// components/ThemeProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

/**
 * ThemeProvider
 * - theme: 'light' | 'dark' | null (null = not yet determined on client)
 * - toggleTheme: toggles between 'light' and 'dark'
 * - mounted: boolean flag that becomes true after client mount
 *
 * We intentionally start with theme = null so server-rendered HTML is neutral.
 * Client determines theme on mount (from localStorage or prefers-color-scheme)
 * and then toggles document.documentElement.classList accordingly.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null); // null means "unknown / SSR-safe"
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Determine theme only on client
    try {
      const saved = localStorage.getItem('site-theme');
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
      } else {
        // default to system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch (e) {
      setTheme('light'); // fallback
    } finally {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    // Keep DOM & localStorage in sync after theme is known
    if (theme === null) return;
    try {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('site-theme', theme);
    } catch (e) {
      // ignore in SSR or restricted environments
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeProvider;

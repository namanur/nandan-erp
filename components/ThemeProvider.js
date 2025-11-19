import { createContext, useContext, useEffect } from 'react';
// 💡 FIX: This line now uses a NAMED import { useLocalStorage } 
import { useLocalStorage } from '@/hooks/useLocalStorage'; 

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Use 'system' to check OS preference first, but we default to 'light' for simple use
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove the opposite class and add the current theme class
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
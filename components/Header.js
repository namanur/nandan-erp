import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  
  // Icon based on theme (using simple text icons for broad compatibility)
  const ThemeIcon = theme === 'dark' ? '☀️' : '🌙';

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 shadow-md sticky top-0 z-50 backdrop-blur-sm transition-colors duration-300">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo/Title */}
        <Link href="/" passHref legacyBehavior>
          <a className="text-3xl font-extrabold text-gray-900 dark:text-gray-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Nandan Traders
          </a>
        </Link>
        
        {/* Navigation & Actions */}
        <nav className="flex items-center space-x-4">
          
          {/* Main Links */}
          <Link href="/catalog" passHref legacyBehavior>
            <a className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors hidden sm:block">
              Catalog
            </a>
          </Link>
          
          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-xl"
            aria-label="Toggle dark mode"
          >
            {ThemeIcon}
          </Button>

          {/* Proper Login Button */}
          <Link href="/api/auth/login" passHref legacyBehavior>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors">
              Admin Login
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
// pages/_app.js
import '../styles/globals.css';
import { ThemeProvider } from '@/components/ThemeProvider'; // <-- IMPORT ThemeProvider

function MyApp({ Component, pageProps }) {
  // Wrap the Component in the ThemeProvider to correctly initialize
  // the 'bg-background' and 'text-foreground' variables.
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
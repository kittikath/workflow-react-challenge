import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './index.css';
import '@radix-ui/themes/styles.css';

/**
 * Application entry point
 * Initializes and renders the React application
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(<App />);

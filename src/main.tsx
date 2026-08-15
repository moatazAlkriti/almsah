import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { cleanBloatedCache } from './utils/storageCleaner';

// Automatically clean up any bloated opaque tile caches from previous sessions
cleanBloatedCache().catch((err) => console.warn('Cache auto-clean error:', err));

// Register Service Worker for lightweight PWA app-shell caching
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

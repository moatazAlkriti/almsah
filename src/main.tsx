import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { cleanBloatedCache } from './utils/storageCleaner';

// 1. Automatically clean up any bloated opaque tile caches from previous sessions
cleanBloatedCache().catch((err) => console.warn('Cache auto-clean error:', err));

// 2. Auto-heal any stale-chunk deployment errors without breaking the user's view
window.addEventListener('vite:preloadError', () => {
  console.warn('New deployment detected on server. Seamlessly reloading application...');
  window.location.reload();
});

// 3. Register Service Worker with auto-update on deployment
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Instantly skip waiting and take control
    updateSW(true);
  },
  onOfflineReady() {
    console.log('Almussah GIS ready for offline field work');
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Check for updates periodically when user is online
      setInterval(() => {
        registration.update().catch(() => {});
      }, 30 * 60 * 1000);
    }
  },
});

// 4. Check for updates whenever the browser window/tab regains focus
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      }).catch(() => {});
    }
  });

  // 5. Seamlessly reload when the new Service Worker takes control
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

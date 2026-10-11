import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'

// Handle service worker registration
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In local development, safely unregister stale service worker cache
    // to prevent dev server interference, preserving all IndexedDB data
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  } else {
    // In production, register PWA service worker with auto-update
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('New version of My Account Tracker available.');
      },
      onOfflineReady() {
        console.log('My Account Tracker is ready for offline operation.');
      },
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

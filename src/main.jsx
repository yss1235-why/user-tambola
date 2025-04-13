// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Add Web Speech API feature detection and polyfill
if (!('speechSynthesis' in window)) {
  console.warn('Your browser does not support the Web Speech API. Audio announcements will be disabled.');
}

// Clear any lingering speech when page loads
if ('speechSynthesis' in window) {
  speechSynthesis.cancel();
}

// Handle mobile viewport height issues
const setVhProperty = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

// Set initial value and update on resize
setVhProperty();
window.addEventListener('resize', setVhProperty);

// Add passive event listeners for better scroll performance on mobile
document.addEventListener('touchstart', function() {}, { passive: true });
document.addEventListener('touchmove', function() {}, { passive: true });

// Set up browser notifications permission request
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  }
};

// Service Worker Registration for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

// Request permission when user interacts with the page
document.addEventListener('click', () => {
  requestNotificationPermission();
}, { once: true });

// Add custom styles for animations and notifications
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out;
  }
  
  .winner-notification {
    animation: fadeInUp 0.3s ease-out, fadeOut 0.3s ease-in 4.7s forwards;
  }
  
  /* Fix for mobile 100vh issue */
  .mobile-height-fix {
    height: 100vh;
    height: calc(var(--vh, 1vh) * 100);
  }
  
  /* Safari bottom bar spacing */
  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    .safe-area-bottom {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
`;
document.head.appendChild(styleElement);

// Initialize the root and render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

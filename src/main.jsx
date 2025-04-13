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
  
  .animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out;
  }
  
  .winner-notification {
    animation: fadeInUp 0.3s ease-out, fadeOut 0.3s ease-in 4.7s forwards;
  }
`;
document.head.appendChild(styleElement);

// Initialize the root and render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { AuthProvider } from './context/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';
import Home from './pages/Home';
import BookTicket from './pages/BookTicket';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import HostLogin from './pages/host/HostLogin';
import HostDashboard from './pages/host/HostDashboard';
import TicketView from './pages/TicketView';
import NotFound from './pages/NotFound';

// App theme configuration
const appTheme = {
  colors: {
    primary: '#1D4ED8', // blue-700
    secondary: '#F59E0B', // amber-500
    accent: '#EC4899', // pink-500
    background: '#F9FAFB', // gray-50
    text: '#111827' // gray-900
  },
  fonts: {
    heading: '"Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif'
  }
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // App initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load fonts, themes, or any initial data here
        await Promise.all([
          // Example: Load custom fonts
          document.fonts.ready,
          // Simulate any other initialization task
          new Promise(resolve => setTimeout(resolve, 500))
        ]);
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Add global theme variables to CSS
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS variables
    Object.entries(appTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Set font variables
    Object.entries(appTheme.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<BookTicket />} />
            <Route path="/ticket/:ticketId" element={<TicketView />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
            
            {/* Host Routes */}
            <Route path="/host/login" element={<HostLogin />} />
            <Route path="/host/dashboard/*" element={<HostDashboard />} />
            
            {/* Fallback Routes */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

// src/components/layout/MainLayout.jsx
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import Header from './Header';
import EnhancedWinnerAnnouncement from '../game/EnhancedWinnerAnnouncement';
import appConfig from '../../config/appConfig';

const Footer = () => (
  <footer className="bg-white border-t border-gray-200 py-3 sm:py-4 mt-auto">
    <div className="px-3 sm:px-4 max-w-7xl mx-auto">
      <div className="flex flex-col items-center space-y-3">
        <p className="text-xs text-gray-500 text-center">
          {appConfig.appText.footerText.copyright}
        </p>
        
        <button 
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-500 flex items-center space-x-1"
        >
          <svg 
            className="h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          <span>{appConfig.appText.footerText.refreshButton}</span>
        </button>
      </div>
    </div>
  </footer>
);

const OfflineAlert = () => (
  <div className="bg-yellow-50 border-b border-yellow-100 animate-fade-in">
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
      <div className="flex items-center justify-center space-x-2">
        <svg 
          className="h-4 w-4 text-yellow-600 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <p className="text-xs text-yellow-700">
          You are currently offline. Some features may be unavailable.
        </p>
      </div>
    </div>
  </div>
);

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { currentGame, phase } = useGame();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Offline warning */}
      {!navigator.onLine && <OfflineAlert />}
      
      {/* Enhanced Winner Announcement Component */}
      {phase === 3 && <EnhancedWinnerAnnouncement />}
      
      <main className="flex-grow px-3 py-3 sm:px-4 sm:py-6">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;

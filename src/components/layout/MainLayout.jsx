// src/components/layout/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { setMuted, isMuted } from '../../utils/audio';
import appConfig from '../../config/appConfig';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(!isMuted());
  const { currentGame, phase } = useGame();
  const location = useLocation();

  // Update document title based on configuration
  useEffect(() => {
    document.title = appConfig.appText.websiteTitle;
  }, []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    setMuted(!newState);
  };

  // Get phase text from configuration
  const getGamePhaseText = () => {
    switch (phase) {
      case 1:
        return appConfig.appText.phaseText.setup;
      case 2:
        return appConfig.appText.phaseText.booking;
      case 3:
        return appConfig.appText.phaseText.playing;
      default:
        return appConfig.appText.phaseText.noGame;
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt={appConfig.appText.appName} 
                className="h-8 w-8"
                onError={(e) => e.target.style.display = 'none'}
              />
              <span className="text-xl font-bold text-gray-900">{appConfig.appText.appName}</span>
            </Link>
          </div>

          {/* Game Status - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {currentGame && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Game Status: </span>
                <span className="text-blue-600">
                  {getGamePhaseText()}
                </span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            >
              {soundEnabled ? (
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4m4 4l4-4" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg 
                className="h-6 w-6 text-gray-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16m-7 6h7" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            {currentGame && (
              <div className="px-4 py-2 text-sm text-gray-600">
                <span className="font-medium">Game Status: </span>
                <span className="text-blue-600">
                  {getGamePhaseText()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="bg-white border-t border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <p className="text-sm text-gray-600">
          {appConfig.appText.footerText.copyright}
        </p>
        <div className="mt-4 md:mt-0">
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {appConfig.appText.footerText.refreshButton}
          </button>
        </div>
      </div>
    </div>
  </footer>
);

const MainLayout = ({ children }) => {
  const location = useLocation();
  const { currentGame } = useGame();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-grow">
        {/* Offline Warning */}
        {!navigator.onLine && (
          <div className="bg-yellow-50 border-b border-yellow-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-center space-x-3">
                <svg 
                  className="h-5 w-5 text-yellow-600" 
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
                <p className="text-sm text-yellow-700">
                  You are currently offline. Some features may be unavailable.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
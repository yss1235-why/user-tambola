// src/components/layout/Header.jsx
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

  // Get appropriate color for game phase badge
  const getPhaseColor = () => {
    switch (phase) {
      case 1: return "badge-yellow"; // Setup
      case 2: return "badge-blue";   // Booking
      case 3: return "badge-green";  // Playing
      default: return "badge-gray";  // No game
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt={appConfig.appText.appName} 
              className="h-8 w-8"
              onError={(e) => e.target.style.display = 'none'}
            />
            <span className="text-lg font-bold text-gray-900">{appConfig.appText.appName}</span>
          </Link>

          {/* Game Status Badge - Always visible on mobile */}
          {currentGame && (
            <div className={`badge ${getPhaseColor()}`}>
              {getGamePhaseText()}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
            >
              {soundEnabled ? (
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-4-4m4 4l4-4" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>

            {/* Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg 
                className="h-5 w-5 text-gray-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16m-7 6h7" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="py-3 border-t border-gray-200 animate-slide-up">
            <nav className="space-y-3">
              <Link 
                to="/" 
                className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              {currentGame && (
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-500 mb-1">Game Status</div>
                  <div className={`badge ${getPhaseColor()}`}>
                    {getGamePhaseText()}
                  </div>
                </div>
              )}
              
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-500 mb-1">Sound</div>
                <button 
                  onClick={() => {
                    toggleSound();
                    setIsMenuOpen(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    soundEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {soundEnabled ? 'Sound On' : 'Sound Off'}
                </button>
              </div>

              <div className="px-3 py-2">
                <button 
                  onClick={() => {
                    window.location.reload();
                    setIsMenuOpen(false);
                  }}
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800"
                >
                  Refresh Game
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

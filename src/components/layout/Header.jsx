// src/components/layout/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { setMuted, isMuted } from '../../utils/audio';
import appConfig from '../../config/appConfig';

const Header = () => {
  const { currentGame, phase } = useGame();
  const [soundEnabled, setSoundEnabled] = useState(!isMuted());
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    setMuted(!newState);
  };

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
                <span className="font-medium">Status: </span>
                <span className={`
                  ${phase === 3 ? 'text-green-600' : 'text-blue-600'}
                `}>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12l-4-4H5a1 1 0 01-1-1V9a1 1 0 011-1h3l4-4z" />
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
                <span className={`
                  ${phase === 3 ? 'text-green-600' : 'text-blue-600'}
                `}>
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

export default Header;
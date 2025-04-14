// src/pages/GamePage.jsx - with enhanced winner announcements
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';
import NumberBoard from '../components/game/NumberBoard';
import NumberDisplay from '../components/game/NumberDisplay';
import WinnersDisplay from '../components/game/WinnersDisplay';
import TicketSearch from '../components/game/TicketSearch';
import EnhancedWinnerAnnouncement from '../components/game/EnhancedWinnerAnnouncement';

// Game control components being reused from existing code
import TicketCard from '../components/game/TicketCard';

// No Game Available Component (reusing from your existing code)
const NoGameAvailable = () => {
  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        No Active Game
      </h2>
      <div className="mb-6 text-gray-600">
        <p className="mb-2">There is currently no active Tambola game available.</p>
        <p>Check back later or contact the game host for more information.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-500 text-white rounded-md 
                   hover:bg-blue-600 transition-colors duration-200"
        >
          <span className="flex items-center justify-center">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </span>
        </button>
      </div>
    </div>
  );
};

// Audio Controls Component 
const AudioControls = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);

  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    // Use the existing audio utilities
    setMuted(!newState);
    setWinnersAudioMuted(!newState);
  };

  const handleEffectsToggle = () => {
    const newState = !effectsEnabled;
    setEffectsEnabled(newState);
    setSoundEffectsEnabled(newState);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setWinnersAudioVolume(newVolume);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h3 className="text-sm font-medium text-gray-800 mb-3">Sound Settings</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Voice Announcements</span>
          <button
            onClick={handleSoundToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 ${
              soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block w-4 h-4 transform transition ${
                soundEnabled ? 'translate-x-6' : 'translate-x-1'
              } rounded-full bg-white`}
            />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Sound Effects</span>
          <button
            onClick={handleEffectsToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 ${
              effectsEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block w-4 h-4 transform transition ${
                effectsEnabled ? 'translate-x-6' : 'translate-x-1'
              } rounded-full bg-white`}
            />
          </button>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Volume</span>
            <span className="text-xs text-gray-500">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

// Main Game Page Component
const GamePage = () => {
  const {
    currentGame,
    phase,
    loading,
    error,
    tickets,
    isPlayingPhase
  } = useGame();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-sm text-gray-600">Loading game data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Connection Error</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md 
                    hover:bg-blue-600 transition-colors duration-200"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Handle the case when no game is available
  if (!currentGame) {
    return <NoGameAvailable />;
  }

  return (
    <>
      {/* Include enhanced winner announcement component */}
      <EnhancedWinnerAnnouncement />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Game Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Number Display */}
            {isPlayingPhase ? <NumberDisplay /> : null}
            
            {/* Winners Display */}
            <WinnersDisplay />
            
            {/* Number Board - Only show in playing phase */}
            {isPlayingPhase ? <NumberBoard /> : null}
          </div>
          
          {/* Right Column - Tickets & Settings */}
          <div className="space-y-6">
            {/* Audio Controls */}
            <AudioControls />
            
            {/* Ticket Search */}
            <TicketSearch />
          </div>
        </div>
        
        {/* Refresh Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
          >
            Refresh Game Data
          </button>
        </div>
      </div>
    </>
  );
};

export default GamePage;

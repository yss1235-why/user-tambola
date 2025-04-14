// src/pages/GamePage.jsx - simplified test version
import React from 'react';
import { useGame } from '../context/GameContext';

const GamePage = () => {
  const {
    currentGame,
    phase,
    loading,
    error,
    tickets
  } = useGame();

  // Show loading state
  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold">Loading game data...</h2>
      </div>
    );
  }

  // Show any errors
  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Debug output of the actual data
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Game Data Debug View</h2>
      
      <div className="mb-4 p-2 border border-gray-300 rounded">
        <h3 className="font-bold">Game Phase: {phase}</h3>
        <p>Phase Name: {phase === 1 ? 'Setup' : phase === 2 ? 'Booking' : phase === 3 ? 'Playing' : 'Unknown'}</p>
        <p>Game Status: {currentGame?.gameState?.status || 'N/A'}</p>
      </div>
      
      <div className="mb-4">
        <h3 className="font-bold">Tickets Available: {tickets?.length || 0}</h3>
        {tickets && tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {tickets.map((ticket, index) => (
              <div key={index} className="p-2 border border-gray-300 rounded">
                <p>Ticket ID: {ticket.id}</p>
                <p>Status: {ticket.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No tickets available</p>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="font-bold">Settings:</h3>
        <p>Host Phone: {currentGame?.settings?.hostPhone || 'N/A'}</p>
        <p>Call Delay: {currentGame?.settings?.callDelay || 'N/A'}</p>
      </div>
      
      <div className="mt-8">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default GamePage;

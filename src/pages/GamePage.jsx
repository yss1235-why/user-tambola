// src/pages/GamePage.jsx - ultra simple version
import React from 'react';
import { useGame } from '../context/GameContext';

const GamePage = () => {
  const { phase, tickets } = useGame();

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white shadow-lg rounded-lg my-8">
      <h1 className="text-3xl font-bold text-center mb-6">Game Dashboard</h1>
      
      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold">Game Status</h2>
        <p>Current Phase: {phase} ({phase === 1 ? 'Setup' : phase === 2 ? 'Booking' : 'Playing'})</p>
        <p>Available Tickets: {tickets.length}</p>
      </div>
      
      {tickets.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-4">Tickets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="border rounded-lg p-4 bg-gray-50">
                <p className="font-bold">Ticket #{ticket.id}</p>
                <p>Status: {ticket.status}</p>
                {ticket.status === 'booked' && ticket.bookingDetails && (
                  <p>Booked by: {ticket.bookingDetails.playerName}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

export default GamePage;

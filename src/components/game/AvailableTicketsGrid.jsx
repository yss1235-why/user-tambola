// src/components/game/AvailableTicketsGrid.jsx
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import TicketCard from './TicketCard';

const AvailableTicketsGrid = () => {
  // ... keep existing state and functions ...

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-1 py-1 sm:px-4 sm:py-3 bg-blue-600 text-white">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Tickets</h2>
          <div className="text-xs">
            <span className="mr-1 sm:mr-2">Available: {availableTickets.length}</span>
            <span>Booked: {bookedTickets.length}</span>
          </div>
        </div>
      </div>
      
      {/* Tab Selector */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1 sm:py-2 text-sm font-medium ${
            activeTab === 'all' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Tickets ({allTickets.length})
        </button>
        <button 
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-1 sm:py-2 text-sm font-medium ${
            activeTab === 'available' 
              ? 'text-green-600 border-b-2 border-green-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Available ({availableTickets.length})
        </button>
        <button 
          onClick={() => setActiveTab('booked')}
          className={`flex-1 py-1 sm:py-2 text-sm font-medium ${
            activeTab === 'booked' 
              ? 'text-gray-600 border-b-2 border-gray-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Booked ({bookedTickets.length})
        </button>
      </div>
      
      <div className="p-1 sm:p-4">
        {displayedTickets.length === 0 ? (
          <div className="text-center py-2 sm:py-4">
            <p className="text-sm text-gray-500">No {activeTab} tickets to display</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
            {displayedTickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket}
                showRemoveButton={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailableTicketsGrid;

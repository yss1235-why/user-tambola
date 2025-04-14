// src/pages/GamePage.jsx - complete booking phase
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Link } from 'react-router-dom';

// Ticket Card Component
const TicketCard = ({ ticket, hostPhone }) => {
  const handleBookingClick = () => {
    const message = `I want to book Tambola ticket ${ticket.id}`;
    
    // Format phone number (remove any non-digit characters)
    const formattedPhone = hostPhone ? hostPhone.replace(/\D/g, '') : '';
    
    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      // Fallback to generic WhatsApp without specific number
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
      {/* Ticket Header */}
      <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
        <h3 className="font-bold">Ticket #{ticket.id}</h3>
        <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">
          {ticket.status === 'booked' ? 'Booked' : 'Available'}
        </span>
      </div>
      
      {/* Ticket Grid */}
      <div className="p-3 bg-gray-50">
        {ticket.numbers.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-9 gap-1 mb-1">
            {row.map((number, colIndex) => (
              <div 
                key={`${rowIndex}-${colIndex}`}
                className={`
                  aspect-square flex items-center justify-center text-sm font-medium rounded
                  ${number === 0 ? 'bg-gray-200' : 'bg-white border border-gray-300'}
                `}
              >
                {number !== 0 ? number : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Actions */}
      {ticket.status === 'available' ? (
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <button
            onClick={handleBookingClick}
            className="w-full py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
          >
            Book via WhatsApp
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Booked by: <span className="font-medium text-gray-800">
              {ticket.bookingDetails?.playerName || 'Unknown'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

// Game Info Panel Component
const GameInfoPanel = ({ phase, hostPhone }) => {
  const getPhaseText = () => {
    switch(phase) {
      case 1: return 'Game Setup';
      case 2: return 'Booking Open';
      case 3: return 'Game in Progress';
      default: return 'Unknown Phase';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="bg-blue-600 text-white px-4 py-3">
        <h2 className="font-bold text-xl">Game Status</h2>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-600">Current Phase:</p>
            <p className="text-lg font-semibold">{getPhaseText()}</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {getPhaseText()}
          </div>
        </div>
        
        {phase === 2 && (
          <div className="mt-4 bg-yellow-50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Booking Instructions:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li>Click "Book via WhatsApp" on any available ticket</li>
              <li>Send the pre-filled message to the host</li>
              <li>Wait for confirmation from the host</li>
              <li>Your ticket will be marked as booked once confirmed</li>
            </ul>
          </div>
        )}
        
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="text-gray-600 mb-1">Host Contact:</p>
          <a 
            href={`https://wa.me/${hostPhone?.replace(/\D/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm0 22c-5.301 0-9.6-4.298-9.6-9.6 0-5.302 4.299-9.6 9.6-9.6s9.6 4.298 9.6 9.6c0 5.302-4.299 9.6-9.6 9.6z"/>
            </svg>
            {hostPhone || 'Contact Host'}
          </a>
        </div>
      </div>
    </div>
  );
};

// No Game Available Component
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

// Main Game Page Component
const GamePage = () => {
  const {
    currentGame,
    phase,
    loading,
    error,
    tickets
  } = useGame();
  
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBooked, setShowBooked] = useState(true);
  const [showAvailable, setShowAvailable] = useState(true);
  
  // Filter tickets based on search term and filters
  useEffect(() => {
    if (!tickets) {
      setFilteredTickets([]);
      return;
    }
    
    let filtered = [...tickets];
    
    // Apply search filter if there's a search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.id.toString().includes(term) || 
        (ticket.bookingDetails?.playerName && 
         ticket.bookingDetails.playerName.toLowerCase().includes(term))
      );
    }
    
    // Apply status filters
    if (!showBooked) {
      filtered = filtered.filter(ticket => ticket.status !== 'booked');
    }
    
    if (!showAvailable) {
      filtered = filtered.filter(ticket => ticket.status !== 'available');
    }
    
    setFilteredTickets(filtered);
  }, [tickets, searchTerm, showBooked, showAvailable]);

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

  const hostPhone = currentGame.settings?.hostPhone || '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Game Info Section */}
      <GameInfoPanel phase={phase} hostPhone={hostPhone} />
      
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-bold text-lg">Tickets</h2>
        </div>
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by ticket number or player name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showAvailable}
                  onChange={() => setShowAvailable(!showAvailable)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Available</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={showBooked}
                  onChange={() => setShowBooked(!showBooked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Booked</span>
              </label>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredTickets.length} of {tickets.length} tickets
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
          
          {/* Tickets Grid */}
          {filteredTickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map(ticket => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  hostPhone={hostPhone}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No tickets found matching your criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setShowAvailable(true);
                  setShowBooked(true);
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors"
        >
          Refresh Game Data
        </button>
      </div>
    </div>
  );
};

export default GamePage;

// src/components/game/TicketSearch.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import TicketCard from './TicketCard';

const TicketSearch = () => {
  const { currentGame } = useGame();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [noResults, setNoResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecent, setShowRecent] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const performSearch = useCallback((query) => {
    // Reset states
    setNoResults(false);
    setIsSearching(true);
    
    if (!currentGame?.activeTickets?.tickets || !query.trim()) {
      setIsSearching(false);
      return;
    }

    const normalizedQuery = query.trim().toLowerCase();
    const tickets = currentGame.activeTickets.tickets.filter(Boolean);
    
    // Find the matching ticket first (by ID or player name)
    const exactMatches = tickets.filter(ticket => {
      // Check ticket ID (exact match)
      if (ticket.id && ticket.id.toString() === normalizedQuery) {
        return true;
      }
      
      // Check player name (case-insensitive exact match) if booking details exist
      if (ticket.bookingDetails?.playerName && 
          ticket.bookingDetails.playerName.toLowerCase() === normalizedQuery) {
        return true;
      }
      
      // Also check the bookings array in currentGame if available
      if (currentGame.activeTickets?.bookings) {
        const booking = currentGame.activeTickets.bookings.find(
          b => b && b.number && b.number.toString() === ticket.id.toString()
        );
        if (booking && booking.playerName && 
            booking.playerName.toLowerCase() === normalizedQuery) {
          return true;
        }
      }
      
      return false;
    });

    // If we found at least one match, find all tickets by those players
    if (exactMatches.length > 0) {
      // Record this search in history
      setSearchHistory(prev => [...prev, { query: normalizedQuery, timestamp: Date.now() }]);
      
      // Get all player names from the exact matches
      const playerNames = new Set();
      
      exactMatches.forEach(ticket => {
        // Add player name from ticket booking details
        if (ticket.bookingDetails?.playerName) {
          playerNames.add(ticket.bookingDetails.playerName.toLowerCase());
        }
        
        // Also check the bookings array
        if (currentGame.activeTickets?.bookings) {
          const booking = currentGame.activeTickets.bookings.find(
            b => b && b.number && b.number.toString() === ticket.id.toString()
          );
          if (booking && booking.playerName) {
            playerNames.add(booking.playerName.toLowerCase());
          }
        }
      });
      
      // If we have player names, find all their tickets
      if (playerNames.size > 0) {
        const allPlayerTickets = tickets.filter(ticket => {
          // Check ticket booking details
          if (ticket.bookingDetails?.playerName && 
              playerNames.has(ticket.bookingDetails.playerName.toLowerCase())) {
            return true;
          }
          
          // Check bookings array
          if (currentGame.activeTickets?.bookings) {
            const booking = currentGame.activeTickets.bookings.find(
              b => b && b.number && b.number.toString() === ticket.id.toString()
            );
            if (booking && booking.playerName && 
                playerNames.has(booking.playerName.toLowerCase())) {
              return true;
            }
          }
          
          return false;
        });
        
        // Add all related tickets to search results (maintaining uniqueness)
        setSearchResults(prevResults => {
          const existingIds = new Set(prevResults.map(ticket => ticket.id));
          const newUniqueResults = allPlayerTickets.filter(ticket => !existingIds.has(ticket.id));
          return [...prevResults, ...newUniqueResults];
        });
      } else {
        // If no player names found, just add the exact ticket matches
        setSearchResults(prevResults => {
          const existingIds = new Set(prevResults.map(ticket => ticket.id));
          const newUniqueResults = exactMatches.filter(ticket => !existingIds.has(ticket.id));
          return [...prevResults, ...newUniqueResults];
        });
      }
    } else {
      setNoResults(true);
    }
    
    setIsSearching(false);
    setShowRecent(false);
  }, [currentGame?.activeTickets?.tickets, currentGame?.activeTickets?.bookings]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setNoResults(false);
    setShowRecent(true);
    setIsSearching(false);
  };

  // Clear search results only (keep query)
  const clearSearchResults = () => {
    setSearchResults([]);
    setNoResults(false);
  };
  
  // Remove ticket from search results
  const removeTicket = (ticketId) => {
    setSearchResults(prev => prev.filter(ticket => ticket.id !== ticketId));
  };

  // Remove ticket from recent searches
  const removeFromRecent = (ticketId) => {
    setRecentSearches(prev => prev.filter(ticket => ticket.id !== ticketId));
  };

  // Save ticket to recent searches
  const handleTicketSelect = (ticket) => {
    setRecentSearches(prev => {
      // Check if ticket already exists in recent searches
      if (!prev.some(t => t.id === ticket.id)) {
        // Add to beginning of array, keeping only the last 5
        return [ticket, ...prev].slice(0, 5);
      }
      return prev;
    });
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  // Group tickets by player
  const groupTicketsByPlayer = (tickets) => {
    const groups = {};
    
    tickets.forEach(ticket => {
      let playerName = 'Unknown';
      
      // Get player name from ticket booking details
      if (ticket.bookingDetails?.playerName) {
        playerName = ticket.bookingDetails.playerName;
      } 
      // Check bookings array
      else if (currentGame.activeTickets?.bookings) {
        const booking = currentGame.activeTickets.bookings.find(
          b => b && b.number && b.number.toString() === ticket.id.toString()
        );
        if (booking && booking.playerName) {
          playerName = booking.playerName;
        }
      }
      
      if (!groups[playerName]) {
        groups[playerName] = [];
      }
      
      groups[playerName].push(ticket);
    });
    
    return groups;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Tickets</h2>
      
      {/* Search input with button */}
      <div className="relative mb-6">
        <div className="flex">
          <input
            type="text"
            placeholder="Search by ticket number or player name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     placeholder-gray-400 transition-colors text-base"
          />
          <button
            onClick={handleSearchClick}
            className="px-4 py-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600
                     transition-colors flex items-center justify-center"
          >
            <svg 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            <span className="ml-2 hidden sm:inline">Search</span>
          </button>
        </div>
        
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-20 sm:right-24 top-1/2 -translate-y-1/2
                     text-gray-400 hover:text-gray-600 focus:outline-none z-10"
            aria-label="Clear search"
          >
            <svg 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isSearching && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Searching tickets...</p>
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && !isSearching && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-700">
              Search Results ({searchResults.length})
            </h3>
            {searchResults.length > 1 && (
              <button
                onClick={clearSearchResults}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <svg 
                  className="h-4 w-4 mr-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                  />
                </svg>
                Clear all results
              </button>
            )}
          </div>
          
          {/* Group tickets by player */}
          {Object.entries(groupTicketsByPlayer(searchResults)).map(([playerName, tickets]) => (
            <div key={playerName} className="mb-6">
              <div className="border-l-4 border-blue-500 pl-3 mb-3">
                <h4 className="font-medium text-gray-800">{playerName}'s Tickets ({tickets.length})</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tickets.map(ticket => (
                  <div key={ticket.id} onClick={() => handleTicketSelect(ticket)}>
                    <TicketCard 
                      ticket={ticket} 
                      onRemove={removeTicket}
                      showRemoveButton={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {noResults && !isSearching && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No tickets found matching your search.</p>
          <p className="text-sm text-gray-500 mt-2">
            Note: Search requires exact matches for ticket number or player name.
          </p>
        </div>
      )}

      {/* Recent searches */}
      {showRecent && recentSearches.length > 0 && !isSearching && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-700">
              Recent Searches
            </h3>
            <button
              onClick={() => setRecentSearches([])}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <svg 
                className="h-4 w-4 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                />
              </svg>
              Clear history
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSearches.map(ticket => (
              <div key={ticket.id} onClick={() => handleTicketSelect(ticket)}>
                <TicketCard 
                  ticket={ticket}
                  onRemove={removeFromRecent}
                  showRemoveButton={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Search history */}
      {searchHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-700">
              Search History
            </h3>
            <button
              onClick={() => setSearchHistory([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(item.query);
                  performSearch(item.query);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {item.query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketSearch;
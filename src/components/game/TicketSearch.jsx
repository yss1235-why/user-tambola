// src/components/game/TicketSearch.jsx (Partial code with spacing updates)
import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';
import TicketCard from './TicketCard';

const TicketSearch = () => {
  // ... keep existing state and functions ...

  return (
    <div className="card shadow-sm animate-fade-in">
      <div className="px-1 py-1 sm:px-3 sm:py-3 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-1 sm:mb-3">Search Tickets</h2>
        
        {/* Search input with button */}
        <div className="relative mb-1 sm:mb-3">
          <div className="flex">
            <input
              type="text"
              placeholder="Search by ticket number or player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-2 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-l-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       placeholder-gray-400 transition-colors text-sm"
            />
            <button
              onClick={handleSearchClick}
              className="px-2 sm:px-4 py-2 sm:py-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600
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
            </button>
          </div>
          
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-16 top-1/2 -translate-y-1/2
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

        {/* View Selector Tabs */}
        <div className="flex border-b border-gray-200 -mx-1 sm:-mx-3 px-1 sm:px-3 mb-1 sm:mb-3">
          <button
            onClick={() => setActiveView('results')}
            className={`px-1 sm:px-3 py-1 sm:py-2 text-sm ${
              activeView === 'results' 
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Search Results
          </button>
          <button
            onClick={() => setActiveView('recent')}
            className={`px-1 sm:px-3 py-1 sm:py-2 text-sm ${
              activeView === 'recent' 
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={recentSearches.length === 0}
          >
            Recent Tickets
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`px-1 sm:px-3 py-1 sm:py-2 text-sm ${
              activeView === 'history' 
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={searchHistory.length === 0}
          >
            History
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {isSearching && (
        <div className="text-center py-4 sm:py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Searching tickets...</p>
        </div>
      )}

      {/* Content based on active view */}
      {activeView === 'results' && !isSearching && (
        <>
          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="p-1 sm:p-3">
              <div className="flex justify-between items-center mb-1 sm:mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Results ({searchResults.length})
                </h3>
                {searchResults.length > 1 && (
                  <button
                    onClick={clearSearchResults}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
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
                    Clear results
                  </button>
                )}
              </div>
              
              {/* Group tickets by player */}
              {Object.entries(groupTicketsByPlayer(searchResults)).map(([playerName, tickets]) => (
                <div key={playerName} className="mb-2 sm:mb-4">
                  <div className="border-l-4 border-blue-500 pl-1 sm:pl-3 mb-1 sm:mb-2">
                    <h4 className="text-sm font-medium text-gray-800">{playerName}'s Tickets ({tickets.length})</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-3">
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
            <div className="text-center py-3 sm:py-6 px-2 sm:px-4 bg-gray-50">
              <p className="text-sm text-gray-600">No tickets found matching your search.</p>
              <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                Search requires exact matches for ticket number or player name.
              </p>
            </div>
          )}

          {/* Empty state for results view */}
          {!noResults && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-3 sm:py-6 px-2 sm:px-4">
              <p className="text-sm text-gray-600">Enter a ticket number or player name to search</p>
            </div>
          )}
        </>
      )}

      {/* Recent searches view */}
      {activeView === 'recent' && (
        <div className="p-1 sm:p-3">
          {recentSearches.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-1 sm:mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Recent Tickets
                </h3>
                <button
                  onClick={() => setRecentSearches([])}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-3">
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
            </>
          ) : (
            <div className="text-center py-3 sm:py-6">
              <p className="text-sm text-gray-600">No recent tickets</p>
            </div>
          )}
        </div>
      )}
      
      {/* Search history view */}
      {activeView === 'history' && (
        <div className="p-1 sm:p-3">
          {searchHistory.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-1 sm:mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Search History
                </h3>
                <button
                  onClick={() => setSearchHistory([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(item.query);
                      performSearch(item.query);
                    }}
                    className="px-2 sm:px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-3 sm:py-6">
              <p className="text-sm text-gray-600">No search history</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketSearch;

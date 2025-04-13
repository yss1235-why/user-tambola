// src/pages/GamePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { db } from '../config/firebase';
import { ref, get } from 'firebase/database';
import NumberBoard from '../components/game/NumberBoard';
import NumberDisplay from '../components/game/NumberDisplay';
import WinnersDisplay from '../components/game/WinnersDisplay';
import TicketCard from '../components/game/TicketCard';
import TicketSearch from '../components/game/TicketSearch';
import WinnersNotification from '../components/game/WinnersNotification';

const HOST_ID = 'Xa94GGCM9LOJF59EFA8jJLyjW2v2';

const CountdownTimer = () => {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prevSeconds => {
        if (prevSeconds <= 1) return 60;
        return prevSeconds - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-6 bg-blue-50 rounded-lg p-6 text-center">
      <h2 className="text-xl font-semibold text-blue-800 mb-2">Game Starting Soon</h2>
      <div className="text-4xl font-bold text-blue-600">
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
      </div>
      <p className="mt-2 text-blue-600">Please wait while the host prepares the game</p>
    </div>
  );
};

const ContactHostButton = ({ hostPhone }) => {
  const handleContactHost = useCallback(() => {
    const message = "Hello, I'm interested in joining the next Tambola game.";
    
    // Format phone number (remove any non-digit characters)
    const formattedPhone = hostPhone ? hostPhone.replace(/\D/g, '') : '';
    
    if (formattedPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      // Fallback to generic WhatsApp without specific number
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  }, [hostPhone]);

  return (
    <button
      onClick={handleContactHost}
      className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-colors flex items-center justify-center"
    >
      <svg 
        className="w-5 h-5 mr-2" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm0 22c-5.301 0-9.6-4.298-9.6-9.6 0-5.302 4.299-9.6 9.6-9.6s9.6 4.298 9.6 9.6c0 5.302-4.299 9.6-9.6 9.6z"/>
      </svg>
      Contact Host via WhatsApp
    </button>
  );
};

const GamePage = () => {
    const {
        currentGame,
        phase,
        loading,
        error,
        calledNumbers,
        lastCalledNumber,
        winners,
        tickets
    } = useGame();

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [gameEnded, setGameEnded] = useState(false);
    const [previousGameData, setPreviousGameData] = useState(null);
    const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

    // Fetch previous game data from gameHistory
    useEffect(() => {
        const fetchPreviousGameData = async () => {
            if ((phase === 1 || gameEnded) && !previousGameData && !isLoadingPrevious) {
                setIsLoadingPrevious(true);
                try {
                    // Get the gameHistory reference
                    const gameHistoryRef = ref(db, `hosts/${HOST_ID}/gameHistory`);
                    const snapshot = await get(gameHistoryRef);
                    
                    if (snapshot.exists()) {
                        const gameHistory = snapshot.val();
                        
                        // Find the most recent game ID (assuming the keys are sortable by recency)
                        const gameIds = Object.keys(gameHistory).sort().reverse();
                        
                        if (gameIds.length > 0) {
                            const mostRecentGameId = gameIds[0];
                            const gameData = gameHistory[mostRecentGameId];
                            
                            if (gameData?.gameState?.winners) {
                                // Get player data to map names to tickets
                                const playerData = gameData.player || {};
                                const playerMap = {};
                                
                                // Create a map of ticket IDs to player names
                                for (const playerId in playerData) {
                                    const player = playerData[playerId];
                                    if (player.tickets && player.name) {
                                        for (const ticketId in player.tickets) {
                                            playerMap[ticketId] = player.name;
                                        }
                                    }
                                }
                                
                                // Add player map to the game data
                                gameData.playerMap = playerMap;
                                setPreviousGameData(gameData);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching previous game data:", error);
                } finally {
                    setIsLoadingPrevious(false);
                }
            }
        };
        
        fetchPreviousGameData();
    }, [phase, gameEnded, previousGameData, isLoadingPrevious]);

    // Check if game has ended
    useEffect(() => {
        if (currentGame?.gameState?.status === 'ended') {
            setGameEnded(true);
        } else {
            setGameEnded(false);
        }
    }, [currentGame?.gameState?.status]);

    // Apply simple filtering if search term is provided
    useEffect(() => {
        if (!tickets || !Array.isArray(tickets)) {
            setFilteredTickets([]);
            return;
        }

        if (!searchTerm.trim()) {
            // During booking phase, show all tickets
            // During playing phase, show no tickets unless searched
            setFilteredTickets(phase === 2 ? tickets.filter(Boolean) : []);
            return;
        }

        const term = searchTerm.toLowerCase().trim();
        const filtered = tickets.filter(ticket => {
            if (!ticket) return false;
            
            // Filter by ticket ID
            if (ticket.id && ticket.id.toString().includes(term)) return true;
            
            // Filter by player name
            if (ticket.bookingDetails?.playerName && 
                ticket.bookingDetails.playerName.toLowerCase().includes(term)) {
                return true;
            }
            
            return false;
        });
        
        setFilteredTickets(filtered);
    }, [tickets, searchTerm, phase]);

    // Get host phone number
    const getHostPhone = () => {
        if (currentGame?.settings?.hostPhone) {
            return currentGame.settings.hostPhone;
        }
        
        // Default host phone if available in our constants
        return "1234567890"; // Replace with actual default if available
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-4 text-gray-600">Loading game data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-4">Connection Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    // Game has ended or no active game
    if (!currentGame || gameEnded) {
        return (
            <div className="min-h-screen bg-gray-50 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Tambola Game</h1>
                        <p className="mt-2 text-gray-600">
                            {gameEnded ? "Game has ended" : "Waiting for the next game to start"}
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Previous Winners Display */}
                        {isLoadingPrevious ? (
                            <div className="bg-white rounded-lg shadow-md p-6 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading previous winners...</p>
                            </div>
                        ) : (
                            <WinnersDisplay 
                                previousGameData={previousGameData} 
                                currentGame={gameEnded ? currentGame : null}
                                showPrevious={true} 
                            />
                        )}
                        
                        {/* Contact Host Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Want to join the next game?
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Contact the host to get information about upcoming games and how to participate.
                            </p>
                            <ContactHostButton hostPhone={getHostPhone()} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Game Header */}
                <header className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Tambola Game</h1>
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800">
                        <span className="text-sm font-medium">
                            {phase === 1 && "Game Setup in Progress"}
                            {phase === 2 && "Ticket Booking Open"}
                            {phase === 3 && "Game in Progress"}
                        </span>
                    </div>
                </header>

                {/* Game Content */}
                <div className="space-y-6">
                    {/* Phase 1: Setup Phase - Countdown Timer */}
                    {phase === 1 && (
                        <>
                            <CountdownTimer />
                            
                            {/* Previous Winners from last game */}
                            {isLoadingPrevious ? (
                                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Loading previous winners...</p>
                                </div>
                            ) : (
                                <WinnersDisplay previousGameData={previousGameData} showPrevious={true} />
                            )}
                        </>
                    )}

                    {/* Phase 3: Playing Phase Content */}
                    {phase === 3 && (
                        <>
                            {/* Number Display Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                {/* Current Number Display */}
                                <div className="lg:col-span-1">
                                    <NumberDisplay />
                                </div>
                                
                                {/* Number Board */}
                                <div className="lg:col-span-2">
                                    <NumberBoard />
                                </div>
                            </div>
                            
                            {/* Winners Display */}
                            <div className="mb-6">
                                <WinnersDisplay />
                            </div>
                            
                            {/* Ticket Search - Using the comprehensive TicketSearch component */}
                            <div className="mb-6">
                                <TicketSearch />
                            </div>

                            {/* Winners Notification Overlay */}
                            <WinnersNotification />
                        </>
                    )}

                    {/* Tickets Section - Only for Booking Phase (Phase 2) */}
                    {phase === 2 && (
                        <div id="tickets-section" className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Available Tickets ({filteredTickets.length})
                                </h2>
                                
                                {/* Quick filter input */}
                                <div className="relative w-full sm:w-72">
                                    <input
                                        type="text"
                                        placeholder="Quick filter by ID or name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg
                                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                            placeholder-gray-400 transition-colors"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2
                                                text-gray-400 hover:text-gray-600"
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
                            </div>
                            
                            {/* Tickets Grid for Booking Phase */}
                            {filteredTickets.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredTickets.map((ticket) => (
                                        <TicketCard key={ticket.id} ticket={ticket} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <p className="text-gray-600">
                                        {searchTerm ? "No tickets match your filter criteria." : "No tickets available at the moment."}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GamePage;
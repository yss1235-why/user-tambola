// src/context/GameContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, HOST_ID, databaseUtils } from '../config/firebase';
import { useAuth } from './AuthContext';
import appConfig from '../config/appConfig';
import { normalizeGameData, normalizeTickets, normalizeCalledNumbers } from '../utils/firebaseAdapter';

const GameContext = createContext();

// Use the centralized path format with HOST_ID from firebase.js
const BASE_PATH = `hosts/${HOST_ID}/currentGame`;

export const GameProvider = ({ children, onError }) => {
  const { currentUser, loading: authLoading, error: authError } = useAuth();
  const [gameState, setGameState] = useState({
    loading: true,
    error: null,
    currentGame: null,
    phase: 1,
    calledNumbers: [],
    lastCalledNumber: null,
    tickets: [],
    bookings: {},
    players: {}
  });
  
  // Use refs to track mounted state and prevent cleanup on re-renders
  const isMounted = useRef(true);
  const listenersActive = useRef(false);
  const timeoutId = useRef(null);
  const unsubscribers = useRef({
    game: null,
    bookings: null,
    tickets: null,
    players: null
  });
  const dataReceived = useRef({
    game: false,
    tickets: false,
    bookings: false,
    players: false
  });

  // Add refs to track game ID and phase for detecting changes
  const currentGameIdRef = useRef(null);
  const currentPhaseRef = useRef(null);
  const previousCalledNumbersRef = useRef([]);

  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Clear any pending timeout
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  // Check if all essential data has been received
  const checkDataReceived = () => {
    // If we've received both game and tickets data, mark loading as complete
    if (dataReceived.current.game && dataReceived.current.tickets) {
      console.log("All essential data received, loading complete");
      setGameState(prev => ({
        ...prev,
        loading: false
      }));
      
      // Clear any timeout
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
    }
  };

  // Debug function to show ticket count
  const logTicketCount = (tickets) => {
    if (Array.isArray(tickets)) {
      console.log(`Loaded ${tickets.length} tickets`);
      
      // Count available vs booked
      const available = tickets.filter(t => t && t.status !== 'booked').length;
      const booked = tickets.filter(t => t && t.status === 'booked').length;
      
      console.log(`Available: ${available}, Booked: ${booked}`);
    } else {
      console.log('No tickets or invalid tickets data');
    }
  };

  // Set up Firebase listeners
  useEffect(() => {
    // Skip if listeners are already active
    if (listenersActive.current) return;
    
    console.log('Setting up Firebase listeners with Host ID:', HOST_ID);
    listenersActive.current = true;
    
    // Set timeout for data loading
    timeoutId.current = setTimeout(() => {
      if (isMounted.current && gameState.loading) {
        console.log("Game data loading timed out");
        setGameState(prev => ({
          ...prev,
          loading: false,
          error: "Loading timed out. Please try refreshing the page."
        }));
      }
    }, 15000); // 15 seconds timeout
    
    // Set up async function to handle listeners
    const setupListeners = async () => {
      try {
        console.log("Setting up game data listener");
        
        // Game data listener
        unsubscribers.current.game = await databaseUtils.listenToPath(BASE_PATH, 
          (snapshot) => {
            if (!isMounted.current) return;
            
            const rawGameData = snapshot.val();
            console.log("Game data received:", rawGameData ? "Yes" : "No");
            
            if (rawGameData) {
              // Normalize the game data
              const gameData = normalizeGameData(rawGameData);
              dataReceived.current.game = true;
              
              // Check for game ID or phase changes
              const newGameId = gameData.id || rawGameData.id || Date.now().toString();
              const newPhase = gameData.gameState?.phase || 1;
              const calledNumbers = gameData.numberSystem?.calledNumbers || [];
              
              // Detect game change or phase change
              const gameChanged = currentGameIdRef.current !== null && 
                                 currentGameIdRef.current !== newGameId;
              const phaseChanged = currentPhaseRef.current !== null && 
                                  currentPhaseRef.current !== newPhase;
              
              // Detect new game by checking if called numbers reset
              const previousLength = previousCalledNumbersRef.current.length;
              const currentLength = calledNumbers.length;
              const calledNumbersReset = previousLength > 0 && currentLength === 0;
              
              // Determine if this is a new game
              const isNewGame = gameChanged || calledNumbersReset || 
                              (phaseChanged && newPhase === 2 && 
                               currentPhaseRef.current !== undefined);
              
              // Store current called numbers for next comparison
              previousCalledNumbersRef.current = [...calledNumbers];
              
              // If game or phase changed, clear ticket data
              if (gameChanged || phaseChanged) {
                console.log(`Game ${gameChanged ? 'ID' : 'phase'} changed. Resetting ticket data.`);
                
                // If transitioning to booking phase (phase 2), mark as new game
                if (phaseChanged && newPhase === 2) {
                  console.log('Transitioning to booking phase, clearing booking status');
                  
                  // Clear booking phase timestamp to force recalculation
                  localStorage.removeItem('bookingPhaseStartTime');
                }
                
                // Make game state available to utilities
                try {
                  window.__GAME_STATE = {
                    gameId: newGameId,
                    phase: newPhase,
                    calledNumbers: calledNumbers,
                    changed: Date.now(),
                    isNewGame: isNewGame
                  };
                } catch (e) {
                  // Ignore any errors
                }
                
                // Reset ticket data
                setGameState(prev => ({
                  ...prev,
                  tickets: [],
                  bookings: {}
                }));
                
                // Set flags to wait for new data
                dataReceived.current.tickets = false;
                dataReceived.current.bookings = false;
              } else {
                // Update game state reference even if no phase change
                try {
                  window.__GAME_STATE = {
                    gameId: newGameId,
                    phase: newPhase,
                    calledNumbers: calledNumbers,
                    changed: Date.now(),
                    isNewGame: false
                  };
                } catch (e) {
                  // Ignore any errors
                }
              }
              
              // Update refs with current values
              currentGameIdRef.current = newGameId;
              currentPhaseRef.current = newPhase;
              
              setGameState(prev => ({
                ...prev,
                error: null,
                currentGame: gameData,
                phase: newPhase,
                calledNumbers: normalizeCalledNumbers(calledNumbers),
                lastCalledNumber: gameData.numberSystem?.currentNumber,
              }));
              
              // Check if we can complete loading
              checkDataReceived();
            } else {
              if (isMounted.current) {
                dataReceived.current.game = true;
                setGameState(prev => ({
                  ...prev,
                  loading: false,
                  error: 'No game data available',
                }));
              }
            }
          },
          (error) => {
            console.error('Error fetching game data:', error);
            if (isMounted.current) {
              dataReceived.current.game = true;
              setGameState(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to connect to game server: ' + error.message,
              }));
              if (onError) onError('Failed to connect to game server: ' + error.message);
            }
          }
        );
        
        // Bookings listener
        unsubscribers.current.bookings = await databaseUtils.listenToPath(`${BASE_PATH}/activeTickets/bookings`, 
          (snapshot) => {
            if (!isMounted.current) return;
            
            const bookingsData = snapshot.val();
            console.log("Bookings data received:", bookingsData ? "Yes" : "No");
            
            // Provide an empty array if bookings is null
            const normalizedBookings = bookingsData || [];
            dataReceived.current.bookings = true;
            
            setGameState(prev => ({
              ...prev,
              bookings: normalizedBookings
            }));
          },
          (error) => {
            console.error('Error fetching bookings:', error);
            // Provide empty bookings array on error
            if (isMounted.current) {
              dataReceived.current.bookings = true;
              setGameState(prev => ({
                ...prev,
                bookings: []
              }));
            }
          }
        );
        
        // Tickets listener
        console.log("Setting up tickets listener at:", `${BASE_PATH}/activeTickets/tickets`);
        unsubscribers.current.tickets = await databaseUtils.listenToPath(`${BASE_PATH}/activeTickets/tickets`, 
          (snapshot) => {
            if (!isMounted.current) return;
            
            const rawTicketsData = snapshot.val();
            console.log("Tickets data received:", rawTicketsData ? "Yes" : "No");
            
            // Prepare current game state for normalization
            const currentGameState = {
              gameId: currentGameIdRef.current,
              phase: currentPhaseRef.current,
              calledNumbers: previousCalledNumbersRef.current
            };
            
            // Normalize tickets with current game state
            const normalizedTickets = normalizeTickets(rawTicketsData, currentGameState);
            logTicketCount(normalizedTickets);
            dataReceived.current.tickets = true;
            
            // Update state with normalized tickets
            setGameState(prev => ({
              ...prev,
              tickets: normalizedTickets,
            }));
            
            // Check if we can complete loading
            checkDataReceived();
          },
          (error) => {
            console.error('Error fetching tickets:', error);
            // Provide empty tickets array on error
            if (isMounted.current) {
              dataReceived.current.tickets = true;
              setGameState(prev => ({
                ...prev,
                tickets: []
              }));
              
              // Check if we can complete loading
              checkDataReceived();
            }
          }
        );
        
        // Players listener
        console.log("Setting up players listener at:", `${BASE_PATH}/players`);
        unsubscribers.current.players = await databaseUtils.listenToPath(`${BASE_PATH}/players`, 
          (snapshot) => {
            if (!isMounted.current) return;
            
            const playersData = snapshot.val();
            console.log("Players data received:", playersData ? "Yes" : "No");
            
            if (playersData) {
              dataReceived.current.players = true;
              
              setGameState(prev => ({
                ...prev,
                players: playersData
              }));
            }
          },
          (error) => {
            console.error('Error fetching players:', error);
            if (isMounted.current) {
              dataReceived.current.players = true;
              setGameState(prev => ({
                ...prev,
                players: {}
              }));
            }
          }
        );
        
        console.log("All Firebase listeners set up successfully");
      } catch (error) {
        console.error("Error setting up game listeners:", error);
        if (isMounted.current) {
          setGameState(prev => ({
            ...prev,
            loading: false,
            error: 'Error initializing game data: ' + error.message,
          }));
          if (onError) onError('Error initializing game data: ' + error.message);
        }
      }
    };
    
    // Set up listeners
    setupListeners();
    
    // Clean up function to properly remove listeners on unmount
    return () => {
      console.log("Cleaning up Firebase listeners");
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      if (unsubscribers.current.game) unsubscribers.current.game();
      if (unsubscribers.current.bookings) unsubscribers.current.bookings();
      if (unsubscribers.current.tickets) unsubscribers.current.tickets();
      if (unsubscribers.current.players) unsubscribers.current.players();
      listenersActive.current = false;
    };
  }, []); // Empty dependency array to ensure this runs only once

  const value = {
    ...gameState,
    // Provide activeTickets for backward compatibility
    activeTickets: gameState.tickets,
    isNumberCalled: (number) => gameState.calledNumbers.includes(number),
    isGameActive: !!gameState.currentGame,
    isBookingPhase: gameState.phase === appConfig.gameConstants.phases.BOOKING,
    isPlayingPhase: gameState.phase === appConfig.gameConstants.phases.PLAYING,
    // Make phase constants available in the context
    phases: appConfig.gameConstants.phases,
    // Provide text configuration for components
    appText: appConfig.appText,
    // Utility function to get player name by ticket ID
    getPlayerNameByTicket: (ticketId) => {
      // First check in players
      const players = gameState.players;
      for (const playerId in players) {
        const playerTickets = players[playerId].tickets || [];
        if (playerTickets.includes(ticketId.toString())) {
          return players[playerId].name;
        }
      }
      
      // Then check in bookings
      if (gameState.bookings && Array.isArray(gameState.bookings)) {
        const booking = gameState.bookings.find(
          b => b && b.number && b.number.toString() === ticketId.toString()
        );
        if (booking && booking.playerName) {
          return booking.playerName;
        }
      }
      
      return null;
    }
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameContext;

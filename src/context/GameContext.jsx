// src/context/GameContext.jsx - Improved ticket loading
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
  });
  
  // Use refs to track mounted state and prevent cleanup on re-renders
  const isMounted = useRef(true);
  const listenersActive = useRef(false);
  const unsubscribers = useRef({
    game: null,
    bookings: null,
    tickets: null
  });

  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

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
              
              setGameState(prev => ({
                ...prev,
                loading: false,
                error: null,
                currentGame: gameData,
                phase: gameData.gameState?.phase || 1,
                calledNumbers: normalizeCalledNumbers(gameData.numberSystem?.calledNumbers),
                lastCalledNumber: gameData.numberSystem?.currentNumber,
              }));
            } else {
              if (isMounted.current) {
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
            
            setGameState(prev => ({
              ...prev,
              bookings: normalizedBookings
            }));
          },
          (error) => {
            console.error('Error fetching bookings:', error);
            // Provide empty bookings array on error
            if (isMounted.current) {
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
            
            // Normalize tickets (remove nulls, ensure proper format)
            const normalizedTickets = normalizeTickets(rawTicketsData);
            logTicketCount(normalizedTickets);
            
            setGameState(prev => ({
              ...prev,
              tickets: normalizedTickets,
            }));
          },
          (error) => {
            console.error('Error fetching tickets:', error);
            // Provide empty tickets array on error
            if (isMounted.current) {
              setGameState(prev => ({
                ...prev,
                tickets: []
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
      if (unsubscribers.current.game) unsubscribers.current.game();
      if (unsubscribers.current.bookings) unsubscribers.current.bookings();
      if (unsubscribers.current.tickets) unsubscribers.current.tickets();
      listenersActive.current = false;
    };
  }, []); // Empty dependency array to ensure this runs only once

  // Set timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (gameState.loading && isMounted.current) {
        console.log("Game data loading timed out");
        setGameState(prev => ({
          ...prev,
          loading: false,
          error: "Loading timed out. Please try refreshing the page."
        }));
      }
    }, 20000); // 20 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, []);

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
    appText: appConfig.appText
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

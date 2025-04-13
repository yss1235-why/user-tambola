// src/context/GameContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, HOST_ID } from '../config/firebase';
import appConfig from '../config/appConfig';
import { ref, onValue, off } from 'firebase/database';
import { normalizeGameData, normalizeTickets, normalizeCalledNumbers } from '../utils/firebaseAdapter';

const GameContext = createContext();

// Use the centralized path format with HOST_ID from firebase.js
const BASE_PATH = `hosts/${HOST_ID}/currentGame`;

export const GameProvider = ({ children }) => {
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

  useEffect(() => {
    // Log the HOST_ID to verify environment variables are loaded
    console.log('Using Host ID:', HOST_ID);
    
    // References to game data, bookings, and tickets
    const gameRef = ref(db, BASE_PATH);
    const bookingsRef = ref(db, `${BASE_PATH}/activeTickets/bookings`);
    const ticketsRef = ref(db, `${BASE_PATH}/activeTickets/tickets`);

    const handleGameUpdate = (snapshot) => {
      const rawGameData = snapshot.val();
      console.log('Raw Game Data:', rawGameData);

      if (rawGameData) {
        // Normalize the game data to ensure all expected fields exist
        const gameData = normalizeGameData(rawGameData);
        console.log('Normalized Game Data:', gameData);

        setGameState(prev => ({
          ...prev,
          loading: false,
          currentGame: gameData,
          phase: gameData.gameState?.phase || 1,
          calledNumbers: normalizeCalledNumbers(gameData.numberSystem?.calledNumbers),
          lastCalledNumber: gameData.numberSystem?.currentNumber,
        }));
      } else {
        setGameState(prev => ({
          ...prev,
          loading: false,
          error: 'No game data available',
        }));
      }
    };

    const handleBookingsUpdate = (snapshot) => {
      const bookingsData = snapshot.val();
      console.log('Bookings Data:', bookingsData);

      // Provide an empty array if bookings is null
      const normalizedBookings = bookingsData || [];

      setGameState(prev => ({
        ...prev,
        bookings: normalizedBookings
      }));
    };

    const handleTicketsUpdate = (snapshot) => {
      const rawTicketsData = snapshot.val();
      console.log('Raw Tickets Data:', rawTicketsData);

      // Normalize tickets (remove nulls, ensure proper format)
      const normalizedTickets = normalizeTickets(rawTicketsData);
      console.log('Normalized Tickets:', normalizedTickets);
      
      setGameState(prev => ({
        ...prev,
        tickets: normalizedTickets,
      }));
    };

    // Set up listeners
    onValue(gameRef, handleGameUpdate, (error) => {
      console.error('Error fetching game data:', error);
      setGameState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to connect to game server',
      }));
    });

    onValue(bookingsRef, handleBookingsUpdate, (error) => {
      console.error('Error fetching bookings:', error);
      // Still provide empty bookings array on error
      setGameState(prev => ({
        ...prev,
        bookings: []
      }));
    });

    onValue(ticketsRef, handleTicketsUpdate, (error) => {
      console.error('Error fetching tickets:', error);
      // Still provide empty tickets array on error
      setGameState(prev => ({
        ...prev,
        tickets: []
      }));
    });

    // Clean up listeners
    return () => {
      off(gameRef);
      off(bookingsRef);
      off(ticketsRef);
    };
  }, []);

  // Add test tickets if needed (for development/testing only)
  useEffect(() => {
    // Check if we should add test tickets in development mode
    const shouldAddTestTickets = import.meta.env.DEV && 
                                import.meta.env.VITE_ADD_TEST_TICKETS === 'true';
    
    if (shouldAddTestTickets && gameState.tickets.length === 0 && !gameState.loading) {
      console.log('Adding test tickets for development');
      const testTickets = Array(10).fill().map((_, i) => ({
        id: `test-${i+1}`,
        numbers: [
          [0, 12, 0, 33, 0, 54, 0, 76, 0],
          [5, 0, 27, 0, 43, 0, 67, 0, 89],
          [0, 17, 0, 38, 0, 59, 0, 0, 90]
        ],
        bookingDetails: i < 3 ? {
          playerName: `Test Player ${i+1}`,
          timestamp: Date.now()
        } : null
      }));
      
      setGameState(prev => ({
        ...prev,
        tickets: testTickets,
      }));
    }
  }, [gameState.tickets, gameState.loading]);

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

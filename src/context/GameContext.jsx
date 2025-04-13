// src/context/GameContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, HOST_ID } from '../config/firebase';
import appConfig from '../config/appConfig';
import { ref, onValue, off } from 'firebase/database';

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
    // References to game data, bookings, and tickets
    const gameRef = ref(db, BASE_PATH);
    const bookingsRef = ref(db, `${BASE_PATH}/activeTickets/bookings`);
    const ticketsRef = ref(db, `${BASE_PATH}/activeTickets/tickets`);

    const handleGameUpdate = (snapshot) => {
      const gameData = snapshot.val();
      console.log('Game Data:', gameData);

      if (gameData) {
        setGameState(prev => ({
          ...prev,
          loading: false,
          currentGame: gameData,
          phase: gameData.gameState?.phase || 1,
          calledNumbers: gameData.numberSystem?.calledNumbers || [],
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

      setGameState(prev => ({
        ...prev,
        bookings: bookingsData || {}
      }));
    };

    const handleTicketsUpdate = (snapshot) => {
      const ticketsData = snapshot.val();
      console.log('Tickets Data:', ticketsData);

      if (Array.isArray(ticketsData)) {
        // Ensure we have valid tickets with proper structure
        const validTickets = ticketsData.filter(ticket => 
          ticket && ticket.id && Array.isArray(ticket.numbers)
        );
        
        console.log(`Found ${validTickets.length} valid tickets`);
        
        setGameState(prev => ({
          ...prev,
          tickets: validTickets,
        }));
      } else {
        console.error('Tickets data is not an array:', ticketsData);
        setGameState(prev => ({
          ...prev,
          tickets: [],
        }));
      }
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
    });

    onValue(ticketsRef, handleTicketsUpdate, (error) => {
      console.error('Error fetching tickets:', error);
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
    if (gameState.tickets.length === 0 && !gameState.loading) {
      console.log('Adding test tickets');
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
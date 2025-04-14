// src/context/GameContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, HOST_ID, databaseUtils } from '../config/firebase';
import { useAuth } from './AuthContext';
import appConfig from '../config/appConfig';
import { ref, onValue, off } from 'firebase/database';
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

  // Set up Firebase listeners once authenticated
  useEffect(() => {
    // Don't proceed if still loading auth or if there's an auth error
    if (authLoading || authError) {
      return;
    }
    
    console.log('Using Host ID:', HOST_ID);
    
    // Set up async function to handle listeners
    const setupListeners = async () => {
      try {
        // Initialize listeners with the databaseUtils that handle authentication
        const gameUnsubscribe = await databaseUtils.listenToPath(BASE_PATH, 
          (snapshot) => {
            const rawGameData = snapshot.val();
            console.log('Raw Game Data:', rawGameData);

            if (rawGameData) {
              // Normalize the game data
              const gameData = normalizeGameData(rawGameData);
              console.log('Normalized Game Data:', gameData);

              setGameState(prev => ({
                ...prev,
                loading: false,
                error: null, // Clear any previous errors
                currentGame: gameData,
                phase: gameData.gameState?.phase || 1,
                calledNumbers: normalizeCalledNumbers(gameData.numberSystem?.calledNumbers),
                lastCalledNumber: gameData.numberSystem?.currentNumber,
              }));
            } else {
              const errorMsg = 'No game data available. The host may not have an active game.';
              console.error(errorMsg);
              setGameState(prev => ({
                ...prev,
                loading: false,
                error: errorMsg,
              }));
              if (onError) onError(errorMsg);
            }
          },
          (error) => {
            console.error('Error fetching game data:', error);
            setGameState(prev => ({
              ...prev,
              loading: false,
              error: 'Failed to connect to game server: ' + error.message,
            }));
            if (onError) onError('Failed to connect to game server: ' + error.message);
          }
        );

        const bookingsUnsubscribe = await databaseUtils.listenToPath(`${BASE_PATH}/activeTickets/bookings`, 
          (snapshot) => {
            const bookingsData = snapshot.val();
            console.log('Bookings Data:', bookingsData);
            
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
            setGameState(prev => ({
              ...prev,
              bookings: []
            }));
          }
        );

        const ticketsUnsubscribe = await databaseUtils.listenToPath(`${BASE_PATH}/activeTickets/tickets`, 
          (snapshot) => {
            const rawTicketsData = snapshot.val();
            console.log('Raw Tickets Data:', rawTicketsData);

            // Normalize tickets (remove nulls, ensure proper format)
            const normalizedTickets = normalizeTickets(rawTicketsData);
            console.log('Normalized Tickets:', normalizedTickets);
            
            setGameState(prev => ({
              ...prev,
              tickets: normalizedTickets,
            }));
          },
          (error) => {
            console.error('Error fetching tickets:', error);
            // Provide empty tickets array on error
            setGameState(prev => ({
              ...prev,
              tickets: []
            }));
          }
        );

        // Return cleanup function
        return () => {
          gameUnsubscribe && gameUnsubscribe();
          bookingsUnsubscribe && bookingsUnsubscribe();
          ticketsUnsubscribe && ticketsUnsubscribe();
        };
      } catch (error) {
        console.error("Error setting up game listeners:", error);
        const errorMsg = 'Error initializing game data: ' + error.message;
        setGameState(prev => ({
          ...prev,
          loading: false,
          error: errorMsg,
        }));
        if (onError) onError(errorMsg);
        
        // Return empty cleanup function
        return () => {};
      }
    };

    // Set up listeners
    const cleanupListeners = setupListeners();
    
    // Clean up function
    return () => {
      // Execute the cleanup function returned by setupListeners
      cleanupListeners.then(cleanup => cleanup && cleanup());
    };
  }, [currentUser, authLoading, authError, onError]);

  // Show authentication-related loading/error states
  if (authLoading) {
    return <div>Authenticating...</div>;
  }

  if (authError) {
    return <div>Authentication Error: {authError}</div>;
  }

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

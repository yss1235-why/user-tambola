// src/context/GameContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [listenersInitialized, setListenersInitialized] = useState(false);

  // Set up Firebase listeners once per mount
  useEffect(() => {
    if (listenersInitialized) return;
    
    // Don't wait for auth to be completed - proceed anyway
    console.log('Setting up Firebase listeners with Host ID:', HOST_ID);
    
    // Cleanup function for all listeners
    let gameUnsubscribe = null;
    let bookingsUnsubscribe = null;
    let ticketsUnsubscribe = null;
    
    // Set up async function to handle listeners
    const setupListeners = async () => {
      try {
        console.log("Setting up game data listener");
        
        // Game data listener
        gameUnsubscribe = await databaseUtils.listenToPath(BASE_PATH, 
          (snapshot) => {
            const rawGameData = snapshot.val();
            
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
              setGameState(prev => ({
                ...prev,
                loading: false,
                error: 'No game data available',
              }));
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
        
        // Bookings listener
        bookingsUnsubscribe = await databaseUtils.listenToPath(`${BASE_PATH}/activeTickets/bookings`, 
          (snapshot) => {
            const bookingsData = snapshot.val();
            
            // Provide an empty array if bookings is null
            const normalizedBookings = bookingsData || [];
            
            setGameState(prev => ({
              ...prev,
              bookings: normalizedBookings
            }));
          },
          (error) => {
            console.error('Error fetching bookings:', error);
            // Provide empty bookings array on error, but don't set main error
            setGameState(prev => ({
              ...prev,
              bookings: []
            }));
          }
        );
        
        // Tickets listener
        ticketsUnsubscribe = await databaseUtils.listenToPath(`${BASE_PATH}/activeTickets/tickets`, 
          (snapshot) => {
            const rawTicketsData = snapshot.val();
            
            // Normalize tickets (remove nulls, ensure proper format)
            const normalizedTickets = normalizeTickets(rawTicketsData);
            
            setGameState(prev => ({
              ...prev,
              tickets: normalizedTickets,
            }));
          },
          (error) => {
            console.error('Error fetching tickets:', error);
            // Provide empty tickets array on error, but don't set main error
            setGameState(prev => ({
              ...prev,
              tickets: []
            }));
          }
        );
        
        setListenersInitialized(true);
        console.log("All Firebase listeners set up successfully");
      } catch (error) {
        console.error("Error setting up game listeners:", error);
        setGameState(prev => ({
          ...prev,
          loading: false,
          error: 'Error initializing game data: ' + error.message,
        }));
        if (onError) onError('Error initializing game data: ' + error.message);
      }
    };
    
    // Set up listeners
    setupListeners();
    
    // Clean up all listeners on unmount
    return () => {
      console.log("Cleaning up Firebase listeners");
      if (gameUnsubscribe) gameUnsubscribe();
      if (bookingsUnsubscribe) bookingsUnsubscribe();
      if (ticketsUnsubscribe) ticketsUnsubscribe();
    };
  }, [onError, listenersInitialized]);

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

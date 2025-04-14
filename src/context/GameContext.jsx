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

export const GameProvider = ({ children }) => {
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
    demoMode: false
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
        // Check if we should use demo data (when Firebase connection fails)
        const useDemoData = !currentUser || import.meta.env.VITE_USE_DEMO_DATA === 'true';
        
        if (useDemoData && appConfig.firebase.demoMode?.enabled) {
          console.log('Using demo data for development/testing');
          setGameState(prev => ({
            ...prev,
            loading: false,
            demoMode: true,
            currentGame: getMockGameData(),
            phase: 3, // Playing phase
            calledNumbers: [1, 5, 10, 15, 23, 27, 38, 42, 56, 61, 75, 80, 89],
            lastCalledNumber: 89,
            tickets: generateMockTickets(),
          }));
          return () => {}; // Return empty cleanup function
        }

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
                currentGame: gameData,
                phase: gameData.gameState?.phase || 1,
                calledNumbers: normalizeCalledNumbers(gameData.numberSystem?.calledNumbers),
                lastCalledNumber: gameData.numberSystem?.currentNumber,
              }));
            } else {
              // If we don't have game data and demo mode is enabled, use mock data
              if (appConfig.firebase.demoMode?.enabled) {
                console.log('No game data available, using demo data');
                setGameState(prev => ({
                  ...prev,
                  loading: false,
                  demoMode: true,
                  currentGame: getMockGameData(),
                  phase: 3, // Playing phase
                  calledNumbers: [1, 5, 10, 15, 23, 27, 38, 42, 56, 61, 75, 80, 89],
                  lastCalledNumber: 89,
                  tickets: generateMockTickets(),
                }));
              } else {
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
            
            // If we have an error and demo mode is enabled, use mock data
            if (appConfig.firebase.demoMode?.enabled) {
              console.log('Error fetching game data, using demo data');
              setGameState(prev => ({
                ...prev,
                loading: false,
                demoMode: true,
                currentGame: getMockGameData(),
                phase: 3, // Playing phase
                calledNumbers: [1, 5, 10, 15, 23, 27, 38, 42, 56, 61, 75, 80, 89],
                lastCalledNumber: 89,
                tickets: generateMockTickets(),
              }));
            } else {
              setGameState(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to connect to game server: ' + error.message,
              }));
            }
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
        
        // If we have an error and demo mode is enabled, use mock data
        if (appConfig.firebase.demoMode?.enabled) {
          console.log('Error setting up game listeners, using demo data');
          setGameState(prev => ({
            ...prev,
            loading: false,
            demoMode: true,
            currentGame: getMockGameData(),
            phase: 3, // Playing phase
            calledNumbers: [1, 5, 10, 15, 23, 27, 38, 42, 56, 61, 75, 80, 89],
            lastCalledNumber: 89,
            tickets: generateMockTickets(),
          }));
        } else {
          setGameState(prev => ({
            ...prev,
            loading: false,
            error: 'Error initializing game data: ' + error.message,
          }));
        }
        
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
  }, [currentUser, authLoading, authError]);

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

  // Show authentication-related loading/error states
  if (authLoading) {
    return <div>Authenticating...</div>;
  }

  if (authError && !gameState.demoMode) {
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

// Mock game data for development/demo when Firebase is unavailable
function getMockGameData() {
  return {
    gameState: {
      phase: 3, // Playing phase
      status: 'active',
      winners: {
        quickFive: ["demo-1"],
        topLine: ["demo-2"]
      }
    },
    numberSystem: {
      calledNumbers: [1, 5, 10, 15, 23, 27, 38, 42, 56, 61, 75, 80, 89],
      currentNumber: 89,
      callDelay: 8
    },
    activeTickets: {
      tickets: generateMockTickets(),
      bookings: [
        { number: "demo-1", playerName: "Player 1", timestamp: Date.now() - 3600000 },
        { number: "demo-2", playerName: "Player 2", timestamp: Date.now() - 1800000 },
        { number: "demo-3", playerName: "Player 3", timestamp: Date.now() - 900000 }
      ]
    },
    settings: {
      hostPhone: "1234567890",
      prizes: {
        quickFive: true,
        topLine: true,
        middleLine: true,
        bottomLine: true,
        corners: true,
        fullHouse: true
      }
    }
  };
}

// Generate sample tickets for development/demo
function generateMockTickets() {
  const tickets = [];
  const playerNames = appConfig.firebase.demoMode?.playerNames || [
    "Demo Player 1", "Demo Player 2", "Demo Player 3", 
    "Demo Player 4", "Demo Player 5"
  ];
  
  // Create demo tickets
  const ticketCount = appConfig.firebase.demoMode?.ticketCount || 8;
  for (let i = 1; i <= ticketCount; i++) {
    tickets.push({
      id: `demo-${i}`,
      numbers: generateTicketNumbers(),
      bookingDetails: i <= playerNames.length ? {
        playerName: playerNames[i-1],
        timestamp: Date.now() - (i * 600000)
      } : null,
      status: i <= playerNames.length ? 'booked' : 'available'
    });
  }
  
  return tickets;
}

// Generate valid Tambola ticket numbers
function generateTicketNumbers() {
  // Initialize ticket with zeros
  const ticket = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  
  // Each column has its range of numbers
  const columnRanges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90]
  ];
  
  // For each column, select positions and numbers
  for (let col = 0; col < 9; col++) {
    // Determine how many numbers in this column (1-3)
    const count = col === 0 || col === 8 ? 1 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 3);
    
    // Select random rows for this column
    const rows = shuffleArray([0, 1, 2]).slice(0, count);
    
    // Set numbers in the selected positions
    const [min, max] = columnRanges[col];
    rows.forEach((row, index) => {
      // Generate a number within the column's range
      ticket[row][col] = min + Math.floor(Math.random() * (max - min + 1));
    });
  }
  
  // Ensure each row has exactly 5 numbers
  for (let row = 0; row < 3; row++) {
    let numbersInRow = ticket[row].filter(n => n !== 0).length;
    
    // If too many numbers, remove some
    while (numbersInRow > 5) {
      const nonZeroIndices = ticket[row].map((n, i) => n !== 0 ? i : -1).filter(i => i !== -1);
      const indexToRemove = nonZeroIndices[Math.floor(Math.random() * nonZeroIndices.length)];
      ticket[row][indexToRemove] = 0;
      numbersInRow--;
    }
    
    // If too few numbers, add some
    while (numbersInRow < 5) {
      const zeroIndices = ticket[row].map((n, i) => n === 0 ? i : -1).filter(i => i !== -1);
      const indexToAdd = zeroIndices[Math.floor(Math.random() * zeroIndices.length)];
      const [min, max] = columnRanges[indexToAdd];
      ticket[row][indexToAdd] = min + Math.floor(Math.random() * (max - min + 1));
      numbersInRow++;
    }
  }
  
  return ticket;
}

// Helper function to shuffle an array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default GameContext;

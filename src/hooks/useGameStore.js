// src/hooks/useGameStore.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../config/firebase';
import { announceNumber } from '../utils/audio';
import { validateTicket } from '../utils/ticketUtils';
import { normalizeGameData, normalizeTickets, normalizeCalledNumbers } from '../utils/firebaseAdapter';

const initialState = {
  gameData: {
    loading: true,
    error: null,
    currentGame: null,
    activeGames: [],
    lastCalledNumber: null,
    calledNumbers: [],
    phase: 1,
    winningPatterns: [],
    prizePool: {},
  },
  userPreferences: {
    selectedTicket: null,
    soundEnabled: true,
    autoMarkNumbers: true,
    notifications: true,
  },
  ticketData: {
    loading: false,
    error: null,
    tickets: [],
    selectedTicket: null,
    bookingStatus: {},
  },
};

const useGameStore = () => {
  const [state, setState] = useState(initialState);

  // Memoized selectors
  const gameStatus = useMemo(() => {
    const { currentGame, phase } = state.gameData;
    if (!currentGame) return 'NO_GAME';
    if (phase === 1) return 'SETUP';
    if (phase === 2) return 'BOOKING';
    if (phase === 3) return 'IN_PROGRESS';
    return 'UNKNOWN';
  }, [state.gameData.currentGame, state.gameData.phase]);

  const activeTickets = useMemo(() => {
    return state.ticketData.tickets.filter(ticket => 
      ticket && validateTicket(ticket).isValid
    );
  }, [state.ticketData.tickets]);

  // Firebase subscription setup
  useEffect(() => {
    const hostsRef = ref(db, 'hosts');
    
    const handleGameUpdate = (snapshot) => {
      try {
        const hostsData = snapshot.val();
        
        if (!hostsData) {
          setState(prev => ({
            ...prev,
            gameData: {
              ...prev.gameData,
              loading: false,
              activeGames: [],
              error: null,
            }
          }));
          return;
        }

        const activeGames = Object.entries(hostsData)
          .filter(([_, hostData]) => {
            // Consider both 'active' and 'booking' as valid game statuses
            const status = hostData.currentGame?.gameState?.status;
            return (status === 'active' || status === 'booking') &&
              hostData.status === 'active';
          })
          .map(([hostId, hostData]) => {
            // Normalize the game data
            const normalizedGame = normalizeGameData(hostData.currentGame);
            return {
              hostId,
              ...normalizedGame,
            };
          });

        // Get the first active game or null
        const rawCurrentGame = activeGames[0] || null;
        // Normalize called numbers array
        const newCalledNumbers = normalizeCalledNumbers(
          rawCurrentGame?.numberSystem?.calledNumbers
        );
        const lastCalledNumber = newCalledNumbers[newCalledNumbers.length - 1];

        // Check for new number announcement
        if (lastCalledNumber && 
            lastCalledNumber !== state.gameData.lastCalledNumber && 
            state.userPreferences.soundEnabled) {
          announceNumber(lastCalledNumber);
        }

        setState(prev => ({
          ...prev,
          gameData: {
            ...prev.gameData,
            loading: false,
            error: null,
            currentGame: rawCurrentGame,
            activeGames,
            calledNumbers: newCalledNumbers,
            lastCalledNumber,
            phase: rawCurrentGame?.gameState?.phase || 1,
            winningPatterns: rawCurrentGame?.gameState?.winningPatterns || [],
            prizePool: rawCurrentGame?.gameState?.prizePool || {},
          }
        }));

      } catch (error) {
        console.error('Error processing game update:', error);
        setState(prev => ({
          ...prev,
          gameData: {
            ...prev.gameData,
            loading: false,
            error: 'Failed to process game update',
          }
        }));
      }
    };

    onValue(hostsRef, handleGameUpdate, (error) => {
      console.error('Firebase subscription error:', error);
      setState(prev => ({
        ...prev,
        gameData: {
          ...prev.gameData,
          loading: false,
          error: 'Connection error. Please refresh the page.',
        }
      }));
    });

    return () => off(hostsRef);
  }, [state.gameData.lastCalledNumber, state.userPreferences.soundEnabled]);

  // User preference actions
  const setUserPreference = useCallback((key, value) => {
    setState(prev => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        [key]: value,
      }
    }));

    // Persist preferences to localStorage
    try {
      const preferences = JSON.parse(localStorage.getItem('gamePreferences') || '{}');
      localStorage.setItem('gamePreferences', JSON.stringify({
        ...preferences,
        [key]: value,
      }));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }, []);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedPreferences = JSON.parse(localStorage.getItem('gamePreferences') || '{}');
      setState(prev => ({
        ...prev,
        userPreferences: {
          ...prev.userPreferences,
          ...savedPreferences,
        }
      }));
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }, []);

  // Ticket selection handling
  const selectTicket = useCallback((ticketId) => {
    setState(prev => ({
      ...prev,
      ticketData: {
        ...prev.ticketData,
        selectedTicket: ticketId,
      }
    }));
  }, []);

  // Reset store state
  const resetStore = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    // State
    gameData: state.gameData,
    userPreferences: state.userPreferences,
    ticketData: state.ticketData,
    
    // Computed values
    gameStatus,
    activeTickets,
    
    // Actions
    setUserPreference,
    selectTicket,
    resetStore,
  };
};

export default useGameStore;

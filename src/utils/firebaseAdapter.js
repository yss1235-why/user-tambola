// src/utils/firebaseAdapter.js
/**
 * This adapter normalizes Firebase data to match the expected structure
 * within the application without requiring database changes
 */

/**
 * Normalizes game data from Firebase to ensure all expected fields exist
 * @param {Object} gameData - Raw game data from Firebase
 * @returns {Object} - Normalized game data with expected structure
 */
export const normalizeGameData = (gameData) => {
  if (!gameData) return null;
  
  // Clone the data to avoid mutating the original
  const normalizedData = { ...gameData };
  
  // Ensure game has an ID
  if (!normalizedData.id) {
    normalizedData.id = Date.now().toString();
  }
  
  // Normalize gameState
  if (!normalizedData.gameState) {
    normalizedData.gameState = { phase: 1, status: 'setup' };
  } else {
    // Convert 'booking' status to 'active' status if in phase 2
    // This maps the database value to what the app expects
    if (normalizedData.gameState.status === 'booking' && 
        normalizedData.gameState.phase === 2) {
      // We'll keep 'booking' as is, as the app now supports this status
      // normalizedData.gameState.status = 'active';
    }
    
    // Ensure winners object exists
    if (!normalizedData.gameState.winners) {
      normalizedData.gameState.winners = {};
    }
    
    // Ensure winningPatterns array exists
    if (!normalizedData.gameState.winningPatterns) {
      normalizedData.gameState.winningPatterns = [];
    }
  }
  
  // Normalize numberSystem
  if (!normalizedData.numberSystem) {
    normalizedData.numberSystem = { calledNumbers: [], currentNumber: null, callDelay: 8 };
  } else {
    // Ensure calledNumbers array exists
    if (!normalizedData.numberSystem.calledNumbers) {
      normalizedData.numberSystem.calledNumbers = [];
    }
    
    // Ensure currentNumber field exists
    if (!normalizedData.numberSystem.currentNumber) {
      normalizedData.numberSystem.currentNumber = null;
    }
  }
  
  // Normalize activeTickets
  if (!normalizedData.activeTickets) {
    normalizedData.activeTickets = { tickets: [], bookings: [] };
  } else {
    // Ensure tickets array exists and remove null entries
    if (!normalizedData.activeTickets.tickets) {
      normalizedData.activeTickets.tickets = [];
    } else if (Array.isArray(normalizedData.activeTickets.tickets)) {
      // Remove null entries and ensure proper formatting
      normalizedData.activeTickets.tickets = normalizedData.activeTickets.tickets
        .filter(ticket => ticket !== null)
        .map(ticket => {
          // Ensure each ticket has required fields
          if (!ticket) return null;
          
          // Create a copy to avoid mutation
          const ticketCopy = { ...ticket };
          
          // Ensure ticket has an ID
          if (!ticketCopy.id) {
            ticketCopy.id = `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          }
          
          // Add gameId reference to help with ticket verification
          ticketCopy.gameId = normalizedData.id;
          
          // Ensure ticket has booking details if needed
          if (!ticketCopy.bookingDetails && ticketCopy.status === 'booked') {
            ticketCopy.bookingDetails = { playerName: 'Unknown Player', timestamp: Date.now() };
          }
          
          return ticketCopy;
        })
        .filter(ticket => ticket !== null); // Filter out any nulls created during mapping
    }
    
    // Ensure bookings array exists
    if (!normalizedData.activeTickets.bookings) {
      normalizedData.activeTickets.bookings = [];
    } else if (Array.isArray(normalizedData.activeTickets.bookings)) {
      // Filter out null entries and add gameId reference
      normalizedData.activeTickets.bookings = normalizedData.activeTickets.bookings
        .filter(booking => booking !== null)
        .map(booking => {
          if (!booking) return null;
          
          // Create a copy to avoid mutation
          const bookingCopy = { ...booking };
          
          // Add gameId reference to help with booking verification
          bookingCopy.gameId = normalizedData.id;
          
          return bookingCopy;
        })
        .filter(booking => booking !== null);
    }
  }
  
  // Normalize settings
  if (!normalizedData.settings) {
    normalizedData.settings = {
      hostPhone: "",
      prizes: {
        quickFive: true,
        topLine: true,
        middleLine: true,
        bottomLine: true,
        corners: true,
        fullHouse: true
      }
    };
  }
  
  return normalizedData;
};

/**
 * Normalizes ticket data for display and processing
 * with improved handling of data synchronization issues
 * @param {Array} tickets - Raw tickets data from Firebase
 * @param {Object} gameState - Current game state for reference
 * @returns {Array} - Normalized tickets array
 */
export const normalizeTickets = (tickets, gameState = null) => {
  if (!tickets || !Array.isArray(tickets)) return [];
  
  // Get current game phase (if available)
  let currentPhase = gameState?.phase;
  
  // Try to get phase from window global if not provided
  if (!currentPhase && typeof window !== 'undefined') {
    try {
      currentPhase = window.__GAME_STATE?.phase;
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Check if we're in booking phase
  const isBookingPhase = currentPhase === 2;
  
  // Handle booking phase synchronization
  if (isBookingPhase) {
    const now = Date.now();
    
    // Get timestamp of when we first detected booking phase
    let bookingPhaseStartTime = parseInt(localStorage.getItem('bookingPhaseStartTime') || '0');
    
    // If this is a newly detected booking phase, store the timestamp
    if (bookingPhaseStartTime === 0) {
      bookingPhaseStartTime = now;
      localStorage.setItem('bookingPhaseStartTime', bookingPhaseStartTime.toString());
      console.log('New booking phase detected at:', new Date(bookingPhaseStartTime).toLocaleTimeString());
    }
    
    // Check if called numbers array is empty (indicator of new game)
    const isNewGame = gameState?.calledNumbers?.length === 0 || 
                      window.__GAME_STATE?.isNewGame === true;
    
    // Check if this is a recent transition to booking phase
    const syncWindow = 20000; // 20 seconds sync window
    const isRecentTransition = (now - bookingPhaseStartTime) < syncWindow;
    
    // If we're in a sync window for a new game, ALL tickets should be available
    const shouldResetAllTickets = isBookingPhase && (isRecentTransition || isNewGame);
    
    if (shouldResetAllTickets) {
      console.log('In booking phase sync window, resetting all tickets to available');
      
      return tickets
        .filter(ticket => ticket !== null)
        .map(ticket => {
          // Clone to avoid mutations
          const normalizedTicket = { ...ticket };
          
          // Store original status for debugging
          normalizedTicket._originalStatus = normalizedTicket.status;
          normalizedTicket._originalBookingDetails = normalizedTicket.bookingDetails;
          
          // Reset ALL tickets to available during sync window
          normalizedTicket.status = 'available';
          normalizedTicket.bookingDetails = null;
          
          return normalizedTicket;
        })
        .filter(ticket => ticket !== null);
    }
  } else if (currentPhase === 3) {
    // If we're in playing phase, clear the booking phase timestamp
    localStorage.removeItem('bookingPhaseStartTime');
  }
  
  // Standard normalization for cases outside booking phase or sync window
  return tickets
    .filter(ticket => ticket !== null)
    .map(ticket => {
      // Clone to avoid mutations
      const normalizedTicket = { ...ticket };
      return normalizedTicket;
    })
    .filter(ticket => ticket !== null);
};

/**
 * Normalizes called numbers to ensure valid format
 * @param {Array} calledNumbers - Raw called numbers from Firebase
 * @returns {Array} - Normalized called numbers array
 */
export const normalizeCalledNumbers = (calledNumbers) => {
  if (!calledNumbers || !Array.isArray(calledNumbers)) return [];
  return [...calledNumbers];
};

export default {
  normalizeGameData,
  normalizeTickets,
  normalizeCalledNumbers
};

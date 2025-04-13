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
  
  // Normalize gameState
  if (!normalizedData.gameState) {
    normalizedData.gameState = { phase: 1, status: 'setup' };
  } else {
    // Convert 'booking' status to 'active' status if in phase 2 or 3
    if (normalizedData.gameState.status === 'booking' && 
        (normalizedData.gameState.phase === 2 || normalizedData.gameState.phase === 3)) {
      normalizedData.gameState.status = 'active';
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
          if (!ticket.bookingDetails && ticket.status === 'booked') {
            ticket.bookingDetails = { playerName: 'Unknown Player', timestamp: Date.now() };
          }
          return ticket;
        });
    }
    
    // Ensure bookings array exists
    if (!normalizedData.activeTickets.bookings) {
      normalizedData.activeTickets.bookings = [];
    }
  }
  
  return normalizedData;
};

/**
 * Normalizes ticket data for display and processing
 * @param {Array} tickets - Raw tickets data from Firebase
 * @returns {Array} - Normalized tickets array
 */
export const normalizeTickets = (tickets) => {
  if (!tickets || !Array.isArray(tickets)) return [];
  
  // Filter out null entries and normalize structure
  return tickets
    .filter(ticket => ticket !== null)
    .map(ticket => {
      // Clone to avoid mutations
      const normalizedTicket = { ...ticket };
      
      // Ensure ticket has required fields
      if (!normalizedTicket.bookingDetails && normalizedTicket.status === 'booked') {
        normalizedTicket.bookingDetails = { playerName: 'Unknown Player', timestamp: Date.now() };
      }
      
      return normalizedTicket;
    });
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

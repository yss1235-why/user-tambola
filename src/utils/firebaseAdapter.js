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
 * @param {Array} tickets - Raw tickets data from Firebase
 * @param {string} gameId - Current game ID for verification (optional)
 * @returns {Array} - Normalized tickets array
 */
export const normalizeTickets = (tickets, gameId = null) => {
  if (!tickets || !Array.isArray(tickets)) return [];
  
  // Filter out null entries and normalize structure
  return tickets
    .filter(ticket => ticket !== null)
    .map(ticket => {
      // Skip if completely invalid
      if (!ticket) return null;
      
      // Clone to avoid mutations
      const normalizedTicket = { ...ticket };
      
      // Clean up booking status for new games
      // If a gameId is provided and doesn't match ticket's gameId,
      // and ticket is from a different game, reset its booking status
      if (gameId && 
          normalizedTicket.gameId && 
          normalizedTicket.gameId !== gameId) {
        console.log(`Ticket ${normalizedTicket.id} belongs to a different game. Resetting booking status.`);
        normalizedTicket.status = 'available';
        delete normalizedTicket.bookingDetails;
      }
      
      // Ensure ticket has required fields
      if (!normalizedTicket.bookingDetails && normalizedTicket.status === 'booked') {
        normalizedTicket.bookingDetails = { playerName: 'Unknown Player', timestamp: Date.now() };
      }
      
      return normalizedTicket;
    })
    .filter(ticket => ticket !== null); // Remove any null results
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

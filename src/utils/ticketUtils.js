// src/utils/ticketUtils.js (Update the formatTicketForDisplay function)

export const formatTicketForDisplay = (ticket, calledNumbers = []) => {
  if (!ticket) {
    console.warn('Null or undefined ticket provided to formatTicketForDisplay');
    return null;
  }
  
  // Basic validation of ticket structure
  if (!ticket.numbers || !Array.isArray(ticket.numbers) || ticket.numbers.length !== 3) {
    console.warn('Invalid ticket format provided to formatTicketForDisplay', ticket);
    
    // Try to salvage if possible
    if (!ticket.numbers) {
      ticket.numbers = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
      ];
    }
  }
  
  // Ensure calledNumbers is an array
  if (!Array.isArray(calledNumbers)) {
    console.warn('Invalid calledNumbers provided to formatTicketForDisplay');
    calledNumbers = [];
  }
  
  const calledSet = new Set(calledNumbers);
  
  // Calculate status with error handling
  let status = {
    matchedNumbers: 0,
    completionPercentage: 0,
    patterns: {
      topLine: false,
      middleLine: false,
      bottomLine: false,
      corners: false,
      fullHouse: false
    }
  };
  
  try {
    status = calculateTicketStatus(ticket.numbers, calledNumbers);
  } catch (error) {
    console.error('Error calculating ticket status:', error);
  }
  
  // Format the ticket data with error handling for missing properties
  return {
    id: ticket.id || 'unknown',
    numbers: ticket.numbers.map(row => 
      row.map(number => ({
        value: number,
        called: number !== 0 && calledSet.has(number),
        empty: number === 0
      }))
    ),
    status,
    bookingDetails: ticket.bookingDetails || null,
    claimed: ticket.claimed || false
  };
};

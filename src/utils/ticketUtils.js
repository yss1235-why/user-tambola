// src/utils/ticketUtils.js

/**
 * Constants for ticket validation and processing
 */
const TICKET_CONSTANTS = {
  ROWS: 3,
  COLUMNS: 9,
  NUMBERS_PER_ROW: 5,
  TOTAL_NUMBERS: 15,
  MIN_NUMBER: 1,
  MAX_NUMBER: 90,
};

/**
 * Validates the structure and content of a Tambola ticket
 * @param {Object} ticket - The ticket object to validate
 * @returns {Object} Validation result with status and any errors
 */
export const validateTicket = (ticket) => {
  if (!ticket || !ticket.numbers || !Array.isArray(ticket.numbers)) {
    return {
      isValid: false,
      errors: ['Invalid ticket structure']
    };
  }

  const errors = [];
  const numbersSet = new Set();
  let totalNumbers = 0;

  // Validate basic structure
  if (ticket.numbers.length !== TICKET_CONSTANTS.ROWS) {
    errors.push(`Invalid number of rows: expected ${TICKET_CONSTANTS.ROWS}`);
  }

  // Validate each row
  ticket.numbers.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== TICKET_CONSTANTS.COLUMNS) {
      errors.push(`Invalid structure in row ${rowIndex + 1}`);
      return;
    }

    let numbersInRow = 0;

    row.forEach((number, colIndex) => {
      if (number !== 0) {
        // Validate number range for each column
        const minForColumn = colIndex * 10 + 1;
        const maxForColumn = colIndex === 8 ? 90 : (colIndex + 1) * 10;

        if (number < minForColumn || number > maxForColumn) {
          errors.push(`Number ${number} is out of range for column ${colIndex + 1}`);
        }

        if (numbersSet.has(number)) {
          errors.push(`Duplicate number ${number} found`);
        }

        numbersSet.add(number);
        numbersInRow++;
        totalNumbers++;
      }
    });

    if (numbersInRow !== TICKET_CONSTANTS.NUMBERS_PER_ROW) {
      errors.push(`Row ${rowIndex + 1} has ${numbersInRow} numbers instead of ${TICKET_CONSTANTS.NUMBERS_PER_ROW}`);
    }
  });

  if (totalNumbers !== TICKET_CONSTANTS.TOTAL_NUMBERS) {
    errors.push(`Ticket has ${totalNumbers} numbers instead of ${TICKET_CONSTANTS.TOTAL_NUMBERS}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculates the completion status of a ticket based on called numbers
 * @param {Array} ticketNumbers - 2D array of ticket numbers
 * @param {Array} calledNumbers - Array of called numbers
 * @returns {Object} Ticket completion statistics
 */
export const calculateTicketStatus = (ticketNumbers, calledNumbers) => {
  const calledSet = new Set(calledNumbers);
  let matchedNumbers = 0;
  let topLine = 0;
  let middleLine = 0;
  let bottomLine = 0;
  let corners = 0;
  let fullHouse = false;

  const rowCounts = ticketNumbers.map((row, rowIndex) => {
    let rowMatches = 0;
    row.forEach((number, colIndex) => {
      if (number !== 0 && calledSet.has(number)) {
        rowMatches++;
        matchedNumbers++;

        // Check corners
        if ((rowIndex === 0 || rowIndex === 2) && (colIndex === 0 || colIndex === 8)) {
          corners++;
        }
      }
    });
    return rowMatches;
  });

  // Calculate various winning patterns
  topLine = rowCounts[0] === TICKET_CONSTANTS.NUMBERS_PER_ROW;
  middleLine = rowCounts[1] === TICKET_CONSTANTS.NUMBERS_PER_ROW;
  bottomLine = rowCounts[2] === TICKET_CONSTANTS.NUMBERS_PER_ROW;
  fullHouse = matchedNumbers === TICKET_CONSTANTS.TOTAL_NUMBERS;

  return {
    matchedNumbers,
    completionPercentage: (matchedNumbers / TICKET_CONSTANTS.TOTAL_NUMBERS) * 100,
    patterns: {
      topLine,
      middleLine,
      bottomLine,
      corners: corners === 4,
      fullHouse
    }
  };
};

/**
 * Formats a ticket for display, including highlighting called numbers
 * @param {Object} ticket - The ticket object to format
 * @param {Array} calledNumbers - Array of called numbers
 * @returns {Object} Formatted ticket data for display
 */
export const formatTicketForDisplay = (ticket, calledNumbers = []) => {
  if (!ticket || !validateTicket(ticket).isValid) {
    logAnalyticsEvent('invalid_ticket_format', { ticketId: ticket?.id });
    return null;
  }

  const calledSet = new Set(calledNumbers);
  const status = calculateTicketStatus(ticket.numbers, calledNumbers);

  return {
    id: ticket.id,
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

/**
 * Checks if a ticket has won any prizes based on the current called numbers
 * @param {Object} ticket - The ticket to check
 * @param {Array} calledNumbers - Array of called numbers
 * @returns {Array} Array of won prize types
 */
export const checkTicketPrizes = (ticket, calledNumbers) => {
  const status = calculateTicketStatus(ticket.numbers, calledNumbers);
  const prizes = [];

  if (status.patterns.fullHouse) prizes.push('FULL_HOUSE');
  if (status.patterns.topLine) prizes.push('TOP_LINE');
  if (status.patterns.middleLine) prizes.push('MIDDLE_LINE');
  if (status.patterns.bottomLine) prizes.push('BOTTOM_LINE');
  if (status.patterns.corners) prizes.push('CORNERS');

  return prizes;
};

export default {
  validateTicket,
  calculateTicketStatus,
  formatTicketForDisplay,
  checkTicketPrizes,
  TICKET_CONSTANTS,
};
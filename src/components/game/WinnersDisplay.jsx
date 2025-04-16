// src/components/game/WinnersDisplay.jsx
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { announceNumber } from '../../utils/audio';

const PRIZE_CONFIG = {
  quickFive: { 
    label: 'Quick Five',
    description: 'First to mark any 5 numbers',
    icon: '5️⃣',
    order: 1 
  },
  topLine: { 
    label: 'Top Line',
    description: 'Complete the first line',
    icon: '⬆️',
    order: 2 
  },
  middleLine: { 
    label: 'Middle Line',
    description: 'Complete the middle line',
    icon: '➡️',
    order: 3 
  },
  bottomLine: { 
    label: 'Bottom Line',
    description: 'Complete the bottom line',
    icon: '⬇️',
    order: 4 
  },
  corners: { 
    label: 'Corners',
    description: 'Mark all four corners',
    icon: '🎯',
    order: 5 
  },
  fullHouse: { 
    label: 'Full House',
    description: 'Complete the entire ticket',
    icon: '👑',
    order: 6 
  },
  secondFullHouse: { 
    label: 'Second Full House',
    description: 'Second player to complete the entire ticket',
    icon: '🥈',
    order: 7 
  },
  starCorners: { 
    label: 'Star Corners',
    description: 'Mark the star pattern corners',
    icon: '⭐',
    order: 8 
  },
  fullSheet: { 
    label: 'Full Sheet',
    description: 'Complete all tickets in a sheet',
    icon: '📃',
    order: 9 
  },
  halfSheet: { 
    label: 'Half Sheet',
    description: 'Complete half of the tickets in a sheet',
    icon: '📄',
    order: 10 
  }
};

// Standard prize winner display for individual ticket prizes
const PrizeWinner = ({ prizeType, ticketId, playerName, isLatest, timestamp }) => {
  const prizeConfig = PRIZE_CONFIG[prizeType] || {
    label: prizeType,
    description: 'Prize winner',
    icon: '🎖️',
    order: 999
  };

  // Format timestamp if available
  const formattedTime = timestamp ? 
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
    null;

  return (
    <div className={`
      px-1 py-1 sm:px-4 sm:py-3
      ${isLatest ? 'bg-green-50' : 'hover:bg-gray-50'} 
      transition-colors duration-200
      border-b border-gray-100
      last:border-b-0
    `}>
      <div className="flex items-center">
        <span className="text-xl sm:text-2xl mr-1 sm:mr-3" role="img" aria-label={prizeConfig.label}>
          {prizeConfig.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm">{prizeConfig.label}</h3>
          <div className="flex flex-wrap justify-between items-baseline">
            <p className="text-xs text-gray-500 truncate mr-1">{prizeConfig.description}</p>
            <div className="text-xs text-right">
              <span className="font-medium text-gray-900">#{ticketId}</span>
              {playerName && <span className="ml-1 text-gray-700">{playerName}</span>}
            </div>
          </div>
        </div>

        {isLatest && (
          <span className="ml-1 sm:ml-2 flex-shrink-0 inline-flex items-center px-1 sm:px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Latest
          </span>
        )}
      </div>
    </div>
  );
};

// Sheet prize winner display for consolidated half/full sheet prizes
const SheetPrizeWinner = ({ prizeType, winningTickets, isLatest }) => {
  const prizeConfig = PRIZE_CONFIG[prizeType] || {
    label: prizeType,
    description: 'Prize winner',
    icon: '🎖️',
    order: 999
  };

  // Determine common player (if all tickets belong to same player)
  const allBelongToSamePlayer = winningTickets.every(
    (ticket, i, arr) => ticket.playerName === arr[0].playerName
  );

  const commonPlayerName = allBelongToSamePlayer ? winningTickets[0].playerName : null;

  return (
    <div className={`
      px-1 py-1 sm:px-4 sm:py-3
      ${isLatest ? 'bg-green-50' : 'hover:bg-gray-50'} 
      transition-colors duration-200
      border-b border-gray-100
      last:border-b-0
    `}>
      <div className="flex items-start">
        <span className="text-xl sm:text-2xl mr-1 sm:mr-3 flex-shrink-0" role="img" aria-label={prizeConfig.label}>
          {prizeConfig.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-gray-900 text-sm">{prizeConfig.label}</h3>
            {isLatest && (
              <span className="flex-shrink-0 inline-flex items-center px-1 sm:px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Latest
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-1">{prizeConfig.description}</p>
          
          {commonPlayerName && (
            <p className="text-xs font-medium text-blue-600 mb-1 sm:mb-2">
              Winner: {commonPlayerName}
            </p>
          )}

          {/* Ticket list - concise for mobile */}
          <div className="flex flex-wrap gap-1">
            {winningTickets.slice(0, 6).map((ticket, index) => (
              <span 
                key={ticket.ticketId}
                className="inline-flex items-center px-1 py-0.5 bg-gray-100 text-gray-800 rounded text-xs"
              >
                #{ticket.ticketId}
              </span>
            ))}
            {winningTickets.length > 6 && (
              <span className="inline-flex items-center px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                +{winningTickets.length - 6} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RemainingPrizes = ({ wonPrizes, enabledPrizes }) => {
  // Filter PRIZE_CONFIG to include only prizes enabled in game settings
  const allEnabledPrizes = Object.entries(PRIZE_CONFIG)
    .filter(([key]) => enabledPrizes.includes(key))
    .sort((a, b) => a[1].order - b[1].order);
  
  const remainingPrizes = allEnabledPrizes
    .filter(([key]) => !wonPrizes.includes(key));
    
  const remainingCount = remainingPrizes.length;
  
  if (remainingCount <= 0) return null;

  return (
    <div className="mt-1 sm:mt-3 p-1 sm:p-3 bg-gray-50 rounded-lg">
      <h3 className="text-xs font-medium text-gray-700 mb-1 sm:mb-2">
        Remaining Prizes ({remainingCount})
      </h3>
      <div className="grid grid-cols-2 gap-1 sm:gap-2">
        {remainingPrizes.map(([key, prize]) => (
          <div 
            key={key}
            className="bg-white px-1 sm:px-2 py-1 rounded border border-gray-200 flex items-center"
          >
            <span className="text-lg mr-1">{prize.icon}</span>
            <span className="text-xs text-gray-600 truncate">{prize.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WinnersDisplay = ({ previousGameData, currentGame, showPrevious = false }) => {
  const gameContext = useGame();
  const [latestWinner, setLatestWinner] = useState(null);
  const [processedWinners, setProcessedWinners] = useState([]);
  const [previousWinners, setPreviousWinners] = useState({});
  const [enabledPrizes, setEnabledPrizes] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Fix: Define headerTitle here
  const headerTitle = showPrevious ? "Previous Winners" : "Winners Board";
  
  // Sheet prizes to be consolidated
  const SHEET_PRIZES = ['halfSheet', 'fullSheet'];

  // Set up user interaction detection
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasInteracted(true);
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Improved findPlayerName function to handle array structure with null entries
  const findPlayerName = (ticketId, gameData) => {
    if (!ticketId || !gameData) return null;
    
    // Convert to string for safer comparison
    const ticketIdStr = ticketId.toString();
    
    // 1. Check bookings array, accounting for null entries
    if (gameData.activeTickets?.bookings) {
      for (let i = 0; i < gameData.activeTickets.bookings.length; i++) {
        const booking = gameData.activeTickets.bookings[i];
        if (booking && booking.number && booking.number.toString() === ticketIdStr) {
          if (booking.playerName) {
            return booking.playerName;
          }
        }
      }
    }
    
    // 2. Check in players object directly
    if (gameData.players) {
      for (const playerId in gameData.players) {
        const player = gameData.players[playerId];
        const playerTickets = player.tickets || [];
        
        // Check if this player has the ticket we're looking for
        if (playerTickets.includes(ticketIdStr)) {
          return player.name || `Ticket #${ticketId}`;
        }
      }
    }
    
    // 3. Try to get from the ticket's booking details
    if (gameData.activeTickets?.tickets) {
      for (let i = 0; i < gameData.activeTickets.tickets.length; i++) {
        const ticket = gameData.activeTickets.tickets[i];
        if (ticket && ticket.id && ticket.id.toString() === ticketIdStr) {
          if (ticket.bookingDetails?.playerName) {
            return ticket.bookingDetails.playerName;
          } else if (ticket.status === 'booked') {
            // If ticket is booked but doesn't have player details, check again in bookings
            if (gameData.activeTickets?.bookings) {
              const booking = gameData.activeTickets.bookings.find(
                b => b && b.number && b.number.toString() === ticketIdStr
              );
              if (booking && booking.playerName) {
                return booking.playerName;
              }
            }
          }
        }
      }
    }
    
    // 4. Fallback to ticket number
    return `Ticket #${ticketId}`;
  };

  useEffect(() => {
    // Determine which data to use
    const gameData = showPrevious ? 
      (previousGameData || {}) : 
      (currentGame || gameContext.currentGame || {});

    // Extract enabled prizes from game settings
    if (gameData?.settings?.prizes) {
      const prizes = gameData.settings.prizes;
      const enabled = Object.entries(prizes)
        .filter(([_, isEnabled]) => isEnabled === true)
        .map(([prizeKey]) => prizeKey);
      
      setEnabledPrizes(enabled);
    } else {
      // Default to all possible prizes if settings not available
      setEnabledPrizes(Object.keys(PRIZE_CONFIG));
    }

    // Get winners data
    const winnersData = showPrevious ? 
      previousGameData?.gameState?.winners : 
      (currentGame?.gameState?.winners || gameContext.currentGame?.gameState?.winners);

    // Process winners data
    if (!winnersData || Object.keys(winnersData).length === 0) {
      setProcessedWinners([]);
      setLatestWinner(null);
      return;
    }

    // Object to hold regular and sheet-based winners separately
    const winnersList = [];
    const sheetWinners = {};
    
    // Initialize sheet winners structure
    SHEET_PRIZES.forEach(prizeType => {
      sheetWinners[prizeType] = {
        prizeType,
        tickets: [],
        timestamp: 0
      };
    });

    // Process each prize type and its winners
    Object.entries(winnersData).forEach(([prizeType, ticketIds]) => {
      if (!Array.isArray(ticketIds)) return;
      
      // Handle sheet prizes differently
      if (SHEET_PRIZES.includes(prizeType)) {
        ticketIds.forEach(ticketId => {
          const playerName = findPlayerName(ticketId, gameData);
          const timestamp = Date.now();
          
          // Add to sheet winners
          sheetWinners[prizeType].tickets.push({
            ticketId,
            playerName,
            timestamp
          });
          
          // Update timestamp to latest
          if (timestamp > sheetWinners[prizeType].timestamp) {
            sheetWinners[prizeType].timestamp = timestamp;
          }
        });
      } else {
        // Handle regular (non-sheet) prizes
        ticketIds.forEach(ticketId => {
          const playerName = findPlayerName(ticketId, gameData);
          const timestamp = Date.now();
          
          winnersList.push({
            prizeType,
            ticketId,
            playerName,
            timestamp,
            isSheet: false
          });
        });
      }
    });

    // Add non-empty sheet winners to the winners list
    Object.values(sheetWinners).forEach(sheet => {
      if (sheet.tickets.length > 0) {
        winnersList.push({
          ...sheet,
          isSheet: true
        });
      }
    });

    // Sort winners by prize order and timestamp
    const sortedWinners = winnersList.sort((a, b) => {
      const orderA = PRIZE_CONFIG[a.prizeType]?.order || 999;
      const orderB = PRIZE_CONFIG[b.prizeType]?.order || 999;
      if (orderA !== orderB) return orderA - orderB;
      return b.timestamp - a.timestamp;
    });

    setProcessedWinners(sortedWinners);
    
    // Find the latest winner
    if (sortedWinners.length > 0 && !showPrevious) {
      // Find the winner with the most recent timestamp
      const newLatestWinner = sortedWinners.reduce((latest, current) => {
        if (!latest) return current;
        return current.timestamp > latest.timestamp ? current : latest;
      }, null);
      
      // If this is a new latest winner, announce it
      if (newLatestWinner && (!latestWinner || 
          (newLatestWinner.prizeType !== latestWinner.prizeType || 
           newLatestWinner.ticketId !== latestWinner.ticketId))) {
        // Announce the winner if we're in playing phase and user has interacted
        if (gameContext.phase === 3 && hasInteracted) {
          announceNumber(newLatestWinner.prizeType, newLatestWinner.playerName);
        }
        setLatestWinner(newLatestWinner);
      }
    }
  }, [gameContext.currentGame?.gameState?.winners, gameContext.currentGame?.activeTickets?.tickets, 
      gameContext.currentGame?.activeTickets?.bookings, gameContext.currentGame?.settings?.prizes,
      gameContext.currentGame?.players, previousGameData, currentGame, showPrevious, 
      gameContext.phase, latestWinner, hasInteracted]);

  // Display fewer items on mobile unless expanded
  const displayedWinners = expanded ? 
    processedWinners : 
    processedWinners.slice(0, 3);

  if (!processedWinners.length) {
    return (
      <div className="card shadow-sm animate-fade-in">
        <div className="px-1 py-1 sm:px-4 sm:py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="text-base font-medium text-gray-900">{headerTitle}</h2>
        </div>
        <div className="p-1 sm:p-4 text-center">
          <p className="text-sm text-gray-600">
            {showPrevious 
              ? "No winners from previous game"
              : gameContext.phase === 3 
                ? "No winners yet - Game in progress"
                : "Waiting for game to start"}
          </p>
          {gameContext.phase === 3 && !showPrevious && (
            <RemainingPrizes wonPrizes={[]} enabledPrizes={enabledPrizes} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm animate-fade-in">
      <div className="px-1 py-1 sm:px-4 sm:py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-medium text-gray-900">{headerTitle}</h2>
          <span className="text-xs text-gray-600">
            {processedWinners.length} won
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {displayedWinners.map((winner, index) => (
          winner.isSheet ? (
            <SheetPrizeWinner
              key={`${winner.prizeType}-${index}`}
              prizeType={winner.prizeType}
              winningTickets={winner.tickets}
              isLatest={winner === latestWinner && !showPrevious}
            />
          ) : (
            <PrizeWinner
              key={`${winner.prizeType}-${winner.ticketId}-${index}`}
              prizeType={winner.prizeType}
              ticketId={winner.ticketId}
              playerName={winner.playerName}
              timestamp={winner.timestamp}
              isLatest={winner === latestWinner && !showPrevious}
            />
          )
        ))}
      </div>

      {/* Show more/less toggle */}
      {processedWinners.length > 3 && (
        <div className="px-1 py-1 sm:px-3 sm:py-2 border-t border-gray-100 text-center">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 font-medium"
          >
            {expanded ? "Show less" : `Show all ${processedWinners.length} winners`}
          </button>
        </div>
      )}

      {gameContext.phase === 3 && !showPrevious && processedWinners.length < enabledPrizes.length && (
        <RemainingPrizes 
          wonPrizes={processedWinners.map(w => w.prizeType)} 
          enabledPrizes={enabledPrizes} 
        />
      )}
    </div>
  );
};

export default WinnersDisplay;

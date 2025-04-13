// src/components/game/WinnersDisplay.jsx
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { announcePrize } from '../../utils/audio';

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
      p-4 
      ${isLatest ? 'bg-green-50' : 'hover:bg-gray-50'} 
      transition-colors duration-200
      border-b border-gray-100
      last:border-b-0
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label={prizeConfig.label}>
            {prizeConfig.icon}
          </span>
          <div>
            <h3 className="font-medium text-gray-900">{prizeConfig.label}</h3>
            <p className="text-sm text-gray-500">{prizeConfig.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-medium text-gray-900">#{ticketId}</span>
          <span className="text-sm text-gray-700 font-medium">{playerName || 'Unbooked Ticket'}</span>
          {formattedTime && (
            <span className="text-xs text-gray-500 mt-1">at {formattedTime}</span>
          )}
        </div>
      </div>
      {isLatest && (
        <div className="mt-2 flex items-center justify-end">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            Latest Winner
          </span>
        </div>
      )}
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
      p-4 
      ${isLatest ? 'bg-green-50' : 'hover:bg-gray-50'} 
      transition-colors duration-200
      border-b border-gray-100
      last:border-b-0
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl" role="img" aria-label={prizeConfig.label}>
            {prizeConfig.icon}
          </span>
          <div>
            <h3 className="font-medium text-gray-900">{prizeConfig.label}</h3>
            <p className="text-sm text-gray-500">{prizeConfig.description}</p>
            {commonPlayerName && (
              <p className="text-sm font-medium text-blue-600 mt-1">
                Winner: {commonPlayerName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Ticket list */}
      <div className="mt-3 flex flex-wrap gap-2">
        {winningTickets.map(ticket => (
          <div 
            key={ticket.ticketId}
            className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm"
          >
            #{ticket.ticketId}
            {!commonPlayerName && ticket.playerName && (
              <span className="ml-1 text-xs text-gray-600">({ticket.playerName})</span>
            )}
          </div>
        ))}
      </div>

      {isLatest && (
        <div className="mt-2 flex items-center justify-end">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
            Latest Winner
          </span>
        </div>
      )}
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
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        Remaining Prizes ({remainingCount})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {remainingPrizes.map(([key, prize]) => (
          <div 
            key={key}
            className="bg-white px-3 py-2 rounded border border-gray-200 flex items-center space-x-2"
          >
            <span className="text-lg">{prize.icon}</span>
            <span className="text-xs text-gray-600">{prize.label}</span>
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
  const [enabledPrizes, setEnabledPrizes] = useState([]);
  
  // Sheet prizes to be consolidated
  const SHEET_PRIZES = ['halfSheet', 'fullSheet'];

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
          let playerName = 'Unknown Player';
          let timestamp = Date.now();

          // Get player name - different for previous game vs current game
          if (showPrevious && previousGameData) {
            // Look in the playerMap from previous game data
            playerName = previousGameData.playerMap?.[ticketId] || 'Unknown Player';
          } else {
            // Current game - look in the active tickets
            const ticket = gameData.activeTickets?.tickets?.find(
              t => t && t.id && t.id.toString() === ticketId.toString()
            );
            
            if (ticket) {
              if (ticket.bookingDetails?.playerName) {
                playerName = ticket.bookingDetails.playerName;
                timestamp = ticket.bookingDetails.timestamp || timestamp;
              } else if (gameData.activeTickets?.bookings) {
                const booking = gameData.activeTickets.bookings.find(
                  b => b && b.number && b.number.toString() === ticketId.toString()
                );
                if (booking && booking.playerName) {
                  playerName = booking.playerName;
                }
              }
            }
          }
          
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
          let playerName = 'Unknown Player';
          let timestamp = Date.now();

          // Get player name - different for previous game vs current game
          if (showPrevious && previousGameData) {
            // Look in the playerMap from previous game data
            playerName = previousGameData.playerMap?.[ticketId] || 'Unknown Player';
          } else {
            // Current game - look in the active tickets
            const ticket = gameData.activeTickets?.tickets?.find(
              t => t && t.id && t.id.toString() === ticketId.toString()
            );
            
            if (ticket) {
              if (ticket.bookingDetails?.playerName) {
                playerName = ticket.bookingDetails.playerName;
                timestamp = ticket.bookingDetails.timestamp || timestamp;
              } else if (gameData.activeTickets?.bookings) {
                const booking = gameData.activeTickets.bookings.find(
                  b => b && b.number && b.number.toString() === ticketId.toString()
                );
                if (booking && booking.playerName) {
                  playerName = booking.playerName;
                }
              }
            }
          }
          
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
        // Announce the winner if we're in playing phase
        if (gameContext.phase === 3) {
          announcePrize(newLatestWinner.prizeType, newLatestWinner.playerName);
        }
        setLatestWinner(newLatestWinner);
      }
    }
  }, [gameContext.currentGame?.gameState?.winners, gameContext.currentGame?.activeTickets?.tickets, 
      gameContext.currentGame?.activeTickets?.bookings, gameContext.currentGame?.settings?.prizes, 
      previousGameData, currentGame, showPrevious, gameContext.phase, latestWinner]);

  const headerTitle = showPrevious ? 
    "Previous Game Winners" : 
    "Winners Board";

  if (!processedWinners.length) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">{headerTitle}</h2>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600">
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">{headerTitle}</h2>
          <span className="text-sm text-gray-600">
            {processedWinners.length} {enabledPrizes.length > 0 ? `of ${enabledPrizes.length}` : ''} prizes won
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {processedWinners.map((winner, index) => (
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
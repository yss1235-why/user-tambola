// src/components/game/WinnersDisplay.jsx (Partial code with spacing updates)
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { announceNumber } from '../../utils/audio';

// ... keep existing PRIZE_CONFIG ...

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

// ... keep existing SheetPrizeWinner and other components ...

const WinnersDisplay = ({ previousGameData, currentGame, showPrevious = false }) => {
  // ... keep existing state and functions ...
  
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

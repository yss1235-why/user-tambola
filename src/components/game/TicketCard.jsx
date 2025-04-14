// src/components/game/TicketCard.jsx
import React, { useMemo, useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Link } from 'react-router-dom';

const TicketCard = ({ 
  ticketData, 
  isPreview = false, 
  onSelect = null, 
  isSelected = false,
  readOnly = false, 
  markedNumbers = [],
  onMarkNumber = null,
  showWinStatus = false 
}) => {
  const { currentGame } = useGame();
  const [ticketWinStatus, setTicketWinStatus] = useState({});
  
  // Determine if ticket has won any prizes
  useEffect(() => {
    if (!showWinStatus || !currentGame?.gameState?.winners || !ticketData?.id) return;
    
    const winStatus = {};
    const ticketId = ticketData.id.toString();
    
    // Check each prize type
    Object.entries(currentGame.gameState.winners).forEach(([prizeType, winners]) => {
      if (Array.isArray(winners) && winners.includes(ticketId)) {
        winStatus[prizeType] = true;
      }
    });
    
    setTicketWinStatus(winStatus);
  }, [currentGame?.gameState?.winners, ticketData?.id, showWinStatus]);
  
  // Prize display config
  const prizeIcons = {
    quickFive: '5️⃣',
    topLine: '⬆️',
    middleLine: '➡️',
    bottomLine: '⬇️',
    corners: '🎯',
    fullHouse: '👑',
    secondFullHouse: '🥈',
    starCorners: '⭐',
  };

  // Format ticket number with leading zeros
  const formattedTicketNumber = useMemo(() => {
    if (!ticketData?.id) return '#0';
    return `#${ticketData.id.toString().padStart(2, '0')}`;
  }, [ticketData?.id]);
  
  // Status classes
  const getStatusClass = useMemo(() => {
    if (isPreview) return 'border-dashed border-gray-300 bg-gray-50';
    
    switch (ticketData?.status) {
      case 'booked':
        return 'border-green-200 bg-green-50';
      case 'reserved':
        return 'border-yellow-200 bg-yellow-50';
      case 'available':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-white';
    }
  }, [ticketData?.status, isPreview]);
  
  // Selection classes
  const selectionClass = isSelected ? 'ring-2 ring-blue-500 shadow-md' : '';
  
  // Handle click on a number
  const handleNumberClick = (rowIndex, colIndex, number) => {
    if (readOnly || !onMarkNumber || number === 0) return;
    
    onMarkNumber(ticketData.id, rowIndex, colIndex, number);
  };
  
  // Only render if ticketData exists
  if (!ticketData || !ticketData.numbers) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-100 p-3 animate-pulse">
        <div className="h-24 w-full bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Check if this ticket has won any prizes
  const hasWonPrizes = Object.keys(ticketWinStatus).length > 0;

  return (
    <div 
      className={`rounded-lg border ${getStatusClass} ${selectionClass} overflow-hidden transition-all duration-200 ${isPreview ? '' : 'shadow-sm hover:shadow'}`}
      onClick={() => onSelect && onSelect(ticketData)}
    >
      {/* Ticket Header */}
      <div className="px-2 py-1 bg-white border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">
          {formattedTicketNumber}
        </span>
        
        {hasWonPrizes && showWinStatus && (
          <div className="flex space-x-1">
            {Object.keys(ticketWinStatus).map(prize => (
              <span 
                key={prize} 
                className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded"
                title={prize.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              >
                {prizeIcons[prize] || '🏆'}
              </span>
            ))}
          </div>
        )}
        
        {ticketData.status === 'booked' && (
          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
            Booked
          </span>
        )}
      </div>
      
      {/* Ticket Numbers */}
      <div className="p-2 grid grid-rows-3 gap-1 bg-white">
        {ticketData.numbers.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-9 gap-1">
            {row.map((number, colIndex) => {
              // Determine if number is marked
              const isMarked = markedNumbers.some(
                mark => mark.row === rowIndex && mark.col === colIndex && mark.number === number
              );
              
              // Empty cell
              if (number === 0) {
                return (
                  <div 
                    key={colIndex}
                    className="h-7 w-7 flex items-center justify-center bg-gray-50"
                  ></div>
                );
              }
              
              return (
                <div 
                  key={colIndex}
                  className={`
                    h-7 w-7 flex items-center justify-center rounded text-xs font-medium
                    ${isMarked 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'}
                    ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                    transition-colors
                  `}
                  onClick={() => handleNumberClick(rowIndex, colIndex, number)}
                >
                  {number}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* View Ticket Link - only for non-preview tickets */}
      {!isPreview && ticketData.id && !readOnly && (
        <div className="px-2 py-1 bg-gray-50 border-t border-gray-200 text-center">
          <Link 
            to={`/ticket/${ticketData.id}`}
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            View Ticket
          </Link>
        </div>
      )}
    </div>
  );
};

export default TicketCard;

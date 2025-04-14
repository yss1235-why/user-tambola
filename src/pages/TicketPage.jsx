// src/pages/TicketPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { formatTicketForDisplay, checkTicketPrizes } from '../utils/ticketUtils';

const PrizeStatus = ({ wonPrizes }) => {
  if (!wonPrizes.length) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
        <p className="text-sm text-gray-600">No prizes won yet. Keep playing!</p>
      </div>
    );
  }

  const prizeEmojis = {
    QUICK_FIVE: '5️⃣',
    TOP_LINE: '⬆️',
    MIDDLE_LINE: '➡️',
    BOTTOM_LINE: '⬇️',
    CORNERS: '🎯',
    STAR_CORNERS: '⭐',
    FULL_HOUSE: '👑',
    SECOND_FULL_HOUSE: '🥈'
  };

  return (
    <div className="bg-green-50 rounded-lg p-3 sm:p-4">
      <h3 className="text-base font-semibold text-green-800 mb-3">
        Congratulations!
      </h3>
      <div className="space-y-2">
        {wonPrizes.map((prize, index) => (
          <div 
            key={index}
            className="flex items-center justify-between bg-white rounded-lg p-3 animate-fade-in"
          >
            <div className="flex items-center">
              <span className="text-lg mr-2">{prizeEmojis[prize] || '🏆'}</span>
              <span className="text-sm text-green-700">{prize.replace(/_/g, ' ')}</span>
            </div>
            <svg
              className="h-5 w-5 text-green-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProgressBar = ({ completed, total }) => {
  const percentage = Math.round((completed / total) * 100);
  
  return (
    <div className="space-y-1">
      <div className="w-full bg-gray-200 rounded-full overflow-hidden h-2">
        <div 
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>{completed}/{total} numbers matched</span>
        <span>{percentage}%</span>
      </div>
    </div>
  );
};

const TicketCell = ({ cell }) => {
  const cellClasses = `
    aspect-square
    flex
    items-center
    justify-center
    text-sm
    sm:text-base
    font-medium
    rounded-md
    ${cell.empty ? 'bg-gray-100' : 'bg-white border'}
    ${cell.called ? 'bg-green-100 text-green-800 border-green-300' : 'border-gray-200'}
  `;

  return (
    <div className={cellClasses}>
      {cell.value !== 0 ? cell.value : ''}
    </div>
  );
};

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentGame, calledNumbers, phase } = useGame();
  const [ticketDetails, setTicketDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    if (!currentGame?.activeTickets?.tickets) {
      setError('Game data not available');
      setLoading(false);
      return;
    }

    const ticket = currentGame.activeTickets.tickets.find(
      t => t && t.id && t.id.toString() === ticketId
    );

    if (!ticket) {
      setError('Ticket not found');
      setLoading(false);
      return;
    }

    const formattedTicket = formatTicketForDisplay(ticket, calledNumbers);
    setTicketDetails(formattedTicket);
    setLoading(false);
  }, [ticketId, currentGame, calledNumbers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-6 sm:py-8 px-3 sm:px-0">
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Return to Game
          </button>
        </div>
      </div>
    );
  }

  if (!ticketDetails) {
    return null;
  }

  const wonPrizes = checkTicketPrizes(ticketDetails, calledNumbers);
  const playerName = ticketDetails.bookingDetails?.playerName || 'Unbooked Ticket';

  return (
    <div className="max-w-lg mx-auto space-y-4 animate-fade-in px-3 sm:px-0">
      {/* Ticket Header */}
      <div className="card shadow-sm">
        <div className="p-3 sm:p-4 flex justify-between items-center border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Ticket #{ticketDetails.id}
            </h1>
            <p className="text-sm text-gray-600">{playerName}</p>
          </div>
          {phase === 3 && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium
              ${wonPrizes.length ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
            >
              {wonPrizes.length ? 'Winner' : 'In Play'}
            </span>
          )}
        </div>

        {/* Ticket Grid */}
        <div className="p-2 sm:p-3 bg-gray-50">
          <div className="grid grid-rows-3 gap-1 sm:gap-2">
            {ticketDetails.numbers.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-9 gap-1">
                {row.map((cell, colIndex) => (
                  <TicketCell
                    key={`${rowIndex}-${colIndex}`}
                    cell={cell}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Section */}
        {phase === 3 && (
          <div className="px-3 sm:px-4 py-3 border-t border-gray-100">
            <ProgressBar
              completed={ticketDetails.status.matchedNumbers}
              total={15}
            />
          </div>
        )}
      </div>

      {/* Prize Status */}
      {phase === 3 && (
        <PrizeStatus wonPrizes={wonPrizes} />
      )}

      {/* Booking Details */}
      {ticketDetails.bookingDetails && (
        <div className="card shadow-sm p-3 sm:p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Booking Details
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Name</span>
              <span className="font-medium text-gray-900">{ticketDetails.bookingDetails.playerName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Booked On</span>
              <span className="font-medium text-gray-900">
                {new Date(ticketDetails.bookingDetails.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary flex-1 flex items-center justify-center"
        >
          <svg 
            className="h-4 w-4 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          Back to Game
        </button>
        {phase === 2 && !ticketDetails.bookingDetails && (
          <button
            onClick={() => {
              const message = `I want to book ticket ${ticketDetails.id}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
            }}
            className="btn-primary flex-1 flex items-center justify-center"
          >
            <svg 
              className="h-4 w-4 mr-2" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm0 22c-5.301 0-9.6-4.298-9.6-9.6 0-5.302 4.299-9.6 9.6-9.6s9.6 4.298 9.6 9.6c0 5.302-4.299 9.6-9.6 9.6z"/>
            </svg>
            Book via WhatsApp
          </button>
        )}
      </div>
    </div>
  );
};

export default TicketPage;

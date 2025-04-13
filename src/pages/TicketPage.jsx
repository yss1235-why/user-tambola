// src/pages/TicketPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { formatTicketForDisplay, checkTicketPrizes } from '../utils/ticketUtils';

const PrizeStatus = ({ wonPrizes }) => {
  if (!wonPrizes.length) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-gray-600">No prizes won yet. Keep playing!</p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-green-800 mb-2">
        Congratulations!
      </h3>
      <div className="space-y-2">
        {wonPrizes.map((prize, index) => (
          <div 
            key={index}
            className="flex items-center justify-between bg-white rounded p-2"
          >
            <span className="text-green-700">{prize.replace('_', ' ')}</span>
            <svg
              className="h-5 w-5 text-green-500"
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
    <div className="w-full bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-2 bg-blue-500 transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
      <div className="mt-1 text-sm text-gray-600 text-center">
        {completed} of {total} numbers matched ({percentage}%)
      </div>
    </div>
  );
};

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentGame, calledNumbers, phase } = useGame();
  const [ticketDetails, setTicketDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentGame?.activeTickets?.tickets) {
      setError('Game data not available');
      return;
    }

    const ticket = currentGame.activeTickets.tickets.find(
      t => t.id === ticketId
    );

    if (!ticket) {
      setError('Ticket not found');
      return;
    }

    const formattedTicket = formatTicketForDisplay(ticket, calledNumbers);
    setTicketDetails(formattedTicket);
  }, [ticketId, currentGame, calledNumbers]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Return to Game
          </button>
        </div>
      </div>
    );
  }

  if (!ticketDetails) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
        <p className="mt-4 text-gray-600">Loading ticket details...</p>
      </div>
    );
  }

  const wonPrizes = checkTicketPrizes(ticketDetails, calledNumbers);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Ticket Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Ticket #{ticketDetails.id}
            </h1>
            {phase === 3 && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium
                ${wonPrizes.length ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {wonPrizes.length ? 'Prize Won' : 'In Progress'}
              </span>
            )}
          </div>

          {/* Ticket Grid */}
          <div className="grid grid-rows-3 gap-2 mb-6">
            {ticketDetails.numbers.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-9 gap-1">
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      aspect-square flex items-center justify-center
                      text-sm md:text-base font-medium rounded
                      ${cell.empty ? 'bg-gray-50' : 'bg-white border'}
                      ${cell.called ? 'bg-green-100 text-green-800 border-green-300' : 'border-gray-200'}
                    `}
                  >
                    {cell.value !== 0 ? cell.value : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Progress Section */}
          {phase === 3 && (
            <ProgressBar
              completed={ticketDetails.status.matchedNumbers}
              total={15}
            />
          )}
        </div>

        {/* Prize Status */}
        {phase === 3 && (
          <PrizeStatus wonPrizes={wonPrizes} />
        )}

        {/* Booking Details */}
        {ticketDetails.bookingDetails && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Booking Details
            </h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Name:</span>{' '}
                {ticketDetails.bookingDetails.playerName}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Booked On:</span>{' '}
                {new Date(ticketDetails.bookingDetails.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Back to Game
          </button>
          {phase === 2 && !ticketDetails.bookingDetails && (
            <button
              onClick={() => {
                const message = `I want to book ticket ${ticketDetails.id}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
              }}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Book via WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketPage;
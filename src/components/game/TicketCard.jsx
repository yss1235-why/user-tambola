// src/components/game/TicketCard.jsx
import React, { useMemo, useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { db, HOST_ID } from '../../config/firebase';
import { ref, get } from 'firebase/database';

const TicketCell = ({ number, isMarked }) => {
  const cellClasses = `
    w-full
    aspect-square
    flex
    items-center
    justify-center
    text-xs
    sm:text-sm
    font-medium
    rounded-md
    ${number === 0 
      ? 'bg-gray-100'
      : isMarked 
        ? 'bg-green-100 text-green-800 border border-green-300'
        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
    }
    transition-colors
    duration-150
  `;

  return (
    <div className={cellClasses}>
      {number !== 0 && number}
    </div>
  );
};

const TicketCard = ({ ticket, onRemove, showRemoveButton }) => {
  const { isNumberCalled, phase, currentGame } = useGame();
  const [hostPhone, setHostPhone] = useState('');

  // Only show remove button during playing phase when explicitly enabled
  const shouldShowRemoveButton = showRemoveButton && phase === 3;

  // Fetch host phone number from Firebase
  useEffect(() => {
    const fetchHostPhone = async () => {
      try {
        // Correct path to host phone number in currentGame settings
        if (currentGame?.settings?.hostPhone) {
          setHostPhone(currentGame.settings.hostPhone);
        } else {
          // Fallback to direct fetch if not available in context
          const hostPhoneRef = ref(db, `hosts/${HOST_ID}/currentGame/settings/hostPhone`);
          const snapshot = await get(hostPhoneRef);
          const phoneNumber = snapshot.val();
          
          if (phoneNumber) {
            setHostPhone(phoneNumber);
          }
        }
      } catch (error) {
        console.error('Error fetching host phone number:', error);
      }
    };

    fetchHostPhone();
  }, [currentGame]);

  // Get player name from ticket data or bookings
  const getPlayerName = () => {
    if (ticket.bookingDetails?.playerName) {
      return ticket.bookingDetails.playerName;
    }
    
    if (currentGame?.activeTickets?.bookings) {
      const booking = currentGame.activeTickets.bookings.find(
        b => b && b.number && b.number.toString() === ticket.id.toString()
      );
      
      if (booking && booking.playerName) {
        return booking.playerName;
      }
    }
    
    if (ticket.status === 'booked') {
      return 'Booked Ticket';
    }
    
    return null;
  };

  const playerName = getPlayerName();

  const ticketStats = useMemo(() => {
    if (!ticket?.numbers) return { total: 0, matched: 0 };
    
    let total = 0, matched = 0;
    ticket.numbers.forEach(row => {
      row.forEach(num => {
        if (num !== 0) {
          total++;
          if (isNumberCalled(num)) matched++;
        }
      });
    });
    return { total, matched };
  }, [ticket, isNumberCalled]);

  // Handle WhatsApp booking click
  const handleBookingClick = () => {
    const message = `I want to book Tambola ticket ${ticket.id}`;
    
    // Use host's phone number if available, otherwise use generic WhatsApp link
    if (hostPhone) {
      // Format phone number (remove any non-digit characters)
      const formattedPhone = hostPhone.replace(/\D/g, '');
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      // Fallback to generic WhatsApp without specific number
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  if (!ticket?.numbers) return null;

  return (
    <div className="card animate-fade-in hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="bg-blue-600 px-3 py-2 relative">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">#{ticket.id}</span>
            {playerName && (
              <span className="text-xs text-blue-100">
                {playerName}
              </span>
            )}
          </div>
          
          {shouldShowRemoveButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onRemove) onRemove(ticket.id);
              }}
              className="bg-white/20 hover:bg-white/30 text-white rounded-full p-1
                       transition-colors focus:outline-none"
              aria-label="Remove ticket"
            >
              <svg 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="p-2 bg-white">
        {ticket.numbers.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-9 gap-1 mb-1 last:mb-0">
            {row.map((num, colIndex) => (
              <TicketCell
                key={`${rowIndex}-${colIndex}`}
                number={num}
                isMarked={num !== 0 && isNumberCalled(num)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Progress Bar (Only in Playing Phase) */}
      {phase === 3 && (
        <div className="px-2 py-1 bg-gray-50 border-t border-gray-100">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${(ticketStats.matched / ticketStats.total) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-xs text-gray-500">{ticketStats.matched}/{ticketStats.total}</span>
            <span className="text-xs text-gray-500">
              {Math.round((ticketStats.matched / ticketStats.total) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Booking Button (Only in Booking Phase for Unbooked Tickets) */}
      {phase === 2 && !playerName && (
        <button
          onClick={handleBookingClick}
          className="w-full py-2 bg-green-600 text-white hover:bg-green-700
                   transition-colors text-sm font-medium rounded-b-xl"
        >
          Book via WhatsApp
        </button>
      )}
    </div>
  );
};

export default TicketCard;

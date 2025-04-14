// src/components/game/EnhancedWinnerAnnouncement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import { announceWinner } from '../../utils/winnersAudio';
import confetti from '../../utils/confetti';

// Prize configuration with visual elements (unchanged)
const PRIZE_CONFIG = {
  quickFive: { 
    label: 'Quick Five',
    description: 'First to mark any 5 numbers',
    icon: '5️⃣',
    color: 'bg-yellow-500',
    confetti: true,
    sound: 'fanfare'
  },
  // Other prize configurations - unchanged
  // ...
};

const EnhancedWinnerAnnouncement = () => {
  const { currentGame, phase } = useGame();
  const [winners, setWinners] = useState([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [previousWinners, setPreviousWinners] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef(new Audio());
  const hasInteractedRef = useRef(false);

  // Improved findPlayerName function to handle array structure with null entries
  const findPlayerName = (ticketId) => {
    if (!ticketId || !currentGame) return "Player";
    
    // Convert to string for safer comparison
    const ticketIdStr = ticketId.toString();
    
    // 1. Check bookings array, accounting for null entries
    if (currentGame.activeTickets?.bookings) {
      for (let i = 0; i < currentGame.activeTickets.bookings.length; i++) {
        const booking = currentGame.activeTickets.bookings[i];
        if (booking && booking.number && booking.number.toString() === ticketIdStr) {
          if (booking.playerName) {
            return booking.playerName;
          }
        }
      }
    }
    
    // 2. Check in players object directly
    if (currentGame.players) {
      for (const playerId in currentGame.players) {
        const player = currentGame.players[playerId];
        const playerTickets = player.tickets || [];
        
        // Check if this player has the ticket we're looking for
        if (playerTickets.includes(ticketIdStr)) {
          return player.name || "Player";
        }
      }
    }
    
    // 3. Try to get from the ticket's booking details
    if (currentGame.activeTickets?.tickets) {
      for (let i = 0; i < currentGame.activeTickets.tickets.length; i++) {
        const ticket = currentGame.activeTickets.tickets[i];
        if (ticket && ticket.id && ticket.id.toString() === ticketIdStr) {
          if (ticket.bookingDetails?.playerName) {
            return ticket.bookingDetails.playerName;
          } else if (ticket.status === 'booked') {
            // If ticket is booked but doesn't have player details, check again in bookings
            if (currentGame.activeTickets?.bookings) {
              const booking = currentGame.activeTickets.bookings.find(
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
    
    // 4. Last fallback
    return "Player";
  };

  // Rest of the component remains the same
  // ...

  // Check for new winners
  useEffect(() => {
    if (!currentGame?.gameState?.winners || phase !== 3) return;

    const currentWinners = currentGame.gameState.winners;
    const newWinnersList = [];
    
    Object.entries(currentWinners).forEach(([prizeType, ticketIds]) => {
      if (!Array.isArray(ticketIds) || ticketIds.length === 0) return;
      
      // For each prize type, check if there are new winners compared to previous state
      const previousWinnersForPrize = previousWinners[prizeType] || [];
      
      // Find new ticket IDs that weren't in the previous winners
      const newTicketIds = ticketIds.filter(id => !previousWinnersForPrize.includes(id));
      
      if (newTicketIds.length === 0) return;
      
      // Get player names for new winners
      newTicketIds.forEach(ticketId => {
        // Get player name using the improved function
        const playerName = findPlayerName(ticketId);
        
        // Add to winners
        newWinnersList.push({
          id: `${prizeType}-${ticketId}-${Date.now()}`,
          prizeType,
          ticketId,
          playerName,
          timestamp: Date.now()
        });
      });
    });
    
    // Update state with new winners
    if (newWinnersList.length > 0) {
      setWinners(prev => [...prev, ...newWinnersList]);
      
      // Queue announcements
      newWinnersList.forEach(winner => {
        // Add to queue - in a real application, we might want to manage this queue better
        setTimeout(() => {
          setActiveAnnouncement(winner);
          setIsVisible(true);
          
          // Play sound and trigger confetti
          playWinSound(winner.prizeType);
          triggerConfetti(winner.prizeType);
          
          // Announce using text-to-speech only if user has interacted
          if (hasInteractedRef.current) {
            announceWinner(winner.prizeType, {
              playerName: winner.playerName,
              ticketId: winner.ticketId
            });
          }
          
          // Hide after 5 seconds
          setTimeout(() => {
            setIsVisible(false);
            
            // Clear active announcement after animation completes
            setTimeout(() => {
              setActiveAnnouncement(null);
            }, 500);
          }, 5000);
        }, 300);
      });
    }
    
    // Update previous winners state
    setPreviousWinners(currentWinners);
  }, [currentGame?.gameState?.winners, phase]);

  // The render code remains the same as the original
  // ...

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
      <div 
        className={`
          max-w-md w-full ${prizeConfig.color} text-white rounded-xl shadow-2xl overflow-hidden
          animate-announcement pointer-events-auto
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
          transition-all duration-500
        `}
      >
        <div className="p-6 text-center">
          <div className="text-4xl mb-2">{prizeConfig.icon}</div>
          <h2 className="text-2xl font-bold mb-1">{prizeConfig.label} Winner!</h2>
          <p className="text-white/80 mb-4">{prizeConfig.description}</p>
          
          <div className="bg-white/20 rounded-lg p-4 mb-4">
            <p className="text-xl font-bold">{activeAnnouncement.playerName}</p>
            <p className="text-sm">Ticket #{activeAnnouncement.ticketId}</p>
          </div>
          
          <div className="flex justify-center">
            <Link 
              to={`/ticket/${activeAnnouncement.ticketId}`}
              className="px-4 py-2 bg-white text-gray-900 rounded-full font-medium"
            >
              View Ticket
            </Link>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes announcement-pop {
          0% { transform: scale(0.8); opacity: 0; }
          20% { transform: scale(1.05); }
          40% { transform: scale(0.95); }
          60% { transform: scale(1.02); }
          80% { transform: scale(0.98); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-announcement {
          animation: announcement-pop 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnhancedWinnerAnnouncement;

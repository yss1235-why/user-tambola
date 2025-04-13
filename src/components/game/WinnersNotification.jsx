// src/components/game/WinnersNotification.jsx
import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';

const WinnersNotification = () => {
  const { currentGame } = useGame();
  const [notifications, setNotifications] = useState([]);
  const [previousWinners, setPreviousWinners] = useState({});

  useEffect(() => {
    if (!currentGame?.gameState?.winners) return;

    const currentWinners = currentGame.gameState.winners;
    
    // Check for new winners by comparing with previous state
    const newNotifications = [];
    
    Object.entries(currentWinners).forEach(([prizeType, ticketIds]) => {
      if (!Array.isArray(ticketIds) || ticketIds.length === 0) return;
      
      // Skip sheet-based prizes for notifications (they'll be shown in winners board)
      if (['halfSheet', 'fullSheet'].includes(prizeType)) return;
      
      // For each prize type, check if there are new winners compared to previous state
      const previousWinnersForPrize = previousWinners[prizeType] || [];
      
      // Find new ticket IDs that weren't in the previous winners
      const newTicketIds = ticketIds.filter(id => !previousWinnersForPrize.includes(id));
      
      if (newTicketIds.length === 0) return;
      
      // Get player names for new winners
      newTicketIds.forEach(ticketId => {
        // Find ticket in active tickets
        const ticket = currentGame.activeTickets?.tickets?.find(
          t => t && t.id && t.id.toString() === ticketId.toString()
        );
        
        if (!ticket) return;
        
        // Get player name
        let playerName = 'Unknown Player';
        
        if (ticket.bookingDetails?.playerName) {
          playerName = ticket.bookingDetails.playerName;
        } else if (currentGame.activeTickets?.bookings) {
          const booking = currentGame.activeTickets.bookings.find(
            b => b && b.number && b.number.toString() === ticketId.toString()
          );
          if (booking && booking.playerName) {
            playerName = booking.playerName;
          }
        }
        
        // Add to notifications
        newNotifications.push({
          id: `${prizeType}-${ticketId}-${Date.now()}`,
          prizeType,
          prizeName: getPrizeName(prizeType),
          ticketId,
          playerName,
          timestamp: Date.now()
        });
      });
    });
    
    // Update state with new notifications
    if (newNotifications.length > 0) {
      setNotifications(prev => [...prev, ...newNotifications]);
      
      // Play audio announcement for each new winner
      newNotifications.forEach(notification => {
        announceWinner(notification.prizeType, notification.playerName);
      });
    }
    
    // Update previous winners state
    setPreviousWinners(currentWinners);
  }, [currentGame?.gameState?.winners]);
  
  // Automatically remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      const now = Date.now();
      setNotifications(prev => 
        prev.filter(notification => now - notification.timestamp < 5000)
      );
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [notifications]);
  
  // Helper functions
  const getPrizeName = (prizeType) => {
    const prizeNames = {
      quickFive: 'Quick Five',
      topLine: 'Top Line',
      middleLine: 'Middle Line',
      bottomLine: 'Bottom Line',
      corners: 'Corners',
      starCorners: 'Star Corners',
      fullHouse: 'Full House',
      secondFullHouse: 'Second Full House'
    };
    
    return prizeNames[prizeType] || prizeType;
  };
  
  const announceWinner = (prizeType, playerName) => {
    // Don't announce if speech synthesis is not available
    if (!('speechSynthesis' in window)) return;
    
    const prizeAnnouncements = {
      quickFive: `Quick Five correct and gone! Congratulations to ${playerName}!`,
      topLine: `Top Line correct and gone! Well done ${playerName}!`,
      middleLine: `Middle Line claimed and completed! Great job ${playerName}!`,
      bottomLine: `Bottom Line finished and done! Congratulations ${playerName}!`,
      corners: `Four Corners marked and won! Amazing ${playerName}!`,
      starCorners: `Star Pattern completed! Brilliant ${playerName}!`,
      fullHouse: `Full House! We have a winner! Congratulations ${playerName}!`,
      secondFullHouse: `Second Full House claimed! Well played ${playerName}!`
    };
    
    const announcement = prizeAnnouncements[prizeType] || `${getPrizeName(prizeType)} has been won by ${playerName}`;
    
    // Use speech synthesis to announce the winner
    const utterance = new SpeechSynthesisUtterance(announcement);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher pitch for excitement
    
    // Get English voice if available
    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) utterance.voice = englishVoice;
    
    speechSynthesis.speak(utterance);
  };
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className="bg-green-100 text-green-800 rounded-lg shadow-lg p-4 animate-fade-in-up"
          style={{
            animation: 'fadeInUp 0.3s ease-out, fadeOut 0.3s ease-in 4.7s forwards'
          }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-green-600"
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
            <div className="ml-3">
              <h3 className="text-sm font-medium">
                {notification.prizeName} Winner!
              </h3>
              <div className="mt-1 text-sm">
                <p><span className="font-semibold">{notification.playerName}</span> won with ticket #{notification.ticketId}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default WinnersNotification;
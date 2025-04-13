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
  
  const getPrizeEmoji = (prizeType) => {
    const prizeEmojis = {
      quickFive: '5️⃣',
      topLine: '⬆️',
      middleLine: '➡️',
      bottomLine: '⬇️',
      corners: '🎯',
      starCorners: '⭐',
      fullHouse: '👑',
      secondFullHouse: '🥈'
    };
    
    return prizeEmojis[prizeType] || '🏆';
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
    <div className="fixed bottom-4 right-0 left-0 z-50 px-4 flex flex-col items-center space-y-2 pointer-events-none sm:left-auto sm:right-4">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className="bg-green-100 text-green-800 rounded-xl shadow-lg p-3 max-w-xs w-full pointer-events-auto animate-slide-up sm:w-auto"
          style={{
            animation: 'slideUp 0.3s ease-out, fadeOut 0.3s ease-in 4.7s forwards'
          }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 text-lg mr-2">
              {getPrizeEmoji(notification.prizeType)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-green-800 truncate">
                {notification.prizeName} Winner!
              </h3>
              <div className="mt-1 text-xs">
                <p className="font-semibold truncate">{notification.playerName}</p>
                <p className="text-green-700">Ticket #{notification.ticketId}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default WinnersNotification;

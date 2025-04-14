// src/pages/TicketView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import MainLayout from '../components/layout/MainLayout';
import TicketCard from '../components/game/TicketCard';
import { db, HOST_ID } from '../config/firebase';
import { ref, get } from 'firebase/database';

const TicketView = () => {
  const { ticketId } = useParams();
  const { currentGame } = useGame();
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerInfo, setPlayerInfo] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if ticket is in current game first
        if (currentGame?.activeTickets?.tickets) {
          // Handle array with possible null elements
          const ticket = currentGame.activeTickets.tickets.find(
            t => t && t.id && t.id.toString() === ticketId
          );
          
          if (ticket) {
            setTicketData(ticket);
            // Find player information
            findPlayerInfo(ticket.id, currentGame);
            setLoading(false);
            return;
          }
        }
        
        // If ticket not found in current game, check previous sessions
        const hostRef = ref(db, `hosts/${HOST_ID}/sessions`);
        const sessionSnapshot = await get(hostRef);
        
        if (!sessionSnapshot.exists()) {
          throw new Error('No game sessions found');
        }
        
        // Look through all sessions
        const sessions = sessionSnapshot.val();
        let foundTicket = null;
        let sessionData = null;
        
        for (const sessionId in sessions) {
          const session = sessions[sessionId];
          if (session?.activeTickets?.tickets) {
            // Handle array with possible null elements
            const ticket = session.activeTickets.tickets.find(
              t => t && t.id && t.id.toString() === ticketId
            );
            
            if (ticket) {
              foundTicket = ticket;
              sessionData = session;
              break;
            }
          }
        }
        
        if (!foundTicket) {
          throw new Error(`Ticket #${ticketId} not found`);
        }
        
        setTicketData(foundTicket);
        // Find player information from the session
        findPlayerInfo(foundTicket.id, sessionData);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [ticketId, currentGame]);
  
  // Find player information for the ticket
  const findPlayerInfo = (ticketId, gameData) => {
    if (!ticketId || !gameData) return;
    
    // Convert to string for safer comparison
    const ticketIdStr = ticketId.toString();
    
    // Check bookings array first
    if (gameData.activeTickets?.bookings) {
      for (let i = 0; i < gameData.activeTickets.bookings.length; i++) {
        const booking = gameData.activeTickets.bookings[i];
        if (booking && booking.number && booking.number.toString() === ticketIdStr) {
          setPlayerInfo({
            name: booking.playerName || 'Unknown Player',
            phoneNumber: booking.phoneNumber || 'N/A',
            bookingTime: booking.timestamp ? new Date(booking.timestamp).toLocaleString() : 'N/A'
          });
          return;
        }
      }
    }
    
    // Check players object
    if (gameData.players) {
      for (const playerId in gameData.players) {
        const player = gameData.players[playerId];
        const playerTickets = player.tickets || [];
        
        if (playerTickets.includes(ticketIdStr)) {
          setPlayerInfo({
            name: player.name || 'Unknown Player',
            phoneNumber: player.phoneNumber || 'N/A',
            bookingTime: player.bookingTime ? new Date(player.bookingTime).toLocaleString() : 'N/A'
          });
          return;
        }
      }
    }
    
    // Default if player not found
    setPlayerInfo({
      name: 'Unknown Player',
      phoneNumber: 'N/A',
      bookingTime: 'N/A'
    });
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 flex items-center">
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-800 inline-flex items-center"
          >
            <svg 
              className="w-4 h-4 mr-1" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Game
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-blue-50">
            <h1 className="text-xl font-semibold text-gray-900">
              Ticket #{ticketId}
            </h1>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-pulse flex justify-center">
                <div className="h-8 w-8 bg-blue-200 rounded-full"></div>
              </div>
              <p className="mt-2 text-gray-600">Loading ticket information...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <p className="text-red-700">{error}</p>
                <p className="mt-2 text-gray-700">Please check the ticket number and try again.</p>
              </div>
            </div>
          ) : (
            <div>
              {playerInfo && (
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-sm font-medium text-gray-700">Player Information</h2>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-gray-600">Name:</div>
                    <div className="font-medium text-gray-900">{playerInfo.name}</div>
                    
                    <div className="text-gray-600">Phone:</div>
                    <div className="font-medium text-gray-900">{playerInfo.phoneNumber}</div>
                    
                    <div className="text-gray-600">Booked On:</div>
                    <div className="font-medium text-gray-900">{playerInfo.bookingTime}</div>
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <h2 className="text-sm font-medium text-gray-700 mb-3">Ticket Numbers</h2>
                {ticketData && (
                  <TicketCard 
                    ticketData={ticketData} 
                    isPreview={false} 
                    readOnly={true}
                  />
                )}
              </div>
              
              <div className="px-4 py-3 bg-gray-50 text-right">
                <Link 
                  to="/" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Return to Game
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TicketView;

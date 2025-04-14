// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, get } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import appConfig from './appConfig';

// Get Firebase config using environment variables with fallbacks for development
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD9GvksGX2Bq-deR9Iuzf4MZCOxRLvXTtA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tambola-game-demo.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://tambola-game-demo-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tambola-game-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tambola-game-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890abcdef",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEFGHIJ"
};

// Read host ID from environment variables or use the default from appConfig
// Add a fallback demo host ID that is publicly accessible for demo purposes
const HOST_ID = import.meta.env.VITE_FIREBASE_HOST_ID || appConfig.firebase.hostId || "demoHostId";

// Initialize Firebase with error handling
let app, database, analytics, auth;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  analytics = getAnalytics(app);
  auth = getAuth(app);
  console.log('Firebase initialized with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Set up dummy implementations for testing/development when Firebase fails
  database = {
    // Dummy implementation that returns null for all operations
    app: null,
    ref: () => ({})
  };
  auth = {
    // Dummy auth implementation
    currentUser: null,
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    }
  };
}

// Authentication utilities with error handling
export const signInAnonymousUser = async () => {
  try {
    if (!auth) throw new Error("Firebase auth not initialized");
    const userCredential = await signInAnonymously(auth);
    console.log("Anonymous authentication successful:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous authentication error:", error);
    throw error;
  }
};

// Check if user is already authenticated
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    if (!auth) {
      reject(new Error("Firebase auth not initialized"));
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Database paths using the centralized HOST_ID
export const PATHS = {
  currentGame: `hosts/${HOST_ID}/currentGame`,
  gameState: `hosts/${HOST_ID}/currentGame/gameState`,
  numberSystem: `hosts/${HOST_ID}/currentGame/numberSystem`,
  activeTickets: `hosts/${HOST_ID}/currentGame/activeTickets/tickets`,
  winners: `hosts/${HOST_ID}/currentGame/winners`,
  settings: `hosts/${HOST_ID}/settings`,
  hostProfile: `hosts/${HOST_ID}/profile`,
  hostSettings: `hosts/${HOST_ID}/settings`,
  gameHistory: `hosts/${HOST_ID}/gameHistory`,
};

// Game constants
export const GAME_PHASES = appConfig.gameConstants.phases;
export const GAME_STATUS = appConfig.gameConstants.status;

// Database utilities with authentication and improved error handling
export const databaseUtils = {
  // Authenticate and then fetch data
  fetchData: async (path) => {
    try {
      if (!database) throw new Error("Firebase database not initialized");
      
      // Ensure user is authenticated before fetching data
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        await signInAnonymousUser();
      }
      
      const reference = ref(database, path);
      const snapshot = await get(reference);
      return snapshot.val();
    } catch (error) {
      console.error(`Error fetching from ${path}:`, error.message);
      
      // For development/demo purposes, return mock data when in dev mode
      if (import.meta.env.DEV && path.includes('currentGame')) {
        console.log('Returning mock game data for development');
        return getMockGameData();
      }
      
      return null;
    }
  },
  
  // Set up a listener with authentication and fallback for development
  listenToPath: async (path, callback, errorCallback) => {
    try {
      if (!database) throw new Error("Firebase database not initialized");
      
      // Ensure authentication first
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        await signInAnonymousUser();
      }
      
      const reference = ref(database, path);
      const unsubscribe = onValue(reference, 
        (snapshot) => {
          const data = snapshot.val();
          console.log(`Reading data from ${path}:`, data);
          callback(snapshot);
        }, 
        (error) => {
          console.error(`Error reading from ${path}:`, error.message);
          
          // For development/demo purposes, provide mock data
          if (import.meta.env.DEV && path.includes('currentGame')) {
            console.log('Providing mock game data for development');
            callback({
              val: () => getMockGameData(),
              exists: () => true
            });
            return;
          }
          
          if (errorCallback) errorCallback(error);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up listener for ${path}:`, error.message);
      
      // For development/demo purposes, provide mock data and a dummy unsubscribe
      if (import.meta.env.DEV && path.includes('currentGame')) {
        console.log('Setting up mock data listener for development');
        setTimeout(() => {
          callback({
            val: () => getMockGameData(),
            exists: () => true
          });
        }, 1000);
        return () => {}; // Dummy unsubscribe function
      }
      
      if (errorCallback) errorCallback(error);
      return () => {}; // Return empty function as unsubscribe
    }
  }
};

// Mock game data for development/demo when Firebase is unavailable
function getMockGameData() {
  return {
    gameState: {
      phase: 3, // Playing phase
      status: 'active',
      winners: {
        quickFive: ["demo-1"],
        topLine: ["demo-2"]
      }
    },
    numberSystem: {
      calledNumbers: [1, 5, 10, 15, 23, 27, 38, 42, 56, 61, 75, 80, 89],
      currentNumber: 89,
      callDelay: 8
    },
    activeTickets: {
      tickets: generateMockTickets(),
      bookings: [
        { number: "demo-1", playerName: "Player 1", timestamp: Date.now() - 3600000 },
        { number: "demo-2", playerName: "Player 2", timestamp: Date.now() - 1800000 },
        { number: "demo-3", playerName: "Player 3", timestamp: Date.now() - 900000 }
      ]
    },
    settings: {
      hostPhone: "1234567890",
      prizes: {
        quickFive: true,
        topLine: true,
        middleLine: true,
        bottomLine: true,
        corners: true,
        fullHouse: true
      }
    }
  };
}

// Generate sample tickets for development/demo
function generateMockTickets() {
  const tickets = [];
  
  // Create 8 demo tickets
  for (let i = 1; i <= 8; i++) {
    tickets.push({
      id: `demo-${i}`,
      numbers: generateTicketNumbers(),
      bookingDetails: i <= 5 ? {
        playerName: `Player ${i}`,
        timestamp: Date.now() - (i * 600000)
      } : null,
      status: i <= 5 ? 'booked' : 'available'
    });
  }
  
  return tickets;
}

// Generate valid Tambola ticket numbers
function generateTicketNumbers() {
  // Initialize ticket with zeros
  const ticket = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  
  // Each column has its range of numbers
  const columnRanges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90]
  ];
  
  // For each column, select positions and numbers
  for (let col = 0; col < 9; col++) {
    // Determine how many numbers in this column (1-3)
    const count = col === 0 || col === 8 ? 1 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 3);
    
    // Select random rows for this column
    const rows = shuffleArray([0, 1, 2]).slice(0, count);
    
    // Set numbers in the selected positions
    const [min, max] = columnRanges[col];
    rows.forEach((row, index) => {
      // Generate a number within the column's range
      ticket[row][col] = min + Math.floor(Math.random() * (max - min + 1));
    });
  }
  
  // Ensure each row has exactly 5 numbers
  for (let row = 0; row < 3; row++) {
    let numbersInRow = ticket[row].filter(n => n !== 0).length;
    
    // If too many numbers, remove some
    while (numbersInRow > 5) {
      const nonZeroIndices = ticket[row].map((n, i) => n !== 0 ? i : -1).filter(i => i !== -1);
      const indexToRemove = nonZeroIndices[Math.floor(Math.random() * nonZeroIndices.length)];
      ticket[row][indexToRemove] = 0;
      numbersInRow--;
    }
    
    // If too few numbers, add some
    while (numbersInRow < 5) {
      const zeroIndices = ticket[row].map((n, i) => n === 0 ? i : -1).filter(i => i !== -1);
      const indexToAdd = zeroIndices[Math.floor(Math.random() * zeroIndices.length)];
      const [min, max] = columnRanges[indexToAdd];
      ticket[row][indexToAdd] = min + Math.floor(Math.random() * (max - min + 1));
      numbersInRow++;
    }
  }
  
  return ticket;
}

// Helper function to shuffle an array
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export { app, database as db, analytics, auth, HOST_ID };

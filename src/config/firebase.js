// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, get } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import appConfig from './appConfig';

// Get Firebase config using environment variables if available (for production)
// or fallback to the provided configuration (for development)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Read host ID from environment variables or use the default from appConfig
const HOST_ID = import.meta.env.VITE_FIREBASE_HOST_ID || appConfig.firebase.hostId;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Authentication utilities
export const signInAnonymousUser = async () => {
  try {
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// Game Constants from centralized config
export const GAME_PHASES = appConfig.gameConstants.phases;
export const GAME_STATUS = appConfig.gameConstants.status;

export const PRIZE_TYPES = {
  QUICK_FIVE: 'quickFive',
  TOP_LINE: 'topLine',
  MIDDLE_LINE: 'middleLine',
  BOTTOM_LINE: 'bottomLine',
  CORNERS: 'corners',
  STAR_CORNERS: 'starCorners',
  HALF_SHEET: 'halfSheet',
  FULL_SHEET: 'fullSheet',
  FULL_HOUSE: 'fullHouse',
  SECOND_FULL_HOUSE: 'secondFullHouse'
};

// Admin Constants
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'superAdmin',
  ADMIN: 'admin',
  HOST: 'host'
};

// Ticket Constants
export const TICKET_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  CLAIMED: 'claimed'
};

// Database paths using the centralized HOST_ID
export const PATHS = {
  // Game related paths
  currentGame: `hosts/${HOST_ID}/currentGame`,
  gameState: `hosts/${HOST_ID}/currentGame/gameState`,
  numberSystem: `hosts/${HOST_ID}/currentGame/numberSystem`,
  activeTickets: `hosts/${HOST_ID}/currentGame/activeTickets/tickets`,
  winners: `hosts/${HOST_ID}/currentGame/winners`,
  settings: `hosts/${HOST_ID}/settings`,
  
  // Host related paths
  hostProfile: `hosts/${HOST_ID}/profile`,
  hostSettings: `hosts/${HOST_ID}/settings`,
  gameHistory: `hosts/${HOST_ID}/gameHistory`,
  
  // Admin related paths
  admins: 'admins',
  hostsList: 'hosts'
};

// Database utilities for read-only operations with authentication
export const databaseUtils = {
  listenToPath: (path, callback) => {
    const reference = ref(database, path);
    
    const unsubscribe = onValue(reference, 
      (snapshot) => {
        const data = snapshot.val();
        console.log(`Reading data from ${path}:`, data);
        callback(snapshot);
      }, 
      (error) => {
        console.error(`Error reading from ${path}:`, error.message);
      }
    );

    return unsubscribe;
  },

  fetchData: async (path) => {
    try {
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
      return null;
    }
  },

  subscribeToGameUpdates: (gameId, callback) => {
    const gamePath = `hosts/${HOST_ID}/currentGame`;
    return databaseUtils.listenToPath(gamePath, callback);
  },

  subscribeToTicketUpdates: (callback) => {
    const ticketsPath = `hosts/${HOST_ID}/currentGame/activeTickets/tickets`;
    return databaseUtils.listenToPath(ticketsPath, callback);
  },

  subscribeToNumberCalls: (callback) => {
    const numbersPath = `hosts/${HOST_ID}/currentGame/numberSystem`;
    return databaseUtils.listenToPath(numbersPath, callback);
  }
};

// For debugging purposes, log the current firebase configuration (without sensitive data)
console.log('Firebase initialized with project:', firebaseConfig.projectId);

export { app, database as db, analytics, auth, HOST_ID };

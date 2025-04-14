// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, get } from 'firebase/database';
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import appConfig from './appConfig';

// Get Firebase config using environment variables with fallbacks
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

// Use the correct Host ID from your actual Firebase data
const HOST_ID = "x4q2vWEh8hfdjLwoY8KzVwCD9dB2";

// Initialize Firebase
let app, database, analytics, auth;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  analytics = getAnalytics(app);
  auth = getAuth(app);
  console.log('Firebase initialized with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('Firebase initialization error:', error);
  database = { app: null, ref: () => ({}) };
  auth = { 
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

// Database utilities with authentication
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
      return null;
    }
  },
  
  // Set up a listener with authentication
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
          if (errorCallback) errorCallback(error);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up listener for ${path}:`, error.message);
      if (errorCallback) errorCallback(error);
      return () => {}; // Return empty function as unsubscribe
    }
  }
};

export { app, database as db, analytics, auth, HOST_ID };

// src/config/firebase.js - updated anonymous auth to reuse existing sessions
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
const HOST_ID = "B8kbztcNrrXbvWYtlv3slaXJSyR2";

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

// Keep track of auth state to avoid repeated sign-ins
let isSigningIn = false;
let isAuthenticated = false;

// Check if there's a stored session in localStorage
const getStoredSession = () => {
  try {
    const sessionStr = localStorage.getItem('tambolaAuthSession');
    if (sessionStr) {
      return JSON.parse(sessionStr);
    }
  } catch (error) {
    console.error('Error retrieving stored session:', error);
  }
  return null;
};

// Store session in localStorage for persistence
const storeSession = (user) => {
  try {
    // Only store minimal information needed for debugging/logging
    const sessionData = {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      lastLogin: Date.now()
    };
    localStorage.setItem('tambolaAuthSession', JSON.stringify(sessionData));
  } catch (error) {
    console.error('Error storing session:', error);
  }
};

// Authentication utilities with improved session management
export const signInAnonymousUser = async () => {
  // If we're already signing in or authenticated, don't start a new sign-in
  if (isSigningIn || isAuthenticated) {
    console.log("Auth already in progress or completed, skipping new sign-in");
    return auth.currentUser;
  }
  
  try {
    isSigningIn = true;
    
    // Check if we're already authenticated
    if (auth.currentUser) {
      console.log("Using existing authenticated user:", auth.currentUser.uid);
      isAuthenticated = true;
      storeSession(auth.currentUser);
      return auth.currentUser;
    }
    
    // Check for stored session info (just for logging, actual session is managed by Firebase)
    const storedSession = getStoredSession();
    if (storedSession) {
      console.log("Found stored session, Firebase will attempt to reuse it");
    }
    
    // Let Firebase handle session persistence and reuse
    console.log("Performing anonymous authentication");
    const userCredential = await signInAnonymously(auth);
    
    console.log("Anonymous authentication successful:", userCredential.user.uid);
    isAuthenticated = true;
    storeSession(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous authentication error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Check if user is already authenticated
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    if (!auth) {
      reject(new Error("Firebase auth not initialized"));
      return;
    }
    
    // First check if auth.currentUser is already set
    if (auth.currentUser) {
      console.log("Current user already available:", auth.currentUser.uid);
      isAuthenticated = true;
      storeSession(auth.currentUser);
      resolve(auth.currentUser);
      return;
    }
    
    // Otherwise, wait for auth state to be determined
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        console.log("Auth state changed - user authenticated:", user.uid);
        isAuthenticated = true;
        storeSession(user);
      } else {
        console.log("Auth state changed - no authenticated user");
        isAuthenticated = false;
      }
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
  },
  
  // Make getCurrentUser available in databaseUtils for convenience
  getCurrentUser
};

export { app, database as db, analytics, auth, HOST_ID };

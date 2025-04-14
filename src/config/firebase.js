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

// Use the host ID from your configuration
const HOST_ID = import.meta.env.VITE_FIREBASE_HOST_ID || "B8kbztcNrrXbvWYtlv3slaXJSyR2";

// Initialize Firebase
let app, database, analytics, auth;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
  try {
    analytics = getAnalytics(app);
  } catch (analyticsError) {
    console.log('Analytics initialization skipped:', analyticsError.message);
  }
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create mock objects for graceful degradation
  database = { app: null, ref: () => ({}) };
  auth = { 
    currentUser: null, 
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    }
  };
}

// Track authentication state
let authInitialized = false;
let authInProgress = false;

// Sign in anonymously with timeout
export const signInAnonymousUser = async () => {
  if (authInProgress) {
    console.log("Authentication already in progress");
    return null;
  }
  
  if (auth.currentUser) {
    console.log("User already authenticated:", auth.currentUser.uid);
    return auth.currentUser;
  }
  
  authInProgress = true;
  
  try {
    // Set a timeout to prevent hanging
    const authPromise = signInAnonymously(auth);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Authentication timed out")), 10000)
    );
    
    const userCredential = await Promise.race([authPromise, timeoutPromise]);
    console.log("Anonymous auth successful:", userCredential.user.uid);
    authInitialized = true;
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous auth error:", error);
    // For timeout or other errors, return null instead of throwing
    return null;
  } finally {
    authInProgress = false;
  }
};

// Get current user with timeout
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    if (!auth) {
      console.log("Auth not initialized");
      resolve(null);
      return;
    }
    
    if (auth.currentUser) {
      console.log("Current user available:", auth.currentUser.uid);
      resolve(auth.currentUser);
      return;
    }
    
    // Set timeout to avoid hanging
    const timeout = setTimeout(() => {
      console.log("Auth state check timed out");
      resolve(null);
    }, 5000);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      if (user) {
        console.log("Auth state resolved with user:", user.uid);
      } else {
        console.log("Auth state resolved with no user");
      }
      resolve(user);
    });
  });
};

// Database paths
export const PATHS = {
  currentGame: `hosts/${HOST_ID}/currentGame`,
  gameState: `hosts/${HOST_ID}/currentGame/gameState`,
  numberSystem: `hosts/${HOST_ID}/currentGame/numberSystem`,
  activeTickets: `hosts/${HOST_ID}/currentGame/activeTickets/tickets`,
  winners: `hosts/${HOST_ID}/currentGame/winners`,
  settings: `hosts/${HOST_ID}/settings`,
  hostProfile: `hosts/${HOST_ID}/profile`,
};

// Database utilities with error handling and timeouts
export const databaseUtils = {
  fetchData: async (path) => {
    try {
      if (!database) return null;
      
      const reference = ref(database, path);
      
      // Set timeout to prevent hanging
      const fetchPromise = get(reference);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database fetch timed out")), 10000)
      );
      
      const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
      return snapshot.val();
    } catch (error) {
      console.error(`Error fetching from ${path}:`, error.message);
      return null;
    }
  },
  
  listenToPath: async (path, callback, errorCallback) => {
    try {
      if (!database) {
        if (errorCallback) errorCallback(new Error("Database not initialized"));
        return () => {};
      }
      
      const reference = ref(database, path);
      
      // Add timeout for initial connection
      let initialized = false;
      const timeout = setTimeout(() => {
        if (!initialized && errorCallback) {
          errorCallback(new Error("Database connection timed out"));
        }
      }, 10000);
      
      const unsubscribe = onValue(
        reference, 
        (snapshot) => {
          initialized = true;
          clearTimeout(timeout);
          callback(snapshot);
        }, 
        (error) => {
          initialized = true;
          clearTimeout(timeout);
          console.error(`Error reading from ${path}:`, error.message);
          if (errorCallback) errorCallback(error);
        }
      );
      
      return () => {
        clearTimeout(timeout);
        off(reference);
      };
    } catch (error) {
      console.error(`Error setting up listener for ${path}:`, error.message);
      if (errorCallback) errorCallback(error);
      return () => {};
    }
  },
  
  getCurrentUser
};

export { app, database as db, analytics, auth, HOST_ID };

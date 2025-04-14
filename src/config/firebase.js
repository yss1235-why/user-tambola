// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, get } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
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
const HOST_ID = import.meta.env.VITE_FIREBASE_HOST_ID || "B8kbztcNrrXbvWYtlv3slaXJSyR2";

// Initialize Firebase
let app, database, analytics, auth;
try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
  
  // Try initializing analytics, but don't fail if it doesn't work
  try {
    analytics = getAnalytics(app);
  } catch (analyticsError) {
    console.log('Analytics initialization skipped');
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

// Authentication utilities
export const signInAnonymousUser = async () => {
  if (!auth) return null;
  
  try {
    // Check if already signed in
    if (auth.currentUser) {
      console.log("Using existing authenticated user:", auth.currentUser.uid);
      return auth.currentUser;
    }
    
    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    console.log("Created new anonymous user:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Anonymous authentication error:", error);
    return null;
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    if (!auth) {
      resolve(null);
      return;
    }
    
    // If user is already available, return immediately
    if (auth.currentUser) {
      console.log("Current user available:", auth.currentUser.uid);
      resolve(auth.currentUser);
      return;
    }
    
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log("Auth state check timed out");
      resolve(null);
    }, 5000);
    
    // Otherwise wait for auth state
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

// Database utilities with improved reliability
export const databaseUtils = {
  fetchData: async (path) => {
    try {
      if (!database) return null;
      
      const reference = ref(database, path);
      const snapshot = await get(reference);
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
      
      const unsubscribe = onValue(
        reference, 
        callback, 
        (error) => {
          console.error(`Error reading from ${path}:`, error.message);
          if (errorCallback) errorCallback(error);
        }
      );
      
      // Return unsubscribe function
      return () => {
        console.log(`Unsubscribing from ${path}`);
        off(reference);
      };
    } catch (error) {
      console.error(`Error setting up listener for ${path}:`, error.message);
      if (errorCallback) errorCallback(error);
      return () => {};
    }
  }
};

export { app, database as db, analytics, auth, HOST_ID };

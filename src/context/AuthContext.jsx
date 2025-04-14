// src/context/AuthContext.jsx - updated to reuse anonymous sessions
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInAnonymousUser, getCurrentUser } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Set up auth state listener - only once
  useEffect(() => {
    if (hasInitialized) return;

    console.log("Setting up auth state listener");
    
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        if (user) {
          console.log("Auth state changed - user authenticated:", user.uid);
          setCurrentUser(user);
        } else {
          console.log("Auth state changed - no authenticated user");
          setCurrentUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    setHasInitialized(true);

    // Clean up subscription
    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, [hasInitialized]);

  // Initialize anonymous authentication if not already authenticated
  useEffect(() => {
    async function initializeAuth() {
      // Only attempt sign-in once after loading completes and we confirmed no current user
      if (hasInitialized && !loading && !currentUser && !error) {
        try {
          console.log("Initializing anonymous authentication");
          setLoading(true);
          
          // First check if there's an existing session
          const existingUser = await getCurrentUser();
          if (existingUser) {
            console.log("Found existing user session:", existingUser.uid);
            setCurrentUser(existingUser);
            setLoading(false);
            return;
          }
          
          // If no existing session, sign in anonymously
          const user = await signInAnonymousUser();
          console.log("New anonymous user created:", user.uid);
          setCurrentUser(user);
        } catch (error) {
          console.error("Anonymous auth initialization error:", error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    }

    initializeAuth();
  }, [hasInitialized, loading, currentUser, error]);

  // Refresh authentication if needed
  const refreshAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check for existing session first
      const existingUser = await getCurrentUser();
      if (existingUser) {
        console.log("Using existing user for refresh:", existingUser.uid);
        setCurrentUser(existingUser);
        setLoading(false);
        return;
      }
      
      // If no existing session, create a new one
      const user = await signInAnonymousUser();
      console.log("Created new user during refresh:", user.uid);
      setCurrentUser(user);
      setLoading(false);
    } catch (error) {
      console.error("Auth refresh error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    refreshAuth,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;

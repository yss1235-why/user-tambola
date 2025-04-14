// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInAnonymousUser, getCurrentUser } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authAttempted, setAuthAttempted] = useState(false);

  // Set up auth state listener
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (loading && !authAttempted) {
        console.log("Auth initialization timed out, proceeding with anonymous auth");
        handleAnonymousAuth();
      }
    }, 5000);
    
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        clearTimeout(timeoutId);
        if (user) {
          console.log("Auth state changed - user authenticated:", user.uid);
          setCurrentUser(user);
        } else {
          console.log("Auth state changed - no authenticated user");
          setCurrentUser(null);
          
          // If no user and not attempted yet, try anonymous auth
          if (!authAttempted) {
            handleAnonymousAuth();
          }
        }
        setLoading(false);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error("Auth state change error:", error);
        setError(error.message);
        setLoading(false);
        
        // Attempt anonymous auth on error
        if (!authAttempted) {
          handleAnonymousAuth();
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [authAttempted]);

  // Handle anonymous authentication
  const handleAnonymousAuth = async () => {
    setAuthAttempted(true);
    
    try {
      setLoading(true);
      setError(null);
      
      // Try to use existing session first
      const existingUser = await getCurrentUser();
      if (existingUser) {
        console.log("Using existing user:", existingUser.uid);
        setCurrentUser(existingUser);
        setLoading(false);
        return;
      }
      
      // Create new anonymous user
      const user = await signInAnonymousUser();
      if (user) {
        console.log("Created new anonymous user:", user.uid);
        setCurrentUser(user);
      } else {
        // Even if auth fails, we should continue loading the app
        setError("Anonymous authentication failed, some features may be limited");
      }
    } catch (error) {
      console.error("Anonymous auth error:", error);
      setError("Authentication error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh authentication if needed
  const refreshAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to authenticate again
      const user = await signInAnonymousUser();
      if (user) {
        setCurrentUser(user);
      } else {
        setError("Failed to refresh authentication");
      }
    } catch (error) {
      console.error("Auth refresh error:", error);
      setError(error.message);
    } finally {
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

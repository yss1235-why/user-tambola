// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, signInAnonymousUser, getCurrentUser } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const authInitialized = useRef(false);

  // Handle component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Set up auth state listener
  useEffect(() => {
    if (authInitialized.current) return;
    authInitialized.current = true;
    
    console.log("Setting up auth state listener");
    
    // Set a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (isMounted.current && loading) {
        console.log("Auth initialization timed out, proceeding with anonymous auth");
        handleAnonymousAuth();
      }
    }, 5000);
    
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        clearTimeout(timeoutId);
        if (!isMounted.current) return;
        
        if (user) {
          console.log("Auth state changed - user authenticated:", user.uid);
          setCurrentUser(user);
          setLoading(false);
        } else {
          console.log("Auth state changed - no authenticated user");
          setCurrentUser(null);
          
          // If no user, try anonymous auth immediately
          handleAnonymousAuth();
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        if (!isMounted.current) return;
        
        console.error("Auth state change error:", error);
        setError(error.message);
        
        // Try anonymous auth even on error
        handleAnonymousAuth();
      }
    );

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  // Handle anonymous authentication
  const handleAnonymousAuth = async () => {
    if (!isMounted.current) return;
    
    try {
      const user = await signInAnonymousUser();
      if (user && isMounted.current) {
        setCurrentUser(user);
      }
    } catch (error) {
      if (isMounted.current) {
        setError("Authentication error: " + error.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Function to refresh authentication if needed
  const refreshAuth = async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const user = await signInAnonymousUser();
      if (user && isMounted.current) {
        setCurrentUser(user);
      } else if (isMounted.current) {
        setError("Failed to refresh authentication");
      }
    } catch (error) {
      if (isMounted.current) {
        console.error("Auth refresh error:", error);
        setError(error.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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

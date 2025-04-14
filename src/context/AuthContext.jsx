// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, signInAnonymousUser, getCurrentUser } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        setCurrentUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Initialize anonymous authentication if not already authenticated
  useEffect(() => {
    async function initializeAuth() {
      try {
        // Only try to sign in if not already loading and no user
        if (!loading && !currentUser && !error) {
          setLoading(true);
          await signInAnonymousUser();
          // No need to setCurrentUser as the auth state listener will handle it
        }
      } catch (error) {
        console.error("Anonymous auth initialization error:", error);
        setError(error.message);
        setLoading(false);
      }
    }

    initializeAuth();
  }, [currentUser, loading, error]);

  // Refresh authentication if needed
  const refreshAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInAnonymousUser();
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

// src/App.jsx
import React, { Suspense, useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import { AuthProvider } from './context/AuthContext';
import appConfig from './config/appConfig';
import AppRouter from './routes/AppRouter';

// Simple loading component instead of importing from another file
const SimpleLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">{appConfig.appText.loadingText || 'Loading...'}</p>
    </div>
  </div>
);

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // App initialization
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load fonts, themes, or any initial data here
        await Promise.all([
          // Example: Load custom fonts
          document.fonts.ready,
          // Simulate any other initialization task
          new Promise(resolve => setTimeout(resolve, 500))
        ]);
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return <SimpleLoadingScreen />;
  }

  return (
    <AuthProvider>
      <GameProvider>
        <Suspense fallback={<SimpleLoadingScreen />}>
          <AppRouter />
        </Suspense>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;

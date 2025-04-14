// src/App.jsx
import React, { Suspense } from 'react';
import './App.css';
import { GameProvider } from './context/GameContext';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';

// Simple loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <AppRouter />
        </Suspense>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;

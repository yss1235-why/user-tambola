// src/components/ui/LoadingScreen.jsx
import React from 'react';
import appConfig from '../../config/appConfig';

const LoadingScreen = ({ message }) => {
  const displayMessage = message || appConfig.appText.loadingText;
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      <div className="relative">
        {/* Spinner with color gradient */}
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        
        {/* Inner dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
        </div>
      </div>
      
      <p className="mt-6 text-gray-700 text-lg font-medium animate-pulse">{displayMessage}</p>
      
      {/* Progress dots */}
      <div className="flex space-x-2 mt-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '300ms' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '600ms' }}></div>
      </div>
    </div>
  );
};

// Smaller inline loading indicator for component loading
export const LoadingIndicator = ({ size = 'medium', center = false, message }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3'
  };
  
  const containerClasses = center ? 'flex flex-col items-center justify-center' : '';
  
  return (
    <div className={containerClasses}>
      <div className={`${sizeClasses[size]} border-gray-200 border-t-blue-500 rounded-full animate-spin`}></div>
      {message && <p className="mt-2 text-xs text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingScreen;

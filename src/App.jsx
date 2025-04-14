// src/App.jsx - Fix loading screen
import React, { Suspense, useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import appConfig from './config/appConfig';

// Lazy load main components
const AppRouter = React.lazy(() => import('./routes/AppRouter'));

// Loading component for suspense fallback
const LoadingScreen = () => (
 <div className="min-h-screen flex items-center justify-center bg-gray-50">
   <div className="text-center">
     <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
     <p className="mt-4 text-gray-600 text-lg">{appConfig.appText.loadingText}</p>
   </div>
 </div>
);

// App Content Component
const AppContent = () => {
  const { currentUser, loading: authLoading, error: authError, refreshAuth } = useAuth();
  const [connectionError, setConnectionError] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set the document title
  useEffect(() => {
    document.title = appConfig.appText.websiteTitle;
  }, []);

  // Set a timeout for loading to avoid infinite spinner
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        setLoadingTimeout(true);
      }
    }, 15000); // 15 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, [authLoading]);

  // Handle retry
  const handleRetryConnection = () => {
    refreshAuth();
    setConnectionError(null);
    setLoadingTimeout(false);
  };

  // If loading timeout occurred, show retry button
  if (loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Connection Issues
            </h2>
            <p className="text-gray-600 mb-6">
              The connection is taking longer than expected. This might be due to network issues.
            </p>
            <button
              onClick={handleRetryConnection}
              className="px-6 py-2 bg-blue-500 text-white rounded-md 
                      hover:bg-blue-600 transition-colors duration-200"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display authentication loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 text-lg">Initializing secure connection...</p>
        </div>
      </div>
    );
  }

  // Display authentication error screen
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Authentication Error
            </h2>
            <p className="text-gray-600 mb-6">
              {authError}
            </p>
            <button
              onClick={refreshAuth}
              className="px-6 py-2 bg-blue-500 text-white rounded-md 
                      hover:bg-blue-600 transition-colors duration-200"
            >
              Retry Connection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-md 
                      hover:bg-gray-300 transition-colors duration-200"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display connection error screen
  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Connection Error
            </h2>
            <p className="text-gray-600 mb-6">
              {connectionError}
            </p>
            <button
              onClick={handleRetryConnection}
              className="px-6 py-2 bg-blue-500 text-white rounded-md 
                      hover:bg-blue-600 transition-colors duration-200"
            >
              Retry Connection
            </button>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-md 
                      hover:bg-gray-300 transition-colors duration-200"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal application rendering - proceed even if auth failed
  return (
    <GameProvider onError={setConnectionError}>
      <div className="min-h-screen bg-gray-50">
        <NetworkStatus />
        <Suspense fallback={<LoadingScreen />}>
          <AppRouter />
        </Suspense>
      </div>
    </GameProvider>
  );
};

// Network Status Monitor Component
const NetworkStatus = () => {
 const [isOnline, setIsOnline] = useState(window.navigator.onLine);

 useEffect(() => {
   const handleOnline = () => setIsOnline(true);
   const handleOffline = () => setIsOnline(false);

   window.addEventListener('online', handleOnline);
   window.addEventListener('offline', handleOffline);

   return () => {
     window.removeEventListener('online', handleOnline);
     window.removeEventListener('offline', handleOffline);
   };
 }, []);

 if (isOnline) return null;

 return (
   <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-40">
     <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
       <div className="p-2 rounded-lg bg-yellow-50 shadow-lg sm:p-3">
         <div className="flex items-center justify-between flex-wrap">
           <div className="w-0 flex-1 flex items-center">
             <span className="flex p-2 rounded-lg bg-yellow-100">
               <svg
                 className="h-6 w-6 text-yellow-700"
                 fill="none"
                 viewBox="0 0 24 24"
                 stroke="currentColor"
               >
                 <path
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   strokeWidth={2}
                   d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                 />
               </svg>
             </span>
             <p className="ml-3 font-medium text-yellow-700">
               You are currently offline. Some features may be unavailable.
             </p>
           </div>
         </div>
       </div>
     </div>
   </div>
 );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
 constructor(props) {
   super(props);
   this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error) {
   return { hasError: true, error };
 }

 componentDidCatch(error, errorInfo) {
   console.error('Application Error:', error, errorInfo);
 }

 handleRetry = () => {
   this.setState({ hasError: false, error: null });
   window.location.reload();
 };

 render() {
   if (this.state.hasError) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="max-w-md w-full mx-4">
           <div className="bg-white rounded-lg shadow-md p-8 text-center">
             <h2 className="text-2xl font-semibold text-gray-900 mb-4">
               Something went wrong
             </h2>
             <p className="text-gray-600 mb-6">
               We apologize for the inconvenience. Please try refreshing the page.
             </p>
             <button
               onClick={this.handleRetry}
               className="px-6 py-2 bg-blue-500 text-white rounded-md 
                        hover:bg-blue-600 transition-colors duration-200"
             >
               Retry
             </button>
           </div>
         </div>
       </div>
     );
   }

   return this.props.children;
 }
}

// Main App component with Authentication Provider
const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

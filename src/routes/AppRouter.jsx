// src/routes/AppRouter.jsx
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

// Layout Components
const MainLayout = React.lazy(() => import('../components/layout/MainLayout'));

// Page Components
const GamePage = React.lazy(() => import('../pages/GamePage'));
const TicketPage = React.lazy(() => import('../pages/TicketPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Route Guard Component
const RouteGuard = ({ children }) => {
  const { currentGame, loading, error } = useGame();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Active Games</h2>
          <p className="text-gray-600 mb-4">There are no games currently in progress.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return children;
};

const AppRouter = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <MainLayout>
          <Routes>
            {/* Home Route */}
            <Route 
              path="/" 
              element={
                <RouteGuard>
                  <GamePage />
                </RouteGuard>
              } 
            />

            {/* Ticket Details Route */}
            <Route 
              path="/ticket/:ticketId" 
              element={
                <RouteGuard>
                  <TicketPage />
                </RouteGuard>
              } 
            />

            {/* Redirect legacy URLs to home */}
            <Route 
              path="/game" 
              element={<Navigate to="/" replace />} 
            />

            {/* 404 Page */}
            <Route 
              path="*" 
              element={<NotFoundPage />} 
            />
          </Routes>
        </MainLayout>
      </Suspense>
    </Router>
  );
};

// Error Boundary HOC for route components
const withErrorBoundary = (WrappedComponent) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Route Error:', error, errorInfo);
      // Log to your error reporting service here
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4">We're sorry, but there was an error loading this page.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
};

// Apply error boundary to routes
const GamePageWithErrorBoundary = withErrorBoundary(GamePage);
const TicketPageWithErrorBoundary = withErrorBoundary(TicketPage);

export { GamePageWithErrorBoundary, TicketPageWithErrorBoundary };
export default AppRouter;
// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

const NotFound = () => {
  return (
    <MainLayout>
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        
        <p className="text-gray-600 mb-8">
          We couldn't find the page you're looking for. The page might have been moved, 
          deleted, or the URL might be incorrect.
        </p>
        
        <div className="space-y-4">
          <Link 
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Home
          </Link>
          
          <div>
            <Link 
              to="/book"
              className="inline-flex items-center justify-center mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              <svg 
                className="h-4 w-4 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
              Book a Ticket
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;

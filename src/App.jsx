// In your App.jsx, add:
import { useEffect, useState } from 'react';
import { diagnoseFirebaseConnection } from './utils/firebaseDebug';

// Inside the App component:
const [diagnosticResult, setDiagnosticResult] = useState(null);
const [isDiagnosing, setIsDiagnosing] = useState(true);

useEffect(() => {
  async function runDiagnostics() {
    const result = await diagnoseFirebaseConnection();
    setDiagnosticResult(result);
    setIsDiagnosing(false);
  }
  
  runDiagnostics();
}, []);

// Then in your render function:
if (isDiagnosing) {
  return <div>Diagnosing Firebase connection...</div>;
}

if (diagnosticResult && !diagnosticResult.success) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Firebase Connection Error
          </h2>
          <p className="text-gray-600 mb-6">
            {diagnosticResult.error}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Check your Firebase configuration and environment variables.
          </p>
          <button
            onClick={() => window.location.reload()}
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

// Continue with normal rendering if diagnostics pass

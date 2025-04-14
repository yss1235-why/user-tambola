// src/utils/firebaseDebug.js
import { db, HOST_ID, databaseUtils } from '../config/firebase';
import { ref, get } from 'firebase/database';

export async function diagnoseFirebaseConnection() {
  console.log("Starting Firebase connection diagnosis...");
  
  try {
    // Test 1: Basic Firebase configuration
    console.log("Test 1: Checking Firebase configuration...");
    if (!db) {
      console.error("Test 1 Failed: Firebase database is not initialized");
      return { 
        success: false, 
        error: "Firebase database initialization failed" 
      };
    }
    console.log("Test 1 Passed: Firebase database is initialized");
    
    // Test 2: Authentication
    console.log("Test 2: Checking authentication...");
    try {
      const currentUser = await databaseUtils.getCurrentUser();
      console.log("Test 2 Passed: Authentication working");
    } catch (error) {
      console.error("Test 2 Failed:", error.message);
      return { 
        success: false, 
        error: `Authentication error: ${error.message}`
      };
    }
    
    // Test 3: Database access
    console.log("Test 3: Testing database access...");
    try {
      // Try to read a sample location
      const snapshot = await databaseUtils.fetchData('hosts');
      
      if (snapshot === null) {
        console.warn("Test 3 Warning: No data found at 'hosts' path, but connection seems to work");
      } else {
        console.log("Test 3 Passed: Database connection successful");
      }
    } catch (error) {
      console.error("Test 3 Failed:", error.message);
      return { 
        success: false, 
        error: `Database access error: ${error.message}`
      };
    }
    
    // All tests passed or had acceptable warnings
    return { 
      success: true,
      message: "Connection diagnostics completed successfully"
    };
  } catch (error) {
    console.error("Firebase diagnosis error:", error);
    return { 
      success: false, 
      error: `Diagnosis error: ${error.message}`,
      code: error.code || 'unknown'
    };
  }
}

export default { diagnoseFirebaseConnection };

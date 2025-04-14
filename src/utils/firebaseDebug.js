// src/utils/firebaseDebug.js
import { db, HOST_ID, databaseUtils } from '../config/firebase';
import { ref, get } from 'firebase/database';
import appConfig from '../config/appConfig';

export async function diagnoseFirebaseConnection() {
  console.log("Starting Firebase connection diagnosis...");
  
  try {
    // Test 1: Check host ID configuration
    console.log(`Test 1: Checking host ID configuration (${HOST_ID})...`);
    
    if (!HOST_ID) {
      console.error("Test 1 Failed: Host ID environment variable is not set");
      return { success: false, error: "Host ID environment variable is not set" };
    }
    
    console.log("Test 1 Passed: Host ID is configured");
    
    // Test 2: Check hosts path using databaseUtils (which handles authentication)
    console.log("Test 2: Checking hosts path...");
    try {
      const hostData = await databaseUtils.fetchData(`hosts/${HOST_ID}`);
      
      if (!hostData) {
        // Check if we're in development mode and should activate demo mode
        if (import.meta.env.DEV && appConfig.firebase.demoMode?.enabled) {
          console.log("Development mode detected. Activating demo mode.");
          return { 
            success: true, 
            demoMode: true,
            message: "Running in demo mode - using sample data" 
          };
        }
        
        console.error(`Test 2 Failed: Host ID '${HOST_ID}' doesn't exist or access denied`);
        return { 
          success: false, 
          error: `Host ID '${HOST_ID}' doesn't exist or access denied`,
          demoModeAvailable: appConfig.firebase.demoMode?.enabled
        };
      }
      
      console.log("Test 2 Passed: Host data retrieved successfully");
    } catch (error) {
      // Check if we're in development mode and should activate demo mode
      if (import.meta.env.DEV && appConfig.firebase.demoMode?.enabled) {
        console.log("Development mode detected. Activating demo mode.");
        return { 
          success: true, 
          demoMode: true,
          message: "Running in demo mode - using sample data" 
        };
      }
      
      console.error("Test 2 Failed:", error.message);
      return { 
        success: false, 
        error: `Error accessing host data: ${error.message}`,
        demoModeAvailable: appConfig.firebase.demoMode?.enabled
      };
    }
    
    // Test 3: Check currentGame path
    console.log("Test 3: Checking currentGame path...");
    try {
      const gameData = await databaseUtils.fetchData(`hosts/${HOST_ID}/currentGame`);
      
      if (!gameData) {
        console.error("Test 3 Failed: 'currentGame' path doesn't exist or access denied");
        
        // Check if we're in development mode and should activate demo mode
        if (import.meta.env.DEV && appConfig.firebase.demoMode?.enabled) {
          console.log("No current game found. Activating demo mode.");
          return { 
            success: true, 
            demoMode: true,
            message: "No active game found - using sample data" 
          };
        }
        
        return { 
          success: false, 
          error: "Current game data not found or access denied",
          demoModeAvailable: appConfig.firebase.demoMode?.enabled
        };
      }
      
      console.log("Test 3 Passed: Current game data retrieved successfully");
      
      // All tests passed
      return { success: true, data: gameData };
    } catch (error) {
      // Check if we're in development mode and should activate demo mode
      if (import.meta.env.DEV && appConfig.firebase.demoMode?.enabled) {
        console.log("Error fetching current game. Activating demo mode.");
        return { 
          success: true, 
          demoMode: true,
          message: "Error fetching game data - using sample data" 
        };
      }
      
      console.error("Test 3 Failed:", error.message);
      return { 
        success: false, 
        error: `Error accessing game data: ${error.message}`,
        demoModeAvailable: appConfig.firebase.demoMode?.enabled
      };
    }
    
  } catch (error) {
    console.error("Firebase diagnosis error:", error);
    
    // Check if we're in development mode and should activate demo mode
    if (import.meta.env.DEV && appConfig.firebase.demoMode?.enabled) {
      console.log("Error during diagnosis. Activating demo mode.");
      return { 
        success: true, 
        demoMode: true,
        message: "Firebase diagnosis error - using sample data" 
      };
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code || 'unknown',
      demoModeAvailable: appConfig.firebase.demoMode?.enabled
    };
  }
}

export default { diagnoseFirebaseConnection };

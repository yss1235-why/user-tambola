// src/utils/firebaseDebug.js
import { db } from '../config/firebase';
import { ref, get } from 'firebase/database';

export async function diagnoseFirebaseConnection() {
  console.log("Starting Firebase connection diagnosis...");
  
  try {
    // Test 1: Check root connection
    console.log("Test 1: Checking root connection...");
    const rootRef = ref(db, '/');
    const rootSnapshot = await get(rootRef);
    
    if (!rootSnapshot.exists()) {
      console.error("Test 1 Failed: Could not connect to database root");
      return { success: false, error: "Cannot connect to database root" };
    }
    
    console.log("Test 1 Passed: Successfully connected to database root");
    
    // Test 2: Check hosts path
    console.log("Test 2: Checking hosts path...");
    const hostsRef = ref(db, 'hosts');
    const hostsSnapshot = await get(hostsRef);
    
    if (!hostsSnapshot.exists()) {
      console.error("Test 2 Failed: 'hosts' path doesn't exist");
      return { success: false, error: "Hosts path doesn't exist" };
    }
    
    console.log("Test 2 Passed: Hosts path exists");
    
    // Test 3: Check host ID
    const hostId = import.meta.env.VITE_FIREBASE_HOST_ID;
    console.log(`Test 3: Checking host ID (${hostId})...`);
    
    if (!hostId) {
      console.error("Test 3 Failed: Host ID environment variable is not set");
      return { success: false, error: "Host ID environment variable is not set" };
    }
    
    const hostRef = ref(db, `hosts/${hostId}`);
    const hostSnapshot = await get(hostRef);
    
    if (!hostSnapshot.exists()) {
      console.error(`Test 3 Failed: Host ID '${hostId}' doesn't exist`);
      return { success: false, error: `Host ID '${hostId}' doesn't exist` };
    }
    
    console.log("Test 3 Passed: Host ID exists");
    
    // Test 4: Check currentGame path
    console.log("Test 4: Checking currentGame path...");
    const gameRef = ref(db, `hosts/${hostId}/currentGame`);
    const gameSnapshot = await get(gameRef);
    
    if (!gameSnapshot.exists()) {
      console.error("Test 4 Failed: 'currentGame' path doesn't exist");
      return { success: false, error: "Current game path doesn't exist" };
    }
    
    console.log("Test 4 Passed: Current game path exists");
    
    // All tests passed
    return { success: true, data: gameSnapshot.val() };
    
  } catch (error) {
    console.error("Firebase diagnosis error:", error);
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
}

export default { diagnoseFirebaseConnection };

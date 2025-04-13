// src/config/appConfig.js
const appConfig = {
  // Firebase/Host Configuration
  firebase: {
    hostId: "SMRyGxVTVRcDOcvi9wtfO8rzkjf1", // Change this to use a different host ID
    apiKey: "AIzaSyCH2WtQ2y3ln8ToHcapIsEMIXJ78Hsg7Bg",
    authDomain: "tambola-74046.firebaseapp.com",
    databaseURL: "https://tambola-74046-default-rtdb.firebaseio.com",
    projectId: "tambola-74046",
    storageBucket: "tambola-74046.firebasestorage.app",
    messagingSenderId: "310265084192",
    appId: "1:310265084192:web:c044bf9b83c444f4a2ff45",
    measurementId: "G-MP72F136BH"
  },
  
  // Application Text Configuration
  appText: {
    websiteTitle: "Tambola Game", // Website title (shows in browser tab)
    appName: "Tambola", // App name (shown in header)
    loadingText: "Loading Tambola Game...", // Loading screen text
    
    // Game phase text
    phaseText: {
      setup: "Game Setup",
      booking: "Booking Open",
      playing: "Game in Progress",
      noGame: "No Active Game"
    },
    
    // Footer text
    footerText: {
      copyright: `© ${new Date().getFullYear()} Tambola Game. All rights reserved.`,
      refreshButton: "Refresh Game"
    }
  },
  
  // Game Constants
  gameConstants: {
    phases: {
      SETUP: 1,
      BOOKING: 2,
      PLAYING: 3
    },
    status: {
      ACTIVE: 'active',
      ENDED: 'ended',
      CANCELLED: 'cancelled'
    }
  },
  
  // Prize Configuration 
  prizeConfig: {
    quickFive: { 
      label: 'Quick Five',
      description: 'First to mark any 5 numbers',
      icon: '5️⃣',
      order: 1 
    },
    topLine: { 
      label: 'Top Line',
      description: 'Complete the first line',
      icon: '⬆️',
      order: 2 
    },
    middleLine: { 
      label: 'Middle Line',
      description: 'Complete the middle line',
      icon: '➡️',
      order: 3 
    },
    bottomLine: { 
      label: 'Bottom Line',
      description: 'Complete the bottom line',
      icon: '⬇️',
      order: 4 
    },
    corners: { 
      label: 'Corners',
      description: 'Mark all four corners',
      icon: '🎯',
      order: 5 
    },
    fullHouse: { 
      label: 'Full House',
      description: 'Complete the entire ticket',
      icon: '👑',
      order: 6 
    },
    secondFullHouse: { 
      label: 'Second Full House',
      description: 'Second player to complete the entire ticket',
      icon: '🥈',
      order: 7 
    },
    starCorners: { 
      label: 'Star Corners',
      description: 'Mark the star pattern corners',
      icon: '⭐',
      order: 8 
    },
    fullSheet: { 
      label: 'Full Sheet',
      description: 'Complete all tickets in a sheet',
      icon: '📃',
      order: 9 
    },
    halfSheet: { 
      label: 'Half Sheet',
      description: 'Complete half of the tickets in a sheet',
      icon: '📄',
      order: 10 
    }
  }
};

export default appConfig;
// src/utils/enhancedWinnersAudio.js
/**
 * Enhanced winner announcement audio system that combines sound effects
 * with speech synthesis for more engaging announcements
 */

class EnhancedWinnersAudioManager {
  constructor() {
    this.initialized = false;
    this.isMuted = false;
    this.announcementQueue = [];
    this.isProcessing = false;
    this.lastAnnouncedWinner = null;
    this.soundEffectsEnabled = true;
    this.volume = 0.7;

    // Sound effects
    this.sounds = {
      win: new Audio(),
      jackpot: new Audio(),
      fanfare: new Audio(),
      applause: new Audio()
    };

    // TTS Configuration
    this.ttsVoice = null;
    this.ttsLanguage = 'en-US';

    // Prize-specific configurations with enhanced messaging
    this.prizeAnnouncements = {
      quickFive: {
        messages: [
          "Congratulations! We have a Quick Five winner!",
          "Quick Five completed! Amazing job!",
          "First milestone reached! Quick Five winner!"
        ],
        sound: 'fanfare',
        priority: 1,
        delay: 1000 // Delay TTS after sound effect
      },
      topLine: {
        messages: [
          "Top line completed! What a play!",
          "First line winner! Brilliant play!",
          "Top row complete! Excellent work!"
        ],
        sound: 'win',
        priority: 2,
        delay: 800
      },
      middleLine: {
        messages: [
          "Middle line winner! Great strategy!",
          "Center line complete! Well done!",
          "Middle row finished! Fantastic!"
        ],
        sound: 'win',
        priority: 2,
        delay: 800
      },
      bottomLine: {
        messages: [
          "Bottom line completed! Superb play!",
          "Third line winner! Excellent marking!",
          "Bottom row complete! Wonderful job!"
        ],
        sound: 'win',
        priority: 2,
        delay: 800
      },
      corners: {
        messages: [
          "Corners pattern complete! Strategic genius!",
          "Four corners marked! Great pattern play!",
          "Corner to corner winner! Well played!"
        ],
        sound: 'win',
        priority: 3,
        delay: 800
      },
      fullHouse: {
        messages: [
          "Full house winner! What an achievement!",
          "We have a houseful! Incredible play!",
          "Grand prize winner! Full house complete!"
        ],
        sound: 'jackpot',
        priority: 4,
        delay: 1200
      },
      secondFullHouse: {
        messages: [
          "Second full house winner! Amazing comeback!",
          "Another houseful! Spectacular play!",
          "Second grand prize claimed! Outstanding!"
        ],
        sound: 'jackpot',
        priority: 4,
        delay: 1200
      },
      starCorners: {
        messages: [
          "Star pattern complete! Creative genius!",
          "Star formation winner! Brilliant strategy!",
          "Star corners marked! What precision!"
        ],
        sound: 'fanfare',
        priority: 3,
        delay: 1000
      },
      fullSheet: {
        messages: [
          "Full sheet winner! Legendary achievement!",
          "All tickets complete! Master of Tambola!",
          "Full sheet conquered! Phenomenal play!"
        ],
        sound: 'jackpot',
        priority: 5,
        delay: 1200
      },
      halfSheet: {
        messages: [
          "Half sheet complete! Impressive achievement!",
          "Half the tickets conquered! Great progress!",
          "Half sheet winner! Excellent play!"
        ],
        sound: 'applause',
        priority: 4,
        delay: 1000
      }
    };
  }

  initialize() {
    if (this.initialized) return true;

    try {
      // Set up sound file paths
      this.sounds.win.src = '/sounds/win.mp3';
      this.sounds.jackpot.src = '/sounds/jackpot.mp3';
      this.sounds.fanfare.src = '/sounds/fanfare.mp3';
      this.sounds.applause.src = '/sounds/applause.mp3';
      
      // Preload sounds
      Object.values(this.sounds).forEach(sound => {
        sound.load();
        sound.volume = this.volume;
      });
      
      // Initialize Text-to-Speech
      if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {
          const voices = speechSynthesis.getVoices();
          // Try to find a good English voice - preferring female voices if available
          this.ttsVoice = voices.find(voice => 
            voice.name.includes('Female') && voice.lang === this.ttsLanguage
          ) || voices.find(voice => 
            voice.lang === this.ttsLanguage
          ) || voices[0];
        };
        
        // Initial voice loading
        if (speechSynthesis.getVoices().length > 0) {
          const voices = speechSynthesis.getVoices();
          this.ttsVoice = voices.find(voice => 
            voice.name.includes('Female') && voice.lang === this.ttsLanguage
          ) || voices.find(voice => 
            voice.lang === this.ttsLanguage
          ) || voices[0];
        }
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize enhanced winners audio system:', error);
      return false;
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.clearAnnouncements();
      Object.values(this.sounds).forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
      });
    }
  }

  setSoundEffectsEnabled(enabled) {
    this.soundEffectsEnabled = enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });
  }

  clearAnnouncements() {
    this.announcementQueue = [];
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    Object.values(this.sounds).forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  async processAnnouncementQueue() {
    if (this.isProcessing || this.announcementQueue.length === 0) return;

    this.isProcessing = true;
    
    // Sort queue by priority
    this.announcementQueue.sort((a, b) => b.priority - a.priority);

    while (this.announcementQueue.length > 0) {
      const announcement = this.announcementQueue.shift();
      await this.playAnnouncement(announcement);
    }
    
    this.isProcessing = false;
  }

  async playAnnouncement(announcement) {
    return new Promise((resolve) => {
      if (this.isMuted) {
        resolve();
        return;
      }

      // Play sound effect if enabled
      if (this.soundEffectsEnabled && announcement.sound) {
        const sound = this.sounds[announcement.sound];
        if (sound) {
          sound.currentTime = 0;
          sound.play().catch(err => console.error('Error playing sound:', err));
        }
      }

      // Delay before starting TTS (gives sound effect time to shine)
      setTimeout(() => {
        // Play TTS announcement
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(announcement.message);
          utterance.voice = this.ttsVoice;
          utterance.lang = this.ttsLanguage;
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          utterance.volume = this.volume;

          utterance.onend = () => {
            setTimeout(resolve, 500); // Add slight delay between announcements
          };

          utterance.onerror = () => {
            console.error('TTS Error for announcement:', announcement);
            resolve();
          };

          speechSynthesis.speak(utterance);
        } else {
          resolve();
        }
      }, announcement.delay || 0);
    });
  }

  announceWinner(prizeType, winnerDetails) {
    if (this.isMuted || !prizeType) return;

    // Initialize if not already done
    if (!this.initialized) {
      this.initialize();
    }

    const prizeConfig = this.prizeAnnouncements[prizeType];
    if (!prizeConfig) return;

    // Avoid repeating the same winner announcement
    const winnerKey = `${prizeType}-${winnerDetails.ticketId}`;
    if (winnerKey === this.lastAnnouncedWinner) return;
    this.lastAnnouncedWinner = winnerKey;

    // Get random message for variety
    const messages = prizeConfig.messages || ["Prize has been won!"];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Format message with winner details
    let formattedMessage = this.formatWinnerMessage(randomMessage, winnerDetails);

    // Add to queue
    const announcement = {
      message: formattedMessage,
      sound: prizeConfig.sound || 'win',
      priority: prizeConfig.priority || 1,
      delay: prizeConfig.delay || 0
    };

    this.announcementQueue.push(announcement);
    this.processAnnouncementQueue();
  }

  formatWinnerMessage(baseMessage, winnerDetails) {
    if (winnerDetails.playerName) {
      return `${baseMessage} ${winnerDetails.playerName} with ticket number ${winnerDetails.ticketId}!`;
    }
    return `${baseMessage} Ticket number ${winnerDetails.ticketId}!`;
  }
}

// Create singleton instance
const enhancedWinnersAudio = new EnhancedWinnersAudioManager();

// Initialize audio on first user interaction
const initializeEnhancedWinnersAudio = () => {
  const result = enhancedWinnersAudio.initialize();
  if (!result) {
    console.warn('Enhanced winners audio initialization failed. Announcements may be unavailable.');
  }
  return result;
};

// Export public functions
export const announceWinner = (prizeType, winnerDetails) => {
  if (!prizeType || !winnerDetails) return;
  enhancedWinnersAudio.announceWinner(prizeType, winnerDetails);
};

export const setWinnersAudioMuted = (muted) => {
  enhancedWinnersAudio.setMuted(muted);
};

export const setSoundEffectsEnabled = (enabled) => {
  enhancedWinnersAudio.setSoundEffectsEnabled(enabled);
};

export const setWinnersAudioVolume = (volume) => {
  enhancedWinnersAudio.setVolume(volume);
};

export const isWinnersAudioMuted = () => enhancedWinnersAudio.isMuted;

// Event listeners for initialization
window.addEventListener('click', initializeEnhancedWinnersAudio, { once: true });
window.addEventListener('touchstart', initializeEnhancedWinnersAudio, { once: true });

export default {
  announceWinner,
  setWinnersAudioMuted,
  setSoundEffectsEnabled,
  setWinnersAudioVolume,
  isWinnersAudioMuted,
  initializeEnhancedWinnersAudio,
};

// src/utils/winnersAudio.js

class WinnersAudioManager {
  constructor() {
    this.context = null;
    this.initialized = false;
    this.isMuted = false;
    this.announcementQueue = [];
    this.isProcessing = false;
    this.lastAnnouncedWinner = null;

    // TTS Configuration
    this.ttsVoice = null;
    this.ttsLanguage = 'en-US';

    // Prize-specific configurations
    this.prizeAnnouncements = {
      quickFive: {
        message: "Congratulations! Quick five winner!",
        priority: 1
      },
      topLine: {
        message: "Top line completed! Congratulations to the winner!",
        priority: 2
      },
      middleLine: {
        message: "Middle line winner! Well done!",
        priority: 2
      },
      bottomLine: {
        message: "Bottom line completed! Congratulations!",
        priority: 2
      },
      corners: {
        message: "Corners completed! Great job!",
        priority: 3
      },
      fullHouse: {
        message: "Full house winner! Congratulations on the grand prize!",
        priority: 4
      },
      secondFullHouse: {
        message: "Second full house winner! Amazing achievement!",
        priority: 4
      }
    };
  }

  initialize() {
    if (this.initialized) return true;

    try {
      // Initialize Web Audio API
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      
      // Initialize Text-to-Speech
      if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {
          const voices = speechSynthesis.getVoices();
          this.ttsVoice = voices.find(voice => voice.lang === this.ttsLanguage) || voices[0];
        };
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize winners audio system:', error);
      return false;
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.clearAnnouncements();
    }
  }

  clearAnnouncements() {
    this.announcementQueue = [];
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
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

      const utterance = new SpeechSynthesisUtterance(announcement.message);
      utterance.voice = this.ttsVoice;
      utterance.lang = this.ttsLanguage;
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setTimeout(resolve, 500); // Add slight delay between announcements
      };

      utterance.onerror = () => {
        console.error('TTS Error for announcement:', announcement);
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  }

  announceWinner(prizeType, winnerDetails) {
    if (this.isMuted) return;

    const prizeConfig = this.prizeAnnouncements[prizeType];
    if (!prizeConfig) return;

    const winnerKey = `${prizeType}-${winnerDetails.ticketId}`;
    if (winnerKey === this.lastAnnouncedWinner) return;

    this.lastAnnouncedWinner = winnerKey;

    const announcement = {
      message: this.formatWinnerMessage(prizeConfig.message, winnerDetails),
      priority: prizeConfig.priority
    };

    this.announcementQueue.push(announcement);
    this.processAnnouncementQueue();
  }

  formatWinnerMessage(baseMessage, winnerDetails) {
    if (winnerDetails.playerName) {
      return `${baseMessage} ${winnerDetails.playerName} with ticket number ${winnerDetails.ticketId}`;
    }
    return `${baseMessage} Ticket number ${winnerDetails.ticketId}`;
  }

  resume() {
    if (this.context?.state === 'suspended') {
      this.context.resume();
    }
  }
}

// Create singleton instance
const winnersAudioManager = new WinnersAudioManager();

// Initialize audio on first user interaction
const initializeWinnersAudio = () => {
  const result = winnersAudioManager.initialize();
  if (!result) {
    console.warn('Winners audio initialization failed. Announcements may be unavailable.');
  }
  return result;
};

// Export public functions
export const announceWinner = (prizeType, winnerDetails) => {
  if (!prizeType || !winnerDetails) return;
  winnersAudioManager.announceWinner(prizeType, winnerDetails);
};

export const setWinnersAudioMuted = (muted) => {
  winnersAudioManager.setMuted(muted);
};

export const isWinnersAudioMuted = () => winnersAudioManager.isMuted;

// Event listeners for initialization
window.addEventListener('click', initializeWinnersAudio, { once: true });
window.addEventListener('touchstart', initializeWinnersAudio, { once: true });

export default {
  announceWinner,
  setWinnersAudioMuted,
  isWinnersAudioMuted,
  initializeWinnersAudio,
};
// src/utils/audio.js

// Tambola calling phrases mapping
const TAMBOLA_CALLS = {
  1: "Kelly's Eyes! Number 1",
  2: "One Little Duck! Number 2",
  3: "Cup of Tea! Number 3",
  4: "Knock at the Door! Number 4",
  5: "Man Alive! Number 5",
  6: "Half a Dozen! Number 6",
  7: "Lucky Seven! Number 7",
  8: "One Fat Lady! Number 8",
  9: "Doctor's Orders! Number 9",
  10: "Uncle Ben! Number 10",
  11: "Legs Eleven! Number 11",
  12: "One Dozen! Number 12",
  13: "Unlucky for Some! Number 13",
  14: "Valentine's Day! Number 14",
  15: "Young and Keen! Number 15",
  16: "Sweet Sixteen! Number 16",
  17: "Dancing Queen! Number 17",
  18: "Now You Can Vote! Number 18",
  19: "Goodbye Teens! Number 19",
  20: "One Score! Number 20",
  21: "Key of the Door! Number 21",
  22: "Two Little Ducks! Number 22",
  23: "Thee and Me! Number 23",
  24: "Two Dozen! Number 24",
  25: "Quarter Century! Number 25",
  26: "Pick and Mix! Number 26",
  27: "Duck and a Crutch! Number 27",
  28: "Overweight! Number 28",
  29: "Rise and Shine! Number 29",
  30: "Dirty Thirty! Number 30",
  31: "Get Up and Run! Number 31",
  32: "Buckle My Shoe! Number 32",
  33: "All the Threes! Number 33",
  34: "Ask for More! Number 34",
  35: "Jump and Jive! Number 35",
  36: "Three Dozen! Number 36",
  37: "A Flea in Heaven! Number 37",
  38: "Christmas Cake! Number 38",
  39: "Steps and Climb! Number 39",
  40: "Life Begins! Number 40",
  41: "Time for Fun! Number 41",
  42: "Winnie the Pooh! Number 42",
  43: "Down on Your Knees! Number 43",
  44: "Droopy Drawers! Number 44",
  45: "Halfway There! Number 45",
  46: "Up to Tricks! Number 46",
  47: "Four and Seven! Number 47",
  48: "Four Dozen! Number 48",
  49: "Rise and Shine! Number 49",
  50: "Half a Century! Number 50",
  51: "Tweak of the Thumb! Number 51",
  52: "Weeks in a Year! Number 52",
  53: "Here Comes Herbie! Number 53",
  54: "Clean the Floor! Number 54",
  55: "Snakes Alive! Number 55",
  56: "Was She Worth It? Number 56",
  57: "Heinz Varieties! Number 57",
  58: "Make Them Wait! Number 58",
  59: "Brighton Line! Number 59",
  60: "Five Dozen! Number 60",
  61: "Baker's Bun! Number 61",
  62: "Turn on the Screw! Number 62",
  63: "Tickle Me! Number 63",
  64: "Red Raw! Number 64",
  65: "Old Age Pension! Number 65",
  66: "Clickety Click! Number 66",
  67: "Stairway to Heaven! Number 67",
  68: "Saving Grace! Number 68",
  69: "Either Way Up! Number 69",
  70: "Three Score and Ten! Number 70",
  71: "Bang on the Drum! Number 71",
  72: "Six Dozen! Number 72",
  73: "Queen Bee! Number 73",
  74: "Candy Store! Number 74",
  75: "Strive and Strive! Number 75",
  76: "Trombones! Number 76",
  77: "Sunset Strip! Number 77",
  78: "Heaven's Gate! Number 78",
  79: "One More Time! Number 79",
  80: "Gandhi's Breakfast! Number 80",
  81: "Stop and Run! Number 81",
  82: "Fat Lady Sings! Number 82",
  83: "Time for Tea! Number 83",
  84: "Seven Dozen! Number 84",
  85: "Staying Alive! Number 85",
  86: "Between the Sticks! Number 86",
  87: "Torquay in Devon! Number 87",
  88: "Two Fat Ladies! Number 88",
  89: "Nearly There! Number 89",
  90: "Top of the Shop! Number 90"
};

// Prize announcement phrases
const PRIZE_ANNOUNCEMENTS = {
  quickFive: [
    "Quick Five correct and gone!",
    "First five numbers claimed!",
    "Quick Five has been won!",
    "Early bird gets the Quick Five!",
    "Quick Five is off the board!"
  ],
  topLine: [
    "Top Line correct and gone!",
    "First line complete!",
    "Top Line has been won!",
    "Top Row claimed and completed!",
    "First line is off the board!"
  ],
  middleLine: [
    "Middle Line correct and gone!",
    "Center row complete!",
    "Middle Line has been won!",
    "Middle row claimed and completed!",
    "Center line is off the board!"
  ],
  bottomLine: [
    "Bottom Line correct and gone!",
    "Last row complete!",
    "Bottom Line has been won!",
    "Bottom row claimed and completed!",
    "Third line is off the board!"
  ],
  corners: [
    "Four Corners correct and gone!",
    "All corners complete!",
    "Corner to corner has been won!",
    "Four corners claimed and completed!",
    "The corners are off the board!"
  ],
  starCorners: [
    "Star Pattern correct and gone!",
    "Star formation complete!",
    "The star has been won!",
    "Star pattern claimed and completed!",
    "The star is off the board!"
  ],
  fullHouse: [
    "Full House correct and gone!",
    "We have a houseful!",
    "Full House has been won!",
    "Complete ticket claimed and completed!",
    "Full House is off the board!"
  ],
  secondFullHouse: [
    "Second Full House correct and gone!",
    "Another houseful!",
    "Second Full House has been won!",
    "Another complete ticket claimed!",
    "Second Full House is off the board!"
  ],
  halfSheet: [
    "Half Sheet correct and gone!",
    "Half the tickets complete!",
    "Half Sheet has been won!",
    "Half Sheet claimed and completed!",
    "Half Sheet is off the board!"
  ],
  fullSheet: [
    "Full Sheet correct and gone!",
    "All tickets complete!",
    "Full Sheet has been won!",
    "Full Sheet claimed and completed!",
    "The whole Sheet is off the board!"
  ]
};

class AudioManager {
  constructor() {
    this.initialized = false;
    this.isMuted = false;
    this.lastAnnouncedNumber = null;
    this.lastAnnouncedPrize = null;
    this.announcementQueue = [];
    this.isProcessing = false;
    this.synth = window.speechSynthesis;
    this.voices = [];
  }

  initialize() {
    if (this.initialized) return true;

    try {
      if (!this.synth) {
        console.error('Speech synthesis not supported');
        return false;
      }

      // Initialize voices
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = this.loadVoices.bind(this);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize audio systems:', error);
      return false;
    }
  }

  loadVoices() {
    this.voices = this.synth.getVoices();
    // Prefer an English voice
    this.selectedVoice = this.voices.find(voice => 
      voice.lang.startsWith('en-') && !voice.localService
    ) || this.voices.find(voice => voice.lang.startsWith('en-')) || this.voices[0];
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
      this.announcementQueue = [];
    }
  }

  async queueAnnouncement(text, priority = 1) {
    if (this.isMuted || !text) return;

    this.announcementQueue.push({ text, priority });
    this.announcementQueue.sort((a, b) => b.priority - a.priority);
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  async processQueue() {
    if (this.isProcessing || this.announcementQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.announcementQueue.length > 0) {
        const announcement = this.announcementQueue.shift();
        await this.speak(announcement.text);
        // Add delay between announcements
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async speak(text) {
    return new Promise((resolve) => {
      if (!this.synth || this.isMuted) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure utterance
      utterance.voice = this.selectedVoice;
      utterance.rate = 0.9;  // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      // Handle completion
      utterance.onend = () => {
        resolve();
      };

      // Handle errors
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        resolve();
      };

      // Speak the text
      this.synth.speak(utterance);
    });
  }

  announceNumber(number) {
    if (this.isMuted || !number || number === this.lastAnnouncedNumber) return;

    this.lastAnnouncedNumber = number;
    const text = TAMBOLA_CALLS[number] || `Number ${number}`;
    this.queueAnnouncement(text, 2);
  }

  announcePrize(prizeType, playerName) {
    if (this.isMuted || !prizeType) return;
    
    // Avoid repeating the same prize announcement
    const prizeKey = `${prizeType}-${playerName}`;
    if (prizeKey === this.lastAnnouncedPrize) return;
    this.lastAnnouncedPrize = prizeKey;

    // Select a random announcement for variety
    const announcements = PRIZE_ANNOUNCEMENTS[prizeType] || ["Prize has been won!"];
    const randomIndex = Math.floor(Math.random() * announcements.length);
    let announcement = announcements[randomIndex];
    
    // Add player name if available
    if (playerName) {
      announcement += ` Congratulations to ${playerName}!`;
    }

    // Queue with high priority
    this.queueAnnouncement(announcement, 3);
  }
}

// Create singleton instance
const audioManager = new AudioManager();

// Initialize audio on first user interaction
const initializeAudio = () => {
  const result = audioManager.initialize();
  if (!result) {
    console.warn('Audio initialization failed. Voice announcements may be unavailable.');
  }
};

// Export public functions
export const announceNumber = (number) => {
  audioManager.announceNumber(number);
};

export const announcePrize = (prizeType, playerName) => {
  audioManager.announcePrize(prizeType, playerName);
};

export const speak = (text) => {
  audioManager.queueAnnouncement(text, 1);
};

export const setMuted = (muted) => {
  audioManager.setMuted(muted);
};

export const isMuted = () => audioManager.isMuted;

// Initialize on user interaction
window.addEventListener('click', initializeAudio, { once: true });
window.addEventListener('touchstart', initializeAudio, { once: true });

export default {
  announceNumber,
  announcePrize,
  speak,
  setMuted,
  isMuted,
};
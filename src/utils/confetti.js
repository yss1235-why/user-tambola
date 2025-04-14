// src/utils/confetti.js
/**
 * Simple confetti animation utility for winner celebrations
 */

class ConfettiManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.isActive = false;
  }

  initialize() {
    // Create canvas element if it doesn't exist
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.style.zIndex = '9999';
      this.ctx = this.canvas.getContext('2d');
      document.body.appendChild(this.canvas);
    }
    
    // Set canvas size
    this.resizeCanvas();
    
    // Add resize event listener
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start(options = {}) {
    if (this.isActive) return;
    this.isActive = true;
    
    // Initialize if needed
    if (!this.canvas) {
      this.initialize();
    }
    
    // Default options
    const defaultOptions = {
      particleCount: 150,
      spread: 50,
      startVelocity: 30,
      gravity: 0.5,
      colors: ['#FF577F', '#FF884B', '#FFD384', '#FFF9B0', '#A6D1E6', '#7F5283']
    };
    
    const config = { ...defaultOptions, ...options };
    
    // Create particles
    this.particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        radius: Math.random() * 4 + 1,
        velocity: {
          x: Math.random() * 2 - 1,
          y: Math.random() * config.startVelocity
        },
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 5 - 2.5,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
      });
    }
    
    // Start animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.update();
  }

  update() {
    if (!this.isActive || !this.canvas) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update and draw particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      // Update position
      p.velocity.y += 0.1; // gravity
      p.x += p.velocity.x;
      p.y += p.velocity.y;
      p.rotation += p.rotationSpeed;
      
      // Draw particle
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      
      if (p.shape === 'circle') {
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      } else {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation * Math.PI / 180);
        this.ctx.rect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        this.ctx.restore();
      }
      
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    // Check if all particles are off screen
    const stillActive = this.particles.some(p => p.y < this.canvas.height);
    
    if (stillActive) {
      this.animationId = requestAnimationFrame(this.update.bind(this));
    } else {
      this.isActive = false;
      if (this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  cleanup() {
    this.stop();
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }
}

// Create singleton instance
const confetti = new ConfettiManager();

export default confetti;

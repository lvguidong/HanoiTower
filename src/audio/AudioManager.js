export class AudioManager {
  constructor() {
    this.ctx = null;
    this.bgmEnabled = true;
    this.bgmTimeout = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPickup() {
    if (!this.ctx) return;
    this._tone(400, 800, 0.15, 'sine', 0.3);
  }

  playPlace() {
    if (!this.ctx) return;
    this._tone(600, 300, 0.08, 'sine', 0.3);
  }

  playInvalid() {
    if (!this.ctx) return;
    this._tone(150, 150, 0.2, 'square', 0.15);
  }

  playVictory() {
    if (!this.ctx) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this._tone(freq, freq, 0.25, 'sine', 0.3), i * 120);
    });
  }

  startBGM() {
    if (!this.ctx || !this.bgmEnabled) return;
    this._playBGMSequence();
  }

  stopBGM() {
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
    return this.bgmEnabled;
  }

  _tone(startFreq, endFreq, duration, type, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    if (startFreq !== endFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _playBGMSequence() {
    if (!this.ctx || !this.bgmEnabled) return;
    const now = this.ctx.currentTime;

    // Light arpeggiated pattern — lo-fi study vibe
    // C major 7 chord: C4-E4-G4-B4
    const pattern = [
      { freq: 261, dur: 0.4 }, { freq: 329, dur: 0.4 },
      { freq: 392, dur: 0.4 }, { freq: 494, dur: 0.4 },
      { freq: 392, dur: 0.4 }, { freq: 329, dur: 0.4 },
      { freq: 261, dur: 0.4 }, { freq: 196, dur: 0.4 },

      { freq: 349, dur: 0.4 }, { freq: 440, dur: 0.4 },
      { freq: 523, dur: 0.4 }, { freq: 659, dur: 0.4 },
      { freq: 523, dur: 0.4 }, { freq: 440, dur: 0.4 },
      { freq: 349, dur: 0.4 }, { freq: 261, dur: 0.4 },

      { freq: 293, dur: 0.4 }, { freq: 369, dur: 0.4 },
      { freq: 440, dur: 0.4 }, { freq: 554, dur: 0.4 },
      { freq: 440, dur: 0.4 }, { freq: 369, dur: 0.4 },
      { freq: 293, dur: 0.4 }, { freq: 220, dur: 0.4 },

      { freq: 261, dur: 0.4 }, { freq: 329, dur: 0.4 },
      { freq: 392, dur: 0.4 }, { freq: 523, dur: 0.8 },
      { freq: 0,     dur: 0.4 }, { freq: 329, dur: 0.4 },
      { freq: 261, dur: 0.8 }, { freq: 0,     dur: 0.4 },
    ];

    let time = now + 0.05;
    const stepDur = 0.5; // 120 BPM feel
    pattern.forEach((note) => {
      if (note.freq > 0) {
        this._pluck(note.freq, time, note.dur);
      }
      time += stepDur;
    });

    const totalDuration = pattern.length * stepDur * 1000;
    this.bgmTimeout = setTimeout(() => this._playBGMSequence(), totalDuration);
  }

  _pluck(freq, startTime, duration) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.06, startTime + 0.02);
    gain.gain.linearRampToValueAtTime(0.03, startTime + duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, startTime);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }
}

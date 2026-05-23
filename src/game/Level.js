import { getMaxUnlockedLevel, unlockLevel } from '../utils/storage.js';

export class Level {
  constructor() {
    this.current = getMaxUnlockedLevel();
  }

  getDiskCount() {
    return this.current + 2; // Level 1 = 3 disks
  }

  getMinMoves() {
    return Math.pow(2, this.getDiskCount()) - 1;
  }

  advance() {
    this.current++;
    unlockLevel(this.current);
  }

  getMaxUnlocked() {
    return getMaxUnlockedLevel();
  }

  setLevel(level) {
    if (level >= 1 && level <= this.getMaxUnlocked()) {
      this.current = level;
    }
  }
}

import { isValidMove } from './rules.js';
import { Level } from './Level.js';

export class Game {
  constructor() {
    this.level = new Level();
    this.towers = [[], [], []];
    this.moveCount = 0;
    this.history = [];
    this.selectedTower = null;
    this.isAnimating = false;
    this.onStateChange = null;
    this.onVictory = null;
  }

  init() {
    const diskCount = this.level.getDiskCount();
    this.towers = [
      Array.from({ length: diskCount }, (_, i) => diskCount - i),
      [],
      [],
    ];
    this.moveCount = 0;
    this.history = [];
    this.selectedTower = null;
    this._notifyChange();
  }

  selectTower(towerIndex) {
    if (this.isAnimating) return;
    if (this.selectedTower === towerIndex) {
      this.selectedTower = null;
    } else {
      this.selectedTower = towerIndex;
    }
    this._notifyChange();
  }

  canMove(fromIndex, toIndex) {
    if (fromIndex === toIndex) return null;
    if (fromIndex == null || this.towers[fromIndex].length === 0) return null;
    const source = this.towers[fromIndex];
    const target = this.towers[toIndex];
    if (!isValidMove(source, target)) return 'invalid';
    return source[source.length - 1];
  }

  moveToTower(targetIndex) {
    return this._doMove(targetIndex);
  }

  _doMove(targetIndex) {
    if (this.isAnimating || this.selectedTower === null) return false;
    if (this.selectedTower === targetIndex) {
      this.selectedTower = null;
      this._notifyChange();
      return false;
    }

    const source = this.towers[this.selectedTower];
    const target = this.towers[targetIndex];

    if (!isValidMove(source, target)) {
      return 'invalid';
    }

    const disk = source.pop();
    target.push(disk);
    this.history.push({ from: this.selectedTower, to: targetIndex, disk });
    this.moveCount++;
    this.selectedTower = null;
    this._notifyChange();

    if (this._checkVictory()) {
      if (this.onVictory) this.onVictory(this.moveCount);
    }

    return true;
  }

  reset() {
    this.init();
  }

  undo() {
    if (this.history.length === 0 || this.isAnimating) return false;
    const last = this.history.pop();
    this.towers[last.to].pop();
    this.towers[last.from].push(last.disk);
    this.moveCount--;
    this._notifyChange();
    return true;
  }

  _checkVictory() {
    const diskCount = this.level.getDiskCount();
    return this.towers[2].length === diskCount;
  }

  _notifyChange() {
    if (this.onStateChange) {
      this.onStateChange({
        towers: this.towers.map((t) => [...t]),
        moveCount: this.moveCount,
        selectedTower: this.selectedTower,
        minMoves: this.level.getMinMoves(),
        diskCount: this.level.getDiskCount(),
        canUndo: this.history.length > 0,
      });
    }
  }
}

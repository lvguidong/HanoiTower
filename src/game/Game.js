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
    this.isDemoing = false;
    this.demoMoves = [];
    this.demoIndex = 0;
    this.demoTimeout = null;
    this.onStateChange = null;
    this.onVictory = null;
  }

  solve(n, from, to, aux) {
    if (n === 0) return [];
    return [
      ...this.solve(n - 1, from, aux, to),
      { from, to },
      ...this.solve(n - 1, aux, to, from),
    ];
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

  // --- Demo ---

  startDemo() {
    if (this.isDemoing) {
      this.stopDemo();
      return;
    }
    this.init();
    this.isDemoing = true;
    this.demoMoves = this.solve(this.level.getDiskCount(), 0, 2, 1);
    this.demoIndex = 0;
    this._demoStep();
  }

  stopDemo() {
    this.isDemoing = false;
    if (this.demoTimeout) {
      clearTimeout(this.demoTimeout);
      this.demoTimeout = null;
    }
    this._notifyChange();
  }

  _demoStep() {
    if (!this.isDemoing || this.demoIndex >= this.demoMoves.length) {
      this.isDemoing = false;
      if (this.onVictory) this.onVictory(this.moveCount);
      return;
    }

    const { from, to } = this.demoMoves[this.demoIndex];
    const diskSize = this.canMove(from, to);

    if (diskSize === 'invalid' || diskSize === null) {
      this.isDemoing = false;
      return;
    }

    // Highlight source
    this.selectedTower = from;
    this._notifyChange();

    // Animate move
    const state = {
      towers: this.towers.map((t) => [...t]),
      moveCount: this.moveCount,
      selectedTower: this.selectedTower,
      minMoves: this.level.getMinMoves(),
      diskCount: this.level.getDiskCount(),
      canUndo: this.history.length > 0,
    };

    this.onDemoMove?.(from, to, diskSize, state, () => {
      this._doMoveDirect(from, to);
      this.demoIndex++;
      this.demoTimeout = setTimeout(() => this._demoStep(), 600);
    });
  }

  _doMoveDirect(fromIndex, toIndex) {
    const disk = this.towers[fromIndex].pop();
    this.towers[toIndex].push(disk);
    this.history.push({ from: fromIndex, to: toIndex, disk });
    this.moveCount++;
    this.selectedTower = null;
    this._notifyChange();

    if (this._checkVictory()) {
      if (this.onVictory) this.onVictory(this.moveCount);
    }
  }
}

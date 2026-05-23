const DISK_COLORS = [
  '#ff6b6b', '#ffa64d', '#ffd93d', '#6bcb77', '#4ecdc4',
  '#4d96ff', '#9b59b6', '#ff6b9d', '#c084fc', '#fb923c',
  '#6ee7b7', '#f472b6',
];

export class Renderer {
  constructor() {
    this.towerEls = document.querySelectorAll('.tower');
    this.moveCountEl = document.getElementById('move-count');
    this.minMovesEl = document.getElementById('min-moves');
    this.timerEl = document.getElementById('timer');
    this.undoBtn = document.getElementById('btn-undo');
    this.levelSelect = document.getElementById('level-select');
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  render(state) {
    this._renderTowers(state);
    this._renderStats(state);
    this._renderUndoButton(state);
  }

  updateLevelSelect(maxLevel, currentLevel, onChange) {
    this.levelSelect.innerHTML = '';
    for (let i = 1; i <= maxLevel; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `第 ${i} 关 (${i + 2} 个圆盘)`;
      if (i === currentLevel) opt.selected = true;
      this.levelSelect.appendChild(opt);
    }
    this.levelSelect.onchange = () => onChange(parseInt(this.levelSelect.value, 10));
  }

  showVictoryModal(moveCount, minMoves, elapsed, onNextLevel) {
    const modal = document.getElementById('victory-modal');
    const message = modal.querySelector('.modal-message');
    const ratio = moveCount / minMoves;
    let rating;
    if (ratio <= 1) rating = '完美！最优步数通关！';
    else if (ratio <= 1.3) rating = '优秀！步数接近最优';
    else if (ratio <= 2) rating = '良好，继续加油！';
    else rating = '通关成功，再接再厉！';

    message.innerHTML = `
      用了 <strong>${moveCount}</strong> 步完成（最少 ${minMoves} 步）<br>
      用时 <strong>${this.formatTime(elapsed)}</strong><br>
      <span style="color: var(--accent); font-weight: 600;">${rating}</span>
    `;

    modal.classList.remove('hidden');
    document.getElementById('btn-next-level').onclick = () => {
      modal.classList.add('hidden');
      onNextLevel();
    };
  }

  hideVictoryModal() {
    document.getElementById('victory-modal').classList.add('hidden');
  }

  _renderTowers(state) {
    state.towers.forEach((disks, towerIndex) => {
      const area = this.towerEls[towerIndex].querySelector('.tower-disk-area');
      const existing = area.querySelectorAll('.disk');
      const existingCount = existing.length;

      for (let i = disks.length; i < existingCount; i++) {
        existing[i].remove();
      }

      disks.forEach((diskSize, i) => {
        let diskEl = existing[i];
        if (!diskEl) {
          diskEl = document.createElement('div');
          diskEl.className = 'disk appear';
          area.appendChild(diskEl);
        } else {
          diskEl.className = 'disk';
        }

        const minWidth = 40;
        const maxWidth = 170;
        const maxDisks = state.diskCount;
        const width = minWidth + ((maxWidth - minWidth) * (diskSize - 1)) / Math.max(maxDisks - 1, 1);

        diskEl.style.width = `${width}px`;
        const colorIdx = (diskSize - 1) % DISK_COLORS.length;
        diskEl.style.background = `linear-gradient(180deg, ${DISK_COLORS[colorIdx]}, ${DISK_COLORS[(colorIdx + 1) % DISK_COLORS.length]})`;
        diskEl.dataset.size = diskSize;
        diskEl.textContent = diskSize;

        // Top disk = smallest = last in array
        if (state.selectedTower === towerIndex && i === disks.length - 1) {
          diskEl.classList.add('selected');
        }
      });
    });
  }

  _renderStats(state) {
    this.moveCountEl.textContent = state.moveCount;
    this.minMovesEl.textContent = state.minMoves;
  }

  setTimer(seconds) {
    this.timerEl.textContent = this.formatTime(seconds);
  }

  _renderUndoButton(state) {
    this.undoBtn.disabled = !state.canUndo;
  }

  highlightInvalid(towerIndex) {
    const area = this.towerEls[towerIndex].querySelector('.tower-disk-area');
    const topDisk = area.querySelector('.disk:last-child');
    if (topDisk) {
      topDisk.classList.add('invalid');
      setTimeout(() => topDisk.classList.remove('invalid'), 400);
    }
  }

  moveDiskAnimate(fromIndex, toIndex, diskSize, state, onDone) {
    const fromArea = this.towerEls[fromIndex].querySelector('.tower-disk-area');
    const toArea = this.towerEls[toIndex].querySelector('.tower-disk-area');

    // Get the disk element to animate
    const fromDisks = fromArea.querySelectorAll('.disk');
    if (fromDisks.length === 0) { onDone(); return; }
    const diskEl = fromDisks[fromDisks.length - 1];

    const startRect = diskEl.getBoundingClientRect();

    // Create floating clone
    const clone = diskEl.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.zIndex = '1000';
    clone.style.left = startRect.left + 'px';
    clone.style.top = startRect.top + 'px';
    clone.style.margin = '0';
    clone.style.transition = 'none';
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);

    // Hide original during animation
    diskEl.style.opacity = '0';

    // Calculate target position
    const minWidth = 40;
    const maxWidth = 170;
    const maxDisks = state.diskCount;
    const width = minWidth + ((maxWidth - minWidth) * (diskSize - 1)) / Math.max(maxDisks - 1, 1);

    requestAnimationFrame(() => {
      const toRect = toArea.getBoundingClientRect();
      const baseHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--base-height')) || 20;
      const diskGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--disk-gap')) || 4;
      const diskH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--disk-height')) || 28;
      const targetDisksInArea = toArea.querySelectorAll('.disk');
      const existingCount = targetDisksInArea.length;
      const targetY = toRect.bottom - baseHeight - (existingCount + 1) * (diskH + diskGap);

      // Animate: go up then over then down
      const halfwayY = Math.min(startRect.top, targetY) - 30;
      const duration = 350;

      clone.animate([
        { left: startRect.left + 'px', top: startRect.top + 'px' },
        { left: startRect.left + 'px', top: halfwayY + 'px', offset: 0.3 },
        { left: (toRect.left + toRect.width / 2 - width / 2) + 'px', top: halfwayY + 'px', offset: 0.7 },
        { left: (toRect.left + toRect.width / 2 - width / 2) + 'px', top: targetY + 'px' },
      ], {
        duration: duration,
        easing: 'ease-in-out',
        fill: 'forwards',
      }).onfinish = () => {
        clone.remove();
        diskEl.style.opacity = '';
        onDone();
      };
    });
  }
}

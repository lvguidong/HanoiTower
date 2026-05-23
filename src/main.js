import './style.css';
import { Game } from './game/Game.js';
import { Renderer } from './ui/Renderer.js';
import { AudioManager } from './audio/AudioManager.js';

const game = new Game();
const renderer = new Renderer();
const audio = new AudioManager();

// Initialize audio on first user interaction
document.addEventListener('click', () => audio.resume(), { once: true });
document.addEventListener('touchstart', () => audio.resume(), { once: true });

// Tower click handlers
document.querySelectorAll('.tower').forEach((el) => {
  el.addEventListener('click', () => {
    if (game.isDemoing) return;

    const index = parseInt(el.dataset.tower, 10);

    if (game.selectedTower === null) {
      if (game.towers[index].length > 0) {
        game.selectTower(index);
        audio.playPickup();
      }
    } else {
      const fromIndex = game.selectedTower;
      const diskSize = game.canMove(fromIndex, index);

      if (diskSize === 'invalid') {
        audio.playInvalid();
        renderer.highlightInvalid(index);
        return;
      }
      if (diskSize === null) {
        game.selectTower(null);
        return;
      }

      // Animate the move
      const state = {
        towers: game.towers.map((t) => [...t]),
        moveCount: game.moveCount,
        selectedTower: game.selectedTower,
        minMoves: game.level.getMinMoves(),
        diskCount: game.level.getDiskCount(),
        canUndo: game.history.length > 0,
      };

      renderer.moveDiskAnimate(fromIndex, index, diskSize, state, () => {
        game._doMove(index);
        audio.playPlace();
      });
    }
  });
});

// Demo button
const demoBtn = document.getElementById('btn-demo');
demoBtn.addEventListener('click', () => {
  game.startDemo();
});

// Demo move callback — uses renderer's animation
game.onDemoMove = (from, to, diskSize, state, onDone) => {
  audio.playPickup();
  renderer.moveDiskAnimate(from, to, diskSize, state, () => {
    audio.playPlace();
    onDone();
  });
};

// Reset button
document.getElementById('btn-reset').addEventListener('click', () => {
  game.stopDemo();
  game.reset();
  renderer.hideVictoryModal();
  audio.playPickup();
});

// Undo button
document.getElementById('btn-undo').addEventListener('click', () => {
  if (game.undo()) {
    audio.playPickup();
  }
});

// BGM toggle
const bgmToggle = document.getElementById('bgm-toggle');
bgmToggle.addEventListener('click', () => {
  const enabled = audio.toggleBGM();
  bgmToggle.querySelector('.icon').textContent = enabled ? '🔊' : '🔇';
  bgmToggle.classList.toggle('muted', !enabled);
});

// State change handler
game.onStateChange = (state) => {
  renderer.render(state);
  demoBtn.querySelector('.btn-icon').textContent = game.isDemoing ? '■' : '▶';
  demoBtn.querySelector('.btn-icon').nextSibling.textContent = game.isDemoing ? ' 停止' : ' 演示';
};

// Victory handler
game.onVictory = (moveCount, elapsed) => {
  game.stopDemo();
  audio.playVictory();
  game.level.advance();
  renderer.showVictoryModal(moveCount, game.level.getMinMoves(), elapsed, () => {
    startLevel(game.level.current);
  });
};

// Timer tick handler
game.onTimerTick = (seconds) => {
  renderer.setTimer(seconds);
};

// Level select handler
renderer.updateLevelSelect(
  game.level.getMaxUnlocked(),
  game.level.current,
  (level) => {
    game.level.setLevel(level);
    startLevel(level);
  }
);

function startLevel(levelNum) {
  game.stopDemo();
  game.level.setLevel(levelNum);
  game.init();
  renderer.setTimer(0);
  renderer.updateLevelSelect(
    game.level.getMaxUnlocked(),
    game.level.current,
    (l) => {
      game.level.setLevel(l);
      startLevel(l);
    }
  );
}

// Start the game
game.init();
audio.init();
audio.startBGM();

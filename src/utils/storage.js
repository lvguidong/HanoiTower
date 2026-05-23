const STORAGE_KEY = 'hanoi-max-level';

export function getMaxUnlockedLevel() {
  const val = localStorage.getItem(STORAGE_KEY);
  return val ? parseInt(val, 10) : 1;
}

export function unlockLevel(level) {
  const current = getMaxUnlockedLevel();
  if (level > current) {
    localStorage.setItem(STORAGE_KEY, String(level));
  }
}

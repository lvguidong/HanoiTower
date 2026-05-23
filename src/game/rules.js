export function isValidMove(sourceDisks, targetDisks) {
  if (sourceDisks.length === 0) return false;
  if (targetDisks.length === 0) return true;
  return sourceDisks[sourceDisks.length - 1] < targetDisks[targetDisks.length - 1];
}

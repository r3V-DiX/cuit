// Guarantees an ad at `floor` (clamped to list length) so short lists still
// get one, then repeats every `interval` items so long lists stay sparse.
export function getGridAdPositions(itemCount: number, floor = 3, interval = 6): Set<number> {
  const positions = new Set<number>();
  if (itemCount < 1) return positions;
  const first = Math.min(floor, itemCount);
  for (let pos = first; pos <= itemCount; pos += interval) positions.add(pos);
  return positions;
}

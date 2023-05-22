interface Point {
  x: number;
  y: number;
  z?: number;
}

function calculateDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function findShortestPath(points: Point[]): {
  distance: number;
  path: Point[];
} {
  const n = points.length;
  const dp: number[][] = [];
  const prev: number[][] = [];

  for (let i = 0; i < n; i++) {
    dp[i] = [];
    prev[i] = [];
    for (let j = 0; j < 1 << n; j++) {
      dp[i][j] = Infinity;
      prev[i][j] = -1;
    }
  }

  for (let i = 0; i < n; i++) {
    dp[i][1 << i] = 0;
  }

  for (let mask = 1; mask < 1 << n; mask++) {
    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) === 0) continue;

      for (let j = 0; j < n; j++) {
        if (i === j || (mask & (1 << j)) !== 0) continue;

        const prevMask = mask | (1 << j);
        const distance = calculateDistance(points[i], points[j]);
        if (dp[i][mask] + distance < dp[j][prevMask]) {
          dp[j][prevMask] = dp[i][mask] + distance;
          prev[j][prevMask] = i;
        }
      }
    }
  }

  let minDistance = Infinity;
  let last = -1;
  for (let i = 0; i < n; i++) {
    const distance = dp[i][(1 << n) - 1];
    if (distance < minDistance) {
      minDistance = distance;
      last = i;
    }
  }

  const path = [];
  let mask = (1 << n) - 1;
  let current = last;
  while (current !== -1) {
    const prevMask = mask ^ (1 << current);
    path.push(current);
    const next = prev[current][mask];
    mask = prevMask;
    current = next;
  }

  return {
    distance: minDistance,
    path: path.reverse().map((i) => points[i]),
  };
}

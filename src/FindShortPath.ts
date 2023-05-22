// Calculate the Euclidean distance between two points
function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Generate all permutations of the array elements
function permute(arr) {
  const result = [];

  function swap(a, b) {
    const temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
  }

  function generate(n, heapArr) {
    if (n === 1) {
      result.push([...heapArr]);
      return;
    }

    for (let i = 0; i < n; i++) {
      generate(n - 1, heapArr);
      if (n % 2 === 0) {
        swap(i, n - 1);
      } else {
        swap(0, n - 1);
      }
    }
  }

  generate(arr.length, [...arr]);
  return result;
}

// Find the shortest path
export function findShortestPath(points) {
  const permutations = permute(points);
  let shortestDistance = Infinity;
  let shortestPath = [];

  for (const permutation of permutations) {
    let totalDistance = 0;
    for (let i = 0; i < permutation.length - 1; i++) {
      totalDistance += distance(permutation[i], permutation[i + 1]);
    }
    if (totalDistance < shortestDistance) {
      shortestDistance = totalDistance;
      shortestPath = permutation;
    }
  }

  return shortestPath;
}

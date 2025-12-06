(function(global) {
  // SearchNode contains the board state, g (moves), h (manhattan), and f
  class SearchNode {
    constructor(state, g, prevKey, n) {
      this.state = state;
      this.g = g;
      this.h = SearchNode.manhattan(state, n);
      this.f = this.g + this.h;
      this.prev = prevKey || null;
      this.key = state.join(',');
    }

    static manhattan(arr, n) {
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (v === 0) continue;
        const dest = v - 1;
        const r1 = Math.floor(i / n), c1 = i % n;
        const r2 = Math.floor(dest / n), c2 = dest % n;
        sum += Math.abs(r1 - r2) + Math.abs(c1 - c2);
      }
      return sum;
    }
  }

  // Modified A* search using Hash Maps for Open and Closed Lists
  function neighbors(arr, n) {
    const res = [];
    const zeroIdx = arr.indexOf(0);
    const zr = Math.floor(zeroIdx / n), zc = zeroIdx % n;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const d of dirs) {
      const nr = zr + d[0], nc = zc + d[1];
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
        const ni = nr * n + nc;
        const copy = arr.slice();
        copy[zeroIdx] = copy[ni];
        copy[ni] = 0;
        res.push(copy);
      }
    }
    return res;
  }

  function arrKey(a) {
    return a.join(',');
  }

  function isSolvable(arr, n) {
    const tmp = arr.filter(x => x !== 0);
    let inv = 0;
    for (let i = 0; i < tmp.length; i++) {
      for (let j = i + 1; j < tmp.length; j++) if (tmp[i] > tmp[j]) inv++;
    }
    if (n % 2 === 1) return (inv % 2) === 0;
    const zeroIdx = arr.indexOf(0);
    const rowFromTop = Math.floor(zeroIdx / n);
    const rowFromBottom = n - rowFromTop;
    return ((inv + rowFromBottom) % 2) === 0;
  }

  function reconstruct(cameFrom, key) {
    const path = [];
    let k = key;
    while (k) {
      path.push(cameFrom[k].state);
      k = cameFrom[k].prev;
    }
    return path.reverse();
  }

  // solve returns {path: [...states], nodesExplored: number, timeMs: number}
  function solve(start, n) {
    const startTime = performance.now();
    if (!isSolvable(start, n)) return { path: null, nodesExplored: 0, timeMs: performance.now() - startTime };

    //Generating the goal array
    const goal = [];
    for (let i = 1; i <= n * n; i++) goal.push(i === n * n ? 0 : i);
    const goalKey = arrKey(goal);

    const open = new Map(); // Hash Map for Open List
    const gScore = new Map(); // Map for G scores (cost so far)
    const cameFrom = {}; // To reconstruct the path
    const closed = new Map(); // Hash Map for Closed List
    let nodesExplored = 0;

    const startNode = new SearchNode(start, 0, null, n);
    cameFrom[startNode.key] = { prev: null, state: start.slice() };
    gScore.set(startNode.key, 0);
    open.set(startNode.key, startNode);

    while (open.size > 0) {
      // Get the node with the smallest f value (min heap functionality)
      let currentKey = [...open].reduce((minKey, [key, node]) => {
        return open.get(minKey).f < node.f ? minKey : key;
      }, [...open][0][0]);

      const curr = open.get(currentKey);
      nodesExplored++;

      // If we reached the goal, return the path
      if (curr.key === goalKey) {
        const result = { path: reconstruct(cameFrom, curr.key), nodesExplored, timeMs: performance.now() - startTime };
        return result;
      }

      open.delete(curr.key); // Remove the current node from open
      closed.set(curr.key, true); // Add the current node to closed (using hash map)

      const curG = curr.g;

      // Explore neighbors
      for (const nb of neighbors(curr.state, n)) {
        const nbKey = arrKey(nb);
        if (closed.has(nbKey)) continue; // Skip already explored states

        const tentativeG = curG + 1; // Cost to reach the neighbor

        if (!gScore.has(nbKey) || tentativeG < gScore.get(nbKey)) {
          gScore.set(nbKey, tentativeG); // Update g score
          cameFrom[nbKey] = { prev: curr.key, state: nb.slice() }; // Record the previous node

          const node = new SearchNode(nb, tentativeG, curr.key, n);
          open.set(nbKey, node); // Add the neighbor to open list
        }
      }
    }

    return { path: null, nodesExplored, timeMs: performance.now() - startTime };
  }

  global.Solver = { solve };
})(this);

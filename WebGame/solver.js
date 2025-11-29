// Simple A* solver for slider puzzle (uses Manhattan distance)
// Exports: Solver.solve(startArray, n) -> array of states from start to goal, or null if unsolvable
(function(global){
  // SearchNode contains the board state, g (moves), h (manhattan), and f
  class SearchNode {
    constructor(state, g, prevKey, n){
      this.state = state;
      this.g = g;
      this.h = SearchNode.manhattan(state, n);
      this.f = this.g + this.h;
      this.prev = prevKey || null;
      this.key = state.join(',');
    }
    static manhattan(arr, n){
      let sum=0;
      for(let i=0;i<arr.length;i++){
        const v=arr[i];
        if(v===0) continue;
        const dest = v-1;
        const r1=Math.floor(i/n), c1=i%n;
        const r2=Math.floor(dest/n), c2=dest%n;
        sum += Math.abs(r1-r2)+Math.abs(c1-c2);
      }
      return sum;
    }
  }

  // simple binary min-heap for SearchNode by f, tie-breaker by h
  class MinHeap {
    constructor(){ this.data = []; }
    size(){ return this.data.length; }
    push(node){ this.data.push(node); this._siftUp(this.data.length-1); }
    pop(){ if(this.data.length===0) return null; const top=this.data[0]; const last=this.data.pop(); if(this.data.length>0){ this.data[0]=last; this._siftDown(0);} return top; }
    _siftUp(i){ while(i>0){ const p=Math.floor((i-1)/2); if(this._less(this.data[i], this.data[p])){ [this.data[i],this.data[p]]=[this.data[p],this.data[i]]; i=p; } else break; } }
    _siftDown(i){ const n=this.data.length; while(true){ let l=2*i+1, r=2*i+2, smallest=i; if(l<n && this._less(this.data[l], this.data[smallest])) smallest=l; if(r<n && this._less(this.data[r], this.data[smallest])) smallest=r; if(smallest!==i){ [this.data[i],this.data[smallest]]=[this.data[smallest],this.data[i]]; i=smallest; } else break; } }
    _less(a,b){ if(a.f!==b.f) return a.f<b.f; return a.h<b.h; }
  }

  function neighbors(arr,n){
    const res=[];
    const zeroIdx = arr.indexOf(0);
    const zr=Math.floor(zeroIdx/n), zc=zeroIdx%n;
    const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    for(const d of dirs){
      const nr=zr+d[0], nc=zc+d[1];
      if(nr>=0 && nr<n && nc>=0 && nc<n){
        const ni = nr*n+nc;
        const copy = arr.slice();
        copy[zeroIdx]=copy[ni]; copy[ni]=0;
        res.push(copy);
      }
    }
    return res;
  }

  function arrKey(a){return a.join(',');}

  function isSolvable(arr,n){
    const tmp = arr.filter(x=>x!==0);
    let inv=0;
    for(let i=0;i<tmp.length;i++){
      for(let j=i+1;j<tmp.length;j++) if(tmp[i]>tmp[j]) inv++;
    }
    if(n%2===1) return (inv%2)===0;
    const zeroIdx = arr.indexOf(0);
    const rowFromTop = Math.floor(zeroIdx/n);
    const rowFromBottom = n - rowFromTop;
    return ((inv + rowFromBottom) %2)===0;
  }

  function reconstruct(cameFrom, key){
    const path=[]; let k=key;
    while(k){ path.push(cameFrom[k].state); k=cameFrom[k].prev; }
    return path.reverse();
  }

  // solve returns {path: [...states], nodesExplored: number, timeMs: number}
  function solve(start,n){
    const startTime = performance.now();
    if(!isSolvable(start,n)) return {path:null, nodesExplored:0, timeMs: performance.now()-startTime};
    const goal = [];
    for(let i=1;i<=n*n;i++) goal.push(i===n*n?0:i);
    const goalKey = arrKey(goal);

    const open = new MinHeap();
    const gScore = new Map();
      const cameFrom = {};
      // ensure start is present in cameFrom so reconstruct includes it
      const startNode = new SearchNode(start, 0, null, n);
      cameFrom[startNode.key] = { prev: null, state: start.slice() };
    const closed = new Set();
    let nodesExplored = 0;

    gScore.set(startNode.key, 0);
    open.push(startNode);

    while(open.size()>0){
      const curr = open.pop();
      nodesExplored++;
      if(curr.key===goalKey){
        const result = { path: reconstruct(cameFrom, curr.key), nodesExplored, timeMs: performance.now()-startTime };
        return result;
      }
      closed.add(curr.key);
      const curG = curr.g;
      for(const nb of neighbors(curr.state,n)){
        const nbKey = arrKey(nb);
        if(closed.has(nbKey)) continue;
        const tentativeG = curG + 1;
        if(!gScore.has(nbKey) || tentativeG < gScore.get(nbKey)){
          gScore.set(nbKey, tentativeG);
          cameFrom[nbKey] = { prev: curr.key, state: nb.slice() };
          const node = new SearchNode(nb, tentativeG, curr.key, n);
          open.push(node);
        }
      }
    }
    return { path:null, nodesExplored, timeMs: performance.now()-startTime };
  }

  global.Solver = { solve };
})(this);

const boardEl = document.getElementById('board');
const sizeEl = document.getElementById('size');
const shuffleBtn = document.getElementById('shuffle');
const solveBtn = document.getElementById('solve');
const stepBtn = document.getElementById('step');
const resetBtn = document.getElementById('reset');
const menuBtn = document.getElementById('btn-menu');
const movesEl = document.getElementById('moves');
const statusEl = document.getElementById('status');
const movesRemainingEl = document.getElementById('moves-remaining');
const timerEl = document.getElementById('timer');

// Panels and buttons
const panelStart = document.getElementById('panel-start');
const panelMode = document.getElementById('panel-mode');
const panelHowto = document.getElementById('panel-howto');
const panelExit = document.getElementById('panel-exit');
const panelGame = document.getElementById('panel-game');

const btnStart = document.getElementById('btn-start');
const btnHowto = document.getElementById('btn-howto');
const btnExit = document.getElementById('btn-exit');

const modeNormalBtn = document.getElementById('mode-normal');
const modeTimerBtn = document.getElementById('mode-timer');
const modeLimitedBtn = document.getElementById('mode-limited');
const modeTimerInput = document.getElementById('mode-timer-input');
const modeMoveInput = document.getElementById('mode-move-input');
const modeBackBtn = document.getElementById('mode-back');
const howtoBackBtn = document.getElementById('howto-back');
const exitBackBtn = document.getElementById('exit-back');

const toggleThemeBtn = document.getElementById('toggleTheme');

let n = parseInt(sizeEl.value,10);
let state = []; // flat array length n*n, 0 is empty
let moves = 0;
let solutionPath = null;
let solutionIndex = 0;
let tileEls = new Map(); // value -> DOM element
let initialState = null; // the board state at the start of the current game (used by Reset)
let solutionAnim = null; // interval id for playback animation (prevents double-start)

// Game mode state
let gameMode = 'normal'; // 'normal' | 'timer' | 'limited'
let timeRemaining = 0; // seconds
let timerInterval = null;
let moveLimit = 0;
let movesRemaining = 0;
let gameActive = false;
let elapsedSeconds = 0;
let elapsedInterval = null;

// Menu / Start screen elements will be hooked up later

//Creates and returns an array that represents a goal state for the puzzle
function makeGoal(n){
  const a = [];
  for(let i = 1;i <= n*n; i++) {
    a.push(i=== n*n ? 0 : i);
  } 
  return a;
}

//For retrieval of CSS variable
function getCssPx(varName){
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return parseInt(raw,10) || 0;
}

function layoutBoardContainer(){
  //Get the CSS variable values for tile size and gap
  const tileSize = getCssPx('--tile-size');
  const gap = getCssPx('--gap');

  //Calculate the inner size of the board (excluding padding and borders)
  const inner = n*tileSize + (n-1)*gap;

  // read actual paddings and borders from computed styles so JS matches CSS
  const cs = getComputedStyle(boardEl);
  const padLeft = parseInt(cs.paddingLeft,10) || 0;
  const padRight = parseInt(cs.paddingRight,10) || 0;
  const padTop = parseInt(cs.paddingTop,10) || 0;
  const padBottom = parseInt(cs.paddingBottom,10) || 0;
  const borderLeft = parseInt(cs.borderLeftWidth,10) || 0;
  const borderRight = parseInt(cs.borderRightWidth,10) || 0;
  const borderTop = parseInt(cs.borderTopWidth,10) || 0;
  const borderBottom = parseInt(cs.borderBottomWidth,10) || 0;
  // total outer size should include inner content + paddings + borders
  const totalWidth = inner + padLeft + padRight + borderLeft + borderRight;
  const totalHeight = inner + padTop + padBottom + borderTop + borderBottom;
  boardEl.style.width = totalWidth + 'px';
  boardEl.style.height = totalHeight + 'px';
}

function createTiles(){
  // clear existing
  tileEls.forEach(el=>el.remove()); tileEls.clear();
  // create one element per value (including 0 for empty)
  for(let v = 0; v < n * n; v++){
    const tile = document.createElement('div');
    tile.className = 'tile' + (v===0 ? ' empty' : '');
    tile.dataset.value = v;
    const label = document.createElement('div'); label.className='label'; label.textContent = v===0 ? '' : v;
    tile.appendChild(label);
    if(v!==0){ tile.addEventListener('click', ()=> onTileValueClick(v)); }
    // ensure each tile has transition set inline so transform animations run reliably
    tile.style.transition = 'transform 360ms cubic-bezier(.2,.8,.2,1), box-shadow 300ms cubic-bezier(.2,.8,.2,1), opacity 200ms';
    tile.style.transform = 'translate3d(0px,0px,0px)';
    tileEls.set(v, tile);
    boardEl.appendChild(tile);
  }
}

function updateTiles(){
  const tileSize = getCssPx('--tile-size');
  const gap = getCssPx('--gap');
  // derive padding from computed style so layout matches CSS exactly
  const cs = getComputedStyle(boardEl);
  const padding = parseInt(cs.paddingLeft,10) || 0;
  // batch transforms in rAF to avoid layout thrash
  const updates = [];
  for(let v=0; v<n*n; v++){
    const el = tileEls.get(v);
    const idx = state.indexOf(v);
    const r = Math.floor(idx / n), c = idx % n;
    const x = padding + c * (tileSize + gap);
    const y = padding + r * (tileSize + gap);
    // determine if tile is in its goal position (for v>0). For v=0 (empty), goal is last index.
    const goalIndex = (v === 0) ? (n*n - 1) : (v - 1);
    const inPlace = (idx === goalIndex);
    updates.push({el,x,y,v,inPlace});
  }
  window.requestAnimationFrame(()=>{
    for(const u of updates){
      u.el.style.transform = `translate3d(${u.x}px, ${u.y}px, 0)`;
      if(u.v===0){ u.el.style.opacity = '0'; u.el.style.pointerEvents = 'none'; }
      else { u.el.style.opacity = '1'; u.el.style.pointerEvents = ''; }
      // toggle highlight class when tile is in its correct spot
      if(u.v !== 0){
        if(u.inPlace) u.el.classList.add('correct');
        else u.el.classList.remove('correct');
      } else {
        u.el.classList.remove('correct');
      }
    }
  });
  movesEl.textContent = `Moves: ${moves}`;
  statusEl.textContent = isGoal()? 'Solved' : '';
  // show remaining moves / timer if active
  if(gameMode==='limited'){
    movesRemainingEl.textContent = `Remaining: ${movesRemaining}`;
  } else { movesRemainingEl.textContent = ''; }
  if(gameMode==='timer'){
    timerEl.textContent = `Time: ${Math.max(0, timeRemaining)}s`;
  } else {
    timerEl.textContent = `Time: ${elapsedSeconds}s`;
  }
}

function startElapsedTimer(){
  stopElapsedTimer();
  elapsedSeconds = 0;
  // update every second while game is active
  if(!gameActive) return;
  elapsedInterval = setInterval(()=>{ elapsedSeconds++; updateTiles(); }, 1000);
}

function stopElapsedTimer(){
  if(elapsedInterval){ clearInterval(elapsedInterval); elapsedInterval = null; }
}

function swapIdx(i,j){ const tmp=state[i]; state[i]=state[j]; state[j]=tmp; }

function onTileValueClick(value){
  if(!gameActive){ return; }
  const idx = state.indexOf(value);
  const zero = state.indexOf(0);
  const zr=Math.floor(zero/n), zc=zero%n;
  const r=Math.floor(idx/n), c=idx%n;
  if(Math.abs(zr-r)+Math.abs(zc-c)===1){
    swapIdx(idx, zero);
    moves++;
    if(gameMode==='limited'){
      movesRemaining = Math.max(0, movesRemaining-1);
      if(movesRemaining<=0){
        // final move applied; check solved first
        updateTiles();
        if(isGoal()){ endGame(true); return; }
        endGame(false, 'Out of moves');
        return;
      }
    }
    updateTiles();
    // small sound feedback
    playClickTone();
    if(isGoal()){ endGame(true); }
  }
}

function isGoal(){
  const g = makeGoal(n);
  return state.every((v,i)=>v===g[i]);
}

function shuffleSolvable(){
  // simple: perform random moves from goal to ensure solvable
  state = makeGoal(n).slice();
  const movesToShuffle = n*n*20;
  for(let k=0;k<movesToShuffle;k++){
    const zero = state.indexOf(0);
    const zr=Math.floor(zero/n), zc=zero%n;
    const candidates=[];
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const nr=zr+d[0], nc=zc+d[1]; if(nr>=0&&nr<n&&nc>=0&&nc<n) candidates.push(nr*n+nc)});
    const pick = candidates[Math.floor(Math.random()*candidates.length)];
    swapIdx(zero,pick);
  }
  moves=0; solutionPath=null; solutionIndex=0; layoutBoardContainer(); updateTiles();
}

function reset(){ state = makeGoal(n).slice(); moves=0; solutionPath=null; solutionIndex=0; layoutBoardContainer(); createTiles(); updateTiles(); }

function showStartScreen(){ if(startScreenEl) startScreenEl.style.display='flex'; gameActive=false; }
function hideStartScreen(){ if(startScreenEl) startScreenEl.style.display='none'; }

function showPanel(id){
  // hide all panels then show chosen
  const panels = document.querySelectorAll('.panel');
  panels.forEach(p=>p.classList.add('panel-hidden'));
  const el = document.getElementById(id);
  if(el) el.classList.remove('panel-hidden');
}

function startTimerCountdown(){ stopTimer(); if(timeRemaining<=0) return; timerInterval = setInterval(()=>{ timeRemaining--; updateTiles(); if(timeRemaining<=0){ stopTimer(); endGame(false,'Time up'); } }, 1000); }
function stopTimer(){ if(timerInterval){ clearInterval(timerInterval); timerInterval=null; } }

function startGame(mode, option){
  gameMode = mode || 'normal';
  if(mode==='timer'){
    timeRemaining = Math.max(5, Math.floor(Number(option) || 60));
  } else { timeRemaining = 0; }
  if(mode==='limited'){
    moveLimit = Math.max(1, Math.floor(Number(option) || 50));
    movesRemaining = moveLimit;
  } else { moveLimit = 0; movesRemaining = 0; }
  // initialize board and UI
  n = parseInt(sizeEl.value,10);
  // create tiles for the current size and immediately shuffle to a solvable random board
  createTiles();
  shuffleSolvable();
  // record the shuffled board as the initial state for this play session
  initialState = state.slice();
  // show game panel
  showPanel('panel-game');
  gameActive = true;
  // start elapsed timer for display (used for non-countdown modes)
  startElapsedTimer();
  if(gameMode==='timer') startTimerCountdown();
  updateTiles();
}

function endGame(win, msg){
  gameActive = false;
  stopTimer();
  stopElapsedTimer();
  solutionPath = null;
  statusEl.textContent = win ? 'Solved!' : (msg || 'Game over');
  // when the player wins, present a modal overlay that blocks all interaction
  if(win) showWinOverlay();
  else if(!win && (gameMode === 'timer' || gameMode === 'limited')) showLoseOverlay();
}

// Win overlay: create lazily and control visibility. The overlay blocks all
// pointer events on the page while visible, and exposes two actions:
// - Do Another: shuffle a new board and continue playing
// - Menu: return to the Start panel
let _winOverlay = null;
function ensureWinOverlay(){
  if(_winOverlay) return _winOverlay;
  const o = document.createElement('div');
  o.id = 'win-overlay';
  // place overlay inside the board element so it covers only the playing area
  Object.assign(o.style,{position:'absolute',left:'0',top:'0',width:'100%',height:'100%',background:'rgba(0,0,0,0.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:999,pointerEvents:'auto'});
  // inner card
  const card = document.createElement('div');
  card.classList.add('win-card');
  Object.assign(card.style,{background:'#fff',padding:'18px',borderRadius:'10px',minWidth:'240px',maxWidth:'95%',textAlign:'center',boxShadow:'0 6px 20px rgba(0,0,0,0.25)'});
  const title = document.createElement('div'); title.textContent = 'Congratulations!'; title.style.fontSize='20px'; title.style.fontWeight='700'; title.style.marginBottom='6px';
  const sub = document.createElement('div'); sub.textContent = 'You solved the puzzle.'; sub.style.marginBottom='12px';
  const btnRow = document.createElement('div'); btnRow.style.display='flex'; btnRow.style.justifyContent='center'; btnRow.style.gap='10px';
  const doAnother = document.createElement('button'); doAnother.textContent='Try Again!';
  const menu = document.createElement('button'); menu.textContent='Menu';
  // add semantic classes so CSS theme rules can style them
  doAnother.classList.add('win-btn','do-another');
  menu.classList.add('win-btn','menu-btn');
  // basic inline fallback for spacing
  [doAnother, menu].forEach(b=>{ b.style.padding='10px 14px'; b.style.borderRadius='6px'; b.style.cursor='pointer'; b.style.fontWeight='700'; });
  btnRow.appendChild(doAnother); btnRow.appendChild(menu);
  card.appendChild(title); card.appendChild(sub); card.appendChild(btnRow);
  o.appendChild(card);
  // handlers
  doAnother.addEventListener('click', ()=>{
    hideWinOverlay();
    // create a new shuffled board and record as initial state
    shuffleSolvable();
    initialState = state.slice();
    gameActive = true;
    updateTiles();
  });
  menu.addEventListener('click', ()=>{
    hideWinOverlay();
    stopTimer();
    gameActive = false;
    showPanel('panel-start');
  });
  _winOverlay = o;
  return _winOverlay;
}

function showWinOverlay(){
  const o = ensureWinOverlay();
  // ensure the board element is positioned to contain absolute children
  if(getComputedStyle(boardEl).position === 'static') boardEl.style.position = 'relative';
  if(!boardEl.contains(o)) boardEl.appendChild(o);
}

function hideWinOverlay(){
  if(!_winOverlay) return;
  if(boardEl.contains(_winOverlay)) boardEl.removeChild(_winOverlay);
}

// Lose overlay (appears when player runs out of time or moves). Reuses
// the same visual style but different text and button labels.
let _loseOverlay = null;
function ensureLoseOverlay(){
  if(_loseOverlay) return _loseOverlay;
  const o = document.createElement('div');
  o.id = 'lose-overlay';
  o.classList.add('win-overlay'); // share base positioning/style
  Object.assign(o.style,{pointerEvents:'auto'});
  const card = document.createElement('div');
  card.classList.add('win-card');
  const title = document.createElement('div'); title.textContent = 'Time / Moves Up'; title.style.fontSize='20px'; title.style.fontWeight='700'; title.style.marginBottom='6px';
  const sub = document.createElement('div'); sub.textContent = 'You ran out of time or moves.'; sub.style.marginBottom='12px';
  const btnRow = document.createElement('div'); btnRow.style.display='flex'; btnRow.style.justifyContent='center'; btnRow.style.gap='10px';
  const tryAgain = document.createElement('button'); tryAgain.textContent='Try Again';
  const menu = document.createElement('button'); menu.textContent='Menu';
  tryAgain.classList.add('win-btn','try-again');
  menu.classList.add('win-btn','menu-btn');
  [tryAgain, menu].forEach(b=>{ b.style.padding='10px 14px'; b.style.borderRadius='6px'; b.style.cursor='pointer'; b.style.fontWeight='700'; });
  btnRow.appendChild(tryAgain); btnRow.appendChild(menu);
  card.appendChild(title); card.appendChild(sub); card.appendChild(btnRow);
  o.appendChild(card);
  tryAgain.addEventListener('click', ()=>{
    hideLoseOverlay();
    // reset mode-specific counters
    if(gameMode === 'timer'){
      timeRemaining = Math.max(5, Math.floor(Number(modeTimerInput ? modeTimerInput.value : 60)));
      startTimerCountdown();
    }
    if(gameMode === 'limited'){
      movesRemaining = moveLimit || Math.max(1, Math.floor(Number(modeMoveInput ? modeMoveInput.value : 50)));
    }
    // shuffle and resume
    shuffleSolvable();
    initialState = state.slice();
    gameActive = true;
    updateTiles();
  });
  menu.addEventListener('click', ()=>{
    hideLoseOverlay();
    stopTimer();
    gameActive = false;
    showPanel('panel-start');
  });
  _loseOverlay = o;
  return _loseOverlay;
}

function showLoseOverlay(){
  const o = ensureLoseOverlay();
  if(getComputedStyle(boardEl).position === 'static') boardEl.style.position = 'relative';
  if(!boardEl.contains(o)) boardEl.appendChild(o);
}

function hideLoseOverlay(){
  if(!_loseOverlay) return;
  if(boardEl.contains(_loseOverlay)) boardEl.removeChild(_loseOverlay);
}


shuffleBtn.addEventListener('click', ()=>{ 
  // cancel any running solution playback
  if(solutionAnim){ clearInterval(solutionAnim); solutionAnim = null; if(solveBtn) solveBtn.disabled = false; }
  shuffleSolvable(); 
  // update the recorded initial state to the newly randomized board
  initialState = state.slice();
  gameActive = true; 
  // start/reset elapsed timer when player starts a new randomized board
  startElapsedTimer();
});
resetBtn.addEventListener('click', ()=>{ 
  // Reset should restore the board the player started the session with (initialState).
  if(initialState && Array.isArray(initialState) && initialState.length === n*n){
    state = initialState.slice();
    moves = 0;
    solutionPath = null;
    solutionIndex = 0;
    layoutBoardContainer();
    updateTiles();
  } else {
    // fallback to original reset behavior (solved board)
    reset();
  }
  gameActive = true; 
  // reset elapsed timer when restoring the initial board
  // cancel any running solution playback
  if(solutionAnim){ clearInterval(solutionAnim); solutionAnim = null; if(solveBtn) solveBtn.disabled = false; }
  startElapsedTimer();
});
sizeEl.addEventListener('change', ()=>{ n = parseInt(sizeEl.value,10); reset(); });

// Panel wiring
if(btnStart) btnStart.addEventListener('click', ()=>{ showPanel('panel-mode'); });
if(btnHowto) btnHowto.addEventListener('click', ()=>{ showPanel('panel-howto'); });
if(btnExit) btnExit.addEventListener('click', ()=>{ showPanel('panel-exit'); });

if(modeBackBtn) modeBackBtn.addEventListener('click', ()=>{ showPanel('panel-start'); });
if(modeNormalBtn) modeNormalBtn.addEventListener('click', ()=>{ startGame('normal'); });
if(modeTimerBtn) modeTimerBtn.addEventListener('click', ()=>{ startGame('timer', modeTimerInput ? modeTimerInput.value : 60); });
if(modeLimitedBtn) modeLimitedBtn.addEventListener('click', ()=>{ startGame('limited', modeMoveInput ? modeMoveInput.value : 50); });

if(howtoBackBtn) howtoBackBtn.addEventListener('click', ()=>{ showPanel('panel-start'); });
if(exitBackBtn) exitBackBtn.addEventListener('click', ()=>{ showPanel('panel-start'); });
solveBtn.addEventListener('click', async ()=>{
  // Prevent starting another solve while an animation is running
  if(solutionAnim) return;
  statusEl.textContent = 'Solving...';
  document.getElementById('solver-stats').textContent='';
  await new Promise(r=>setTimeout(r,20));
  const result = Solver.solve(state.slice(), n);
  if(!result || !result.path){
    statusEl.textContent = 'No solution (unsolvable)';
    solutionPath = null;
    document.getElementById('solver-stats').textContent = `Nodes explored: ${result ? result.nodesExplored : 0}; Time: ${result ? result.timeMs.toFixed(1) : 0} ms`;
    return;
  }
  solutionPath = result.path; solutionIndex = 0;
  statusEl.textContent = `Solution found: ${result.path.length-1} moves`;
  document.getElementById('solver-stats').textContent = `Nodes explored: ${result.nodesExplored}; Time: ${result.timeMs.toFixed(1)} ms`;
  // disable Solve button while animating to avoid re-entry
  if(solveBtn) solveBtn.disabled = true;
  // animate playback; keep reference so we can cancel
  let i = 0;
  solutionAnim = setInterval(()=>{
    if(i>=result.path.length){
      clearInterval(solutionAnim);
      solutionAnim = null;
      if(solveBtn) solveBtn.disabled = false;
      endGame(true);
      return;
    }
    state = result.path[i].slice(); moves = i; updateTiles(); i++;
  }, 300);
});

stepBtn.addEventListener('click', ()=>{
  if(!solutionPath) {
    const result = Solver.solve(state.slice(), n);
    if(!result || !result.path){ statusEl.textContent='Unsolvable'; return; }
    solutionPath = result.path; solutionIndex = 0;
  }
  if(solutionIndex < solutionPath.length){ state = solutionPath[solutionIndex].slice(); moves = solutionIndex; solutionIndex++; updateTiles(); }
});

// Save/Load removed from UI. Menu button returns to Start and stops the game.
if(menuBtn) menuBtn.addEventListener('click', ()=>{
  stopTimer();
  gameActive = false;
  stopElapsedTimer();
  // cancel any pending solution playback
  if(solutionAnim){ clearInterval(solutionAnim); solutionAnim = null; }
  solutionPath = null;
  solutionIndex = 0;
  if(solveBtn) solveBtn.disabled = false;
  statusEl.textContent = '';
  showPanel('panel-start');
});

// initialize
function setRandomFrame(){
  // No longer using external frames: keep board background neutral (wood-style from CSS)
  boardEl.style.backgroundImage = '';
}

function playClickTone(){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880; g.gain.value = 0.02;
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.06);
  }catch(e){}
}

// initialize UI and show start screen
layoutBoardContainer();
createTiles();
updateTiles();
// set initial visual theme to the classic look
document.documentElement.classList.add('theme-classic');
if(toggleThemeBtn) toggleThemeBtn.textContent = 'Wooden';
if(toggleThemeBtn) toggleThemeBtn.addEventListener('click', ()=>{
  const html = document.documentElement;
  if(html.classList.contains('theme-classic')){
    html.classList.remove('theme-classic'); html.classList.add('theme-wood');
    toggleThemeBtn.textContent = 'Classic';
  } else { html.classList.remove('theme-wood'); html.classList.add('theme-classic'); toggleThemeBtn.textContent = 'Wooden'; }
});

// show the Start panel initially
// enable repository-provided background image (Frames/Pic2.jpg) if present
try{ document.body.classList.add('use-bg-image'); }catch(e){}
// show the Start panel initially
showPanel('panel-start');

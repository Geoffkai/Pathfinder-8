# Pathfinder 8 — Web Slider Puzzle


Welcome to **Pathfinder 8**, a fun and interactive web-based slider puzzle game! Solve the classic sliding puzzle by arranging the numbered tiles in the correct order. Stuck? No problem—use the **Auto-Solve** feature to watch the algorithm find the perfect solution for you!

## Game Overview

Your goal is simple: rearrange the numbered tiles (1–8) and one empty space into the correct order:

```
1 2 3
4 5 6
7 8 0
```

Click tiles adjacent to the empty space to slide them around. The fewer moves you need, the better!

## How to Play

1. **Open the game**: Open `<a>(https://app.netlify.com/projects/pathfinder-8/overview)</a>` in a modern browser (just double-click!).
2. **Shuffle**: Click the Shuffle button to randomize the tiles.
3. **Solve**: Click tiles to move them, or use **Auto-Solve** to let the AI find the solution and watch it animate!

## Features

✨ **Auto-Solver**: Watch as an intelligent algorithm finds the shortest path to victory.  
🎨 **Two Themes**: Switch between Classic and Wooden themes.  
⏱️ **Game Modes**: Play normal, timed, or with move limits.  
📱 **Responsive Design**: Works on desktop, tablet, and mobile devices.  

## Project Files

- `WebGame/index.html` — Game interface
- `WebGame/style.css` — Styling and layout
- `WebGame/app.js` — Game logic and interactions
- `WebGame/solver.js` — Smart puzzle solver
- `8-Puzzle/Slider-Puzzle/src/` — Java reference implementation

## Running the Game

```bash
# Option 1: Just open the file
Open the Link: <a>(https://app.netlify.com/projects/pathfinder-8/overview)</a>
# Option 2: Use a local server (if you have Python)
cd WebGame
python -m http.server 8000
# Then visit http://localhost:8000
```

## Performance

The solver works best with 3×3 puzzles. Larger puzzles may take longer to solve, but they still work!

## How the Auto-Solver Works

The auto-solver uses the **A\* search algorithm** with the **Manhattan distance heuristic** to find the shortest path to the solution. Here's what that means:

- **A\* Search**: The algorithm explores puzzle states by calculating a cost (`g` — moves made) and an estimate (`h` — moves remaining). It prioritizes states with the lowest combined score (`f = g + h`).
- **Manhattan Distance**: This heuristic estimates how many moves each tile is away from its goal position, helping the algorithm make smarter decisions faster.
- **Solvability Check**: Before solving, the algorithm checks if a puzzle is solvable by counting tile inversions (the algorithm won't waste time on impossible puzzles).

The result? The solver finds the optimal solution in minimal time and displays solver metrics like nodes explored and computation time.

## Algorithm Modifications

The original A\* solver has been optimized for performance:

- **Efficient State Tracking**: Uses a binary min-heap for fast priority queue operations and hash maps for constant-time lookups.
- **Optimized Heuristic**: Manhattan distance provides accurate estimates without excessive computation.
- **Solvability Detection**: Prevents the solver from attempting impossible puzzles by checking inversions before starting the search.

## References

- Classic 8-puzzle problem and A\* pathfinding algorithm
- Manhattan distance heuristic for informed search
- The original Java solver was referenced for automated testing, but the final solution uses optimized hash maps for better performance.

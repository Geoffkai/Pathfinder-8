# Pathfinder 8 — Web Slider Puzzle

This is a standalone web-based slider-puzzle implementation (3×3 default) with an A* auto-solver.

Files added:
- `index.html` — UI and controls
- `style.css` — styles
- `app.js` — UI glue and interaction
- `solver.js` — A* solver (Manhattan heuristic)

How to run
1. Open `WebGame/index.html` in a modern browser (double-click or use a simple static server).
2. Choose size, Shuffle, then play. Click `Auto-solve` to let the solver compute and animate a shortest solution.

Notes
- The solver uses an in-browser A* implementation and is intended for 3×3 and small 4×4 puzzles. Larger sizes may be slow.
- The project guide and proposals were used as the basis — tell me any specific formatting, scoring, or extra requirements and I'll update the web app accordingly.

Compliance with CMSC 122 Project Guide

- Puzzle structure: The app maintains a flat array `state` representing the board and operations are performed by swapping indices. A `SearchNode` object is used by the solver to record `g` (moves), `h` (Manhattan), `f`, and previous node key.
- Puzzle information persistence: You can save the latest configuration to the browser `localStorage` (Save/Load) and export/import JSON files (Export/Import).
- User interaction: Users move tiles via mouse clicks; invalid moves are prevented. The UI updates after each move and shows the current moves count.
- Auto-solve: "Solve for Me" runs an A* implementation (uses a binary min-heap) and shows solver metrics (nodes explored, time) and animates the solution.

Asymptotic analysis (summary)

Note: A* performance depends heavily on the heuristic quality. The following is a general comparison:

 - Method: A* with Manhattan heuristic (this project - JS)
	 - Time (worst-case): O(b^d) (exponential), but much improved by admissible heuristics in practice
	 - Space: O(b^d) (stores frontier)

 - Method: Basic uninformed search (e.g., BFS) — not used here
	 - Time: O(b^d) (often much worse in practice)
	 - Space: O(b^d)

Where b = branching factor, d = solution depth. The implemented Min-Heap reduces overhead in selecting the node with smallest f compared to naive scanning.

Files for submission
- `WebGame/` (web app)
- `8-Puzzle/Slider-Puzzle/src/` (Java solver used for automated testing; included as reference)
- `Project Proposal I.pdf` and `Project Proposal I - Part 2.pdf` (your proposal and storyboards)

References
- The Princeton `algs4` utilities and the 8-puzzle assignment inspired the original Java solver design (used as a reference only).


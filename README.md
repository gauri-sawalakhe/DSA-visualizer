# DSA-visualizer
An interactive visualization tool for learning data structure and algorithms


## Run
1. Extract the ZIP.
2. Open the folder in VS Code.
3. Run it with the **Live Server** extension (recommended). ES modules may not run correctly from a `file://` URL.
4. Open `index.html` in the browser through Live Server.

## Files
- `index.html`: page structure and controls.
- `css/style.css`: responsive UI and animations.
- `js/script.js`: input validation, UI state, animation controls, and operations.
- `js/algorithms/sorting.js`: Bubble, Selection, Insertion, Merge, Quick, Heap sort step generators.
- `js/algorithms/linear.js`: array/list/stack/queue rendering and operations.
- `js/algorithms/trees.js`: BST insert/search/delete, traversals, AVL insertion/rotations, tree rendering.
- `js/algorithms/graphs.js`: graph demo construction, BFS/DFS traversal, rendering.

## Important scope notes
- Browser JavaScript cannot directly execute your C source files. This project uses separate JavaScript modules for browser animations. To use the C algorithms themselves, you need a backend that compiles/runs C or compile them to WebAssembly and connect the UI to it.
- The directed/undirected graph is a simple demo graph built from the entered sequence (edges connect consecutive entered nodes). It is not a full graph editor yet.
- Binary tree uses level-order placement, while binary search tree uses ordered insertion.
- Threaded BST supports left-, right-, and double-threaded visualizations with dashed thread links.
- Operation input validation uses alerts. For stack/queue, insert maps to push/enqueue and delete maps to pop/dequeue. Array/list operations use a zero-based index.
- Values are restricted to 30 safe integers to keep the visualizer readable.

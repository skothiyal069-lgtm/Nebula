# Nebula Chat 

Nebula Chat is a luxurious, high-performance cyberpunk messaging application. Instead of just a standard WhatsApp clone, it features a custom neon-aesthetic dark theme, dynamic activity analytics, and a native **C++ algorithm engine** (`nebula_core`) that handles all core Data Structures and Algorithms (DSA) / Design and Analysis of Algorithms (DAA) processes.

---

## Technical Stack

- **Frontend**: React (Vite) + Tailwind CSS (Cyber themes, Glassmorphism, animations)
- **Backend**: Node.js + Express (JWT Authentication, Socket.IO real-time channels)
- **Database**: MongoDB (runs out-of-the-box with an automatic local file-based JSON database fallback `db_fallback.json` if MongoDB is offline)
- **Algorithm Engine**: Native C++17 binary (`nebula_core`) for high-speed algorithmic traces.

---

## Visual DSA & DAA Features

Nebula Chat integrates 5 core algorithms with interactive step-by-step visualizations:

1. **Trie Prefix Search (`trie.hpp`)**
   - **DSA Concept**: Trie (Prefix Tree) search autocomplete.
   - **UI Visualizer**: Displays an SVG node-tree representation of matching contact names. Highlights the search traversal path in Neon Orange as you type.

2. **Dijkstra Routing & Kruskal's MST (`graph.hpp`)**
   - **DSA Concept**: Shortest Path finder (Dijkstra) and Minimum Spanning Tree (Kruskal's Algorithm).
   - **UI Visualizer**: Renders user connections as a node network. Click "Run Dijkstra" to see step-by-step node visit animations or click "Run Kruskal MST" to see the minimum spanned server broadcast tree drawn on the canvas.

3. **Huffman Coder Compression (`huffman.hpp`)**
   - **DSA Concept**: Huffman coding compression.
   - **UI Visualizer**: Displays a binary frequency tree for message data and a diagnostic board comparing original 8-bit ASCII size against compressed bits with exact space savings percentages.

4. **Scheduled Messages Min-Heap Queue (`priority_queue.hpp`)**
   - **DSA Concept**: Binary Min-Heap Priority Queue.
   - **UI Visualizer**: Renders scheduled transmissions as a binary tree. Scheduled messages are sorted by date/time, keeping the earliest triggers at the top of the heap.

5. **DP Levenshtein Distance AI Replies (`edit_distance.hpp`)**
   - **DSA Concept**: Dynamic Programming Levenshtein Edit Distance.
   - **UI Visualizer**: Displays a color-coded Dynamic Programming grid matrix showing edit costs, and highlights the optimal traceback alignment path for AI suggested quick replies.

---

## File Structure

```
WhatClone/
├── cpp_core/                  # C++ native algorithm source files
│   ├── src/
│   │   ├── trie.hpp           # Trie class
│   │   ├── huffman.hpp        # Huffman Coding class
│   │   ├── graph.hpp          # Graph (Dijkstra, Kruskal) class
│   │   ├── priority_queue.hpp # Min-Heap class
│   │   ├── edit_distance.hpp  # Levenshtein distance class
│   │   └── main.cpp           # CLI gateway entrypoint
│   └── Makefile               # clang++/g++ build automation
├── backend/                   # Node.js + Express + Socket.IO server
│   ├── src/
│   │   ├── config/            # DB configuration + fallback JSON persistence
│   │   ├── controllers/       # Auth, Chat, and C++ routing controllers
│   │   ├── services/          # cppEngine C++ executor service
│   │   ├── models/            # Hybrid Mongoose & JSON schemas
│   │   └── index.js           # Server startup script
│   └── seed.js                # Database seeder (creates users/DMs)
└── frontend/                  # React client
    ├── src/
    │   ├── components/        # Cyber chat, sidebar, and visualizers
    │   ├── context/           # Auth and WebSocket client contexts
    │   └── main.jsx
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** v18+
- **C++ Compiler** (`clang++` or `g++`)

### Option 1: Direct Run (5 minutes)

**Step 1: Compile C++ Engine**
```bash
cd cpp_core && make clean && make && cd ..
```

**Step 2: Backend**
```bash
cd backend
npm install
node seed.js
npm start
```
→ Backend runs on `http://localhost:5001`

**Step 3: Frontend (new terminal)**
```bash
cd frontend
npm install
npm run dev
```
→ Frontend runs on `http://localhost:3000`

### Option 2: Docker Compose

```bash
docker-compose up --build
```
→ Access at `http://localhost:3000`

---

## ☁️ Deploy to Render

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.**

Quick Deploy:
1. Push to GitHub
2. Go to [Render Dashboard](https://render.com)
3. Create Blueprint Instance using `render.yaml`
4. Set MongoDB URI & JWT Secret
5. Deploy!

---
*Created under sector 0x7FF - Nebula Communications Protocol.*

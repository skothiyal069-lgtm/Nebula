export class Graph {
  constructor() {
    this.adjacencyList = {};
    this.vertices = [];
    this.edges = []; // list of { u, v, weight, roomName }
  }

  addVertex(vertex) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
      this.vertices.push(vertex);
    }
  }

  addEdge(u, v, weight, roomName = 'Direct') {
    this.addVertex(u);
    this.addVertex(v);
    
    // Check if edge already exists, update weight to be the minimum (or average)
    const existingEdgeU = this.adjacencyList[u].find(edge => edge.node === v);
    if (existingEdgeU) {
      existingEdgeU.weight = weight;
      existingEdgeU.roomName = roomName;
    } else {
      this.adjacencyList[u].push({ node: v, weight, roomName });
    }

    const existingEdgeV = this.adjacencyList[v].find(edge => edge.node === u);
    if (existingEdgeV) {
      existingEdgeV.weight = weight;
      existingEdgeV.roomName = roomName;
    } else {
      this.adjacencyList[v].push({ node: u, weight, roomName });
    }

    // Add to flat edges list (sorting for Kruskal's)
    const edgeIndex = this.edges.findIndex(
      e => (e.u === u && e.v === v) || (e.u === v && e.v === u)
    );
    if (edgeIndex !== -1) {
      this.edges[edgeIndex].weight = weight;
    } else {
      this.edges.push({ u, v, weight, roomName });
    }
  }

  // Dijkstra's Shortest Path Algorithm
  // Returns { path, distance, steps } where steps logs each node evaluation for animations
  findShortestPath(startNode, endNode) {
    const distances = {};
    const previous = {};
    const queue = [];
    const steps = []; // logs of steps: { node, distance, visited: [] }
    const visited = new Set();

    // Init
    for (let vertex of this.vertices) {
      if (vertex === startNode) {
        distances[vertex] = 0;
        queue.push({ node: vertex, priority: 0 });
      } else {
        distances[vertex] = Infinity;
        queue.push({ node: vertex, priority: Infinity });
      }
      previous[vertex] = null;
    }

    while (queue.length > 0) {
      // Sort queue by priority (simulate simple Priority Queue)
      queue.sort((a, b) => a.priority - b.priority);
      const smallest = queue.shift();

      if (!smallest || smallest.priority === Infinity) break;

      const currentNode = smallest.node;
      visited.add(currentNode);

      steps.push({
        currentNode,
        distances: { ...distances },
        visited: Array.from(visited),
        evaluating: []
      });

      if (currentNode === endNode) {
        // Build path
        const path = [];
        let current = endNode;
        while (current) {
          path.unshift(current);
          current = previous[current];
        }
        return {
          path,
          distance: distances[endNode],
          steps
        };
      }

      const neighbors = this.adjacencyList[currentNode] || [];
      for (let neighbor of neighbors) {
        const nextNode = neighbor.node;
        if (visited.has(nextNode)) continue;

        // Calculate distance
        const newDist = distances[currentNode] + neighbor.weight;

        steps[steps.length - 1].evaluating.push({
          from: currentNode,
          to: nextNode,
          weight: neighbor.weight,
          oldDistance: distances[nextNode],
          newDistance: newDist
        });

        if (newDist < distances[nextNode]) {
          distances[nextNode] = newDist;
          previous[nextNode] = currentNode;

          // Update priority in queue
          const queueItem = queue.find(item => item.node === nextNode);
          if (queueItem) {
            queueItem.priority = newDist;
          }
        }
      }
    }

    return {
      path: [],
      distance: Infinity,
      steps
    };
  }

  // Kruskal's Minimum Spanning Tree Algorithm
  // Returns { mstEdges, totalCost, steps } for animation
  findMST() {
    const sortedEdges = [...this.edges].sort((a, b) => a.weight - b.weight);
    const parent = {};
    const steps = []; // logs of steps for visualizer

    // Union-Find / Disjoint Set helpers
    const makeSet = (v) => {
      parent[v] = v;
    };

    const find = (v) => {
      if (parent[v] === v) return v;
      return parent[v] = find(parent[v]); // Path compression
    };

    const union = (u, v) => {
      const rootU = find(u);
      const rootV = find(v);
      if (rootU !== rootV) {
        parent[rootU] = rootV;
        return true;
      }
      return false;
    };

    // Initialize Disjoint Sets
    for (let vertex of this.vertices) {
      makeSet(vertex);
    }

    const mstEdges = [];
    let totalCost = 0;

    for (let edge of sortedEdges) {
      const rootU = find(edge.u);
      const rootV = find(edge.v);
      const createsCycle = rootU === rootV;

      if (!createsCycle) {
        union(edge.u, edge.v);
        mstEdges.push(edge);
        totalCost += edge.weight;
      }

      steps.push({
        edgeChecked: edge,
        mstState: [...mstEdges],
        createsCycle,
        totalCost
      });
    }

    return {
      mstEdges,
      totalCost,
      steps
    };
  }
}

import { execFileSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fallback JS algorithms
import { Trie } from '../algorithms/trie.js';
import { HuffmanCoding } from '../algorithms/huffman.js';
import { Graph } from '../algorithms/graph.js';
import { PriorityQueue } from '../algorithms/priorityQueue.js';
import { computeEditDistance } from '../algorithms/editDistance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to C++ core executable
const binaryPath = path.resolve(__dirname, '../../../cpp_core/nebula_core');

let cxxEnabled = false;

const checkBinary = () => {
  try {
    if (fs.existsSync(binaryPath)) {
      cxxEnabled = true;
    } else {
      cxxEnabled = false;
    }
  } catch (err) {
    cxxEnabled = false;
  }
};

// Initial check
checkBinary();

export const isCxxEnabled = () => {
  checkBinary();
  return cxxEnabled;
};

// Call C++ Binary or Fallback to JS
const runAlgorithm = (mode, args, jsFallback) => {
  checkBinary();

  if (cxxEnabled) {
    try {
      const output = execFileSync(binaryPath, [mode, ...args], { encoding: 'utf8' });
      return JSON.parse(output);
    } catch (err) {
      console.error(`⚠️ [NEBULA ENGINE] C++ execution failed for ${mode}. Falling back to JS.`, err.message);
      return jsFallback();
    }
  } else {
    // Graceful JS Fallback
    return jsFallback();
  }
};

export const runTrie = (query, wordList) => {
  return runAlgorithm('--trie', [query, wordList.join(',')], () => {
    const trie = new Trie();
    wordList.forEach(w => trie.insert(w, { username: w }));
    const visualization = trie.getVisualizationData(query);
    const matches = trie.search(query);
    return { visualization, matches };
  });
};

export const runHuffman = (text) => {
  return runAlgorithm('--huffman', [text], () => {
    const huffman = new HuffmanCoding();
    return huffman.getVisualizationData(text);
  });
};

export const runEditDistance = (word1, word2) => {
  return runAlgorithm('--edit-distance', [word1, word2], () => {
    return computeEditDistance(word1, word2);
  });
};

export const runNetwork = (start, end, edges) => {
  // Convert edges array of {u, v, weight, roomName} to C++ CLI formatted string
  // Format: "u|v|weight|roomName,..."
  const edgeStr = edges.map(e => `${e.u}|${e.v}|${e.weight}|${e.roomName || 'Direct'}`).join(',');

  return runAlgorithm('--network', [start || '', end || '', edgeStr], () => {
    const graph = new Graph();
    edges.forEach(e => {
      graph.addEdge(e.u, e.v, e.weight, e.roomName);
    });

    let dijkstraResult = null;
    if (start && end && graph.vertices.includes(start) && graph.vertices.includes(end)) {
      dijkstraResult = graph.findShortestPath(start, end);
    }

    const mstResult = graph.findMST();

    return {
      vertices: graph.vertices,
      edges: graph.edges,
      dijkstra: dijkstraResult,
      mst: mstResult
    };
  });
};

export const runScheduler = (items) => {
  // Convert items array to C++ CLI formatted string
  // Format: "id|content|sendAt|recipientName,..."
  const itemStr = items.map(item => `${item._id}|${item.content}|${new Date(item.sendAt).getTime()}|${item.recipientName || 'User'}`).join(',');

  return runAlgorithm('--scheduler', [itemStr], () => {
    const queue = new PriorityQueue();
    items.forEach(item => queue.insert(item));
    return queue.getVisualizationData();
  });
};

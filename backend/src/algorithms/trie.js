class TrieNode {
  constructor(char = '') {
    this.char = char;
    this.children = {}; // Map of char -> TrieNode
    this.isEndOfWord = false;
    this.data = null; // Associated object (e.g. user details)
  }
}

export class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word, data = null) {
    if (!word) return;
    let node = this.root;
    for (let char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode(char);
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
    node.data = data;
  }

  search(prefix) {
    if (!prefix) return [];
    let node = this.root;
    for (let char of prefix.toLowerCase()) {
      if (!node.children[char]) {
        return [];
      }
      node = node.children[char];
    }
    return this._collectWords(node);
  }

  _collectWords(node, results = []) {
    if (node.isEndOfWord) {
      results.push(node.data);
    }
    for (let char in node.children) {
      this._collectWords(node.children[char], results);
    }
    return results;
  }

  // Generates a visual tree graph representation for rendering
  // Highlights nodes matching the search query path
  getVisualizationData(searchQuery = '') {
    const nodes = [];
    const links = [];
    let nodeIdCounter = 0;
    const query = searchQuery.toLowerCase();

    const traverse = (node, parentId = null, depth = 0, isHighlighted = false) => {
      const currentId = `n-${nodeIdCounter++}`;
      
      nodes.push({
        id: currentId,
        label: node.char || 'Root',
        isWord: node.isEndOfWord,
        depth,
        highlight: isHighlighted,
        value: node.data ? node.data.username : null
      });

      if (parentId !== null) {
        links.push({
          source: parentId,
          target: currentId,
          highlight: isHighlighted
        });
      }

      // Check which child matches the query at this position (depth)
      const nextChar = query[depth];
      
      for (let char in node.children) {
        const matchesQuery = isHighlighted && (char === nextChar);
        traverse(node.children[char], currentId, depth + 1, matchesQuery);
      }
    };

    // If query is empty, we highlight root; otherwise, we walk down the query path
    traverse(this.root, null, 0, true);

    // Let's also check if any full node got highlighted that matches the query.
    // If query is not empty, let's trace the prefix path and mark it highlighted
    let current = this.root;
    const pathNodes = [this.root];
    let pathFound = true;
    for (let char of query) {
      if (current.children[char]) {
        current = current.children[char];
        pathNodes.push(current);
      } else {
        pathFound = false;
        break;
      }
    }

    // Regenerate nodes & links with exact highlighting if path found
    if (query.length > 0 && pathFound) {
      const highlightNodes = new Set(pathNodes);
      let nodeId = 0;
      const nodesMap = new Map();
      const finalNodes = [];
      const finalLinks = [];

      const buildFinal = (node, parentId = null, depth = 0) => {
        const id = `n-${nodeId++}`;
        nodesMap.set(node, id);
        
        const pathIndex = pathNodes.indexOf(node);
        const inSearchPath = pathIndex !== -1;
        const matchesFully = pathIndex === query.length; // reached end of query

        finalNodes.push({
          id,
          label: node.char || 'ROOT',
          isWord: node.isEndOfWord,
          depth,
          highlight: inSearchPath,
          isTerminus: matchesFully,
          value: node.data ? node.data.username : null
        });

        if (parentId !== null) {
          const parentNode = Object.values(nodesMap).find(n => n === parentId);
          // find parent key node
          let parentNodeKey = null;
          for (let [key, val] of nodesMap.entries()) {
            if (val === parentId) {
              parentNodeKey = key;
              break;
            }
          }
          const parentHighlight = parentNodeKey && pathNodes.indexOf(parentNodeKey) !== -1;
          const linkHighlight = parentHighlight && inSearchPath && (pathNodes.indexOf(node) === pathNodes.indexOf(parentNodeKey) + 1);

          finalLinks.push({
            source: parentId,
            target: id,
            highlight: linkHighlight
          });
        }

        // Limit depth of tree visualization so it fits neatly in UI
        if (depth < 4) {
          for (let char in node.children) {
            buildFinal(node.children[char], id, depth + 1);
          }
        }
      };

      buildFinal(this.root, null, 0);
      return { nodes: finalNodes, links: finalLinks };
    }

    return { nodes, links };
  }
}

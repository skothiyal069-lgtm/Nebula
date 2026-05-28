class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }
}

export class HuffmanCoding {
  constructor() {
    this.root = null;
    this.codes = {};
    this.frequencies = {};
  }

  // Prepares the frequency table and builds the Huffman Tree
  buildTree(text) {
    if (!text) return null;

    // Calculate frequencies
    const freqs = {};
    for (let char of text) {
      freqs[char] = (freqs[char] || 0) + 1;
    }
    this.frequencies = freqs;

    // Build leaves in priority list (simulate priority queue)
    const nodes = [];
    for (let char in freqs) {
      nodes.push(new HuffmanNode(char, freqs[char]));
    }

    if (nodes.length === 0) return null;

    // Edge case: single unique character
    if (nodes.length === 1) {
      this.root = new HuffmanNode(null, nodes[0].freq, nodes[0], null);
      this._generateCodes(this.root, '');
      return this.root;
    }

    while (nodes.length > 1) {
      // Sort in ascending order of frequency
      nodes.sort((a, b) => a.freq - b.freq);

      // Extract two lowest nodes
      const left = nodes.shift();
      const right = nodes.shift();

      // Create internal node
      const parent = new HuffmanNode(null, left.freq + right.freq, left, right);
      nodes.push(parent);
    }

    this.root = nodes[0];
    this.codes = {};
    this._generateCodes(this.root, '');
    return this.root;
  }

  _generateCodes(node, code) {
    if (!node) return;

    if (node.char !== null) {
      this.codes[node.char] = code;
      return;
    }

    this._generateCodes(node.left, code + '0');
    this._generateCodes(node.right, code + '1');
  }

  encode(text) {
    this.buildTree(text);
    if (Object.keys(this.codes).length === 0) return '';
    let encodedStr = '';
    for (let char of text) {
      encodedStr += this.codes[char];
    }
    return encodedStr;
  }

  decode(encodedText) {
    if (!encodedText || !this.root) return '';
    let decodedStr = '';
    let current = this.root;

    for (let bit of encodedText) {
      if (bit === '0') {
        current = current.left;
      } else {
        current = current.right;
      }

      if (current.char !== null) {
        decodedStr += current.char;
        current = this.root;
      }
    }

    return decodedStr;
  }

  // Returns tree data & stats for UI visualization
  getVisualizationData(text) {
    if (!text) {
      return { nodes: [], links: [], stats: { originalSize: 0, compressedSize: 0, ratio: 0 } };
    }

    // Build the tree and get codes
    this.buildTree(text);
    const encoded = this.encode(text);

    const nodes = [];
    const links = [];
    let idCounter = 0;

    const traverse = (node, parentId = null, path = '') => {
      if (!node) return;
      const currentId = `huff-${idCounter++}`;
      
      nodes.push({
        id: currentId,
        label: node.char !== null ? `'${node.char}'` : `∑:${node.freq}`,
        freq: node.freq,
        char: node.char,
        code: this.codes[node.char] || '',
        isLeaf: node.char !== null,
        path
      });

      if (parentId !== null) {
        links.push({
          source: parentId,
          target: currentId,
          bit: path[path.length - 1]
        });
      }

      traverse(node.left, currentId, path + '0');
      traverse(node.right, currentId, path + '1');
    };

    traverse(this.root);

    const originalBits = text.length * 8;
    const compressedBits = encoded.length;
    const compressionRatio = originalBits > 0 ? ((originalBits - compressedBits) / originalBits * 100).toFixed(1) : 0;

    return {
      nodes,
      links,
      text,
      encoded,
      frequencies: this.frequencies,
      codes: this.codes,
      stats: {
        originalBits,
        compressedBits,
        compressionRatio
      }
    };
  }
}

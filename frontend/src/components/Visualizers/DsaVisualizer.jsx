import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Play, Pause, ChevronRight, Terminal, RefreshCw, 
  Cpu, Award, GitBranch, Share2, Layers, HardDrive 
} from 'lucide-react';

export const DsaVisualizer = ({ defaultTab = 'trie' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // States for each algorithm
  const [trieQuery, setTrieQuery] = useState('a');
  const [trieData, setTrieData] = useState(null);
  
  const [huffmanText, setHuffmanText] = useState('quantum transmission verified');
  const [huffmanData, setHuffmanData] = useState(null);

  const [word1, setWord1] = useState('sector');
  const [word2, setWord2] = useState('vector');
  const [editData, setEditData] = useState(null);

  const [heapData, setHeapData] = useState(null);

  const [networkData, setNetworkData] = useState(null);
  const [startUser, setStartUser] = useState('');
  const [endUser, setEndUser] = useState('');
  const [dijkstraPlayback, setDijkstraPlayback] = useState(null); // { steps, currentStep }
  const [mstPlayback, setMstPlayback] = useState(null); // { steps, currentStep }
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState(null); // 'dijkstra' | 'mst'

  useEffect(() => {
    loadTabLogs();
  }, [activeTab]);

  // Trie auto-update
  useEffect(() => {
    if (activeTab === 'trie') {
      loadTrie();
    }
  }, [trieQuery]);

  const loadTabLogs = () => {
    setIsPlaying(false);
    setPlaybackMode(null);
    setDijkstraPlayback(null);
    setMstPlayback(null);

    switch (activeTab) {
      case 'trie': loadTrie(); break;
      case 'huffman': loadHuffman(); break;
      case 'edit': loadEditDistance(); break;
      case 'heap': loadHeap(); break;
      case 'graph': loadNetwork(); break;
    }
  };

  const loadTrie = async () => {
    try {
      const res = await axios.get(`/api/dsa/trie?query=${trieQuery}`);
      if (res.data.success) setTrieData(res.data.data);
    } catch (err) { console.error(err); }
  };

  const loadHuffman = async () => {
    try {
      const res = await axios.post('/api/dsa/huffman', { text: huffmanText });
      if (res.data.success) setHuffmanData(res.data.data);
    } catch (err) { console.error(err); }
  };

  const loadEditDistance = async () => {
    try {
      const res = await axios.post('/api/dsa/edit-distance', { word1, word2 });
      if (res.data.success) setEditData(res.data.data);
    } catch (err) { console.error(err); }
  };

  const loadHeap = async () => {
    try {
      const res = await axios.get('/api/dsa/scheduler');
      if (res.data.success) setHeapData(res.data.data);
    } catch (err) { console.error(err); }
  };

  const loadNetwork = async () => {
    try {
      const res = await axios.get(`/api/dsa/network?startUser=${startUser}&endUser=${endUser}`);
      if (res.data.success) {
        setNetworkData(res.data.data);
        if (res.data.data.vertices.length >= 2) {
          if (!startUser) setStartUser(res.data.data.vertices[0]);
          if (!endUser) setEndUser(res.data.data.vertices[res.data.data.vertices.length - 1]);
        }
      }
    } catch (err) { console.error(err); }
  };

  // Playback handlers
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        if (playbackMode === 'dijkstra' && dijkstraPlayback) {
          const next = dijkstraPlayback.currentStep + 1;
          if (next < dijkstraPlayback.steps.length) {
            setDijkstraPlayback({ ...dijkstraPlayback, currentStep: next });
          } else {
            setIsPlaying(false);
          }
        } else if (playbackMode === 'mst' && mstPlayback) {
          const next = mstPlayback.currentStep + 1;
          if (next < mstPlayback.steps.length) {
            setMstPlayback({ ...mstPlayback, currentStep: next });
          } else {
            setIsPlaying(false);
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackMode, dijkstraPlayback, mstPlayback]);

  const runDijkstraPathfinder = () => {
    if (!networkData?.dijkstra?.steps) return;
    setPlaybackMode('dijkstra');
    setDijkstraPlayback({
      steps: networkData.dijkstra.steps,
      currentStep: 0
    });
    setIsPlaying(true);
  };

  const runKruskalMST = () => {
    if (!networkData?.mst?.steps) return;
    setPlaybackMode('mst');
    setMstPlayback({
      steps: networkData.mst.steps,
      currentStep: 0
    });
    setIsPlaying(true);
  };

  // SVG Render Helper for Trie
  const renderTrieSvg = () => {
    if (!trieData?.visualization?.nodes) return null;
    const { nodes, links } = trieData.visualization;

    // Separate nodes by depth for layout
    const depthGroups = {};
    nodes.forEach(n => {
      if (!depthGroups[n.depth]) depthGroups[n.depth] = [];
      depthGroups[n.depth].push(n);
    });

    const nodePositions = {};
    const width = 600;
    const height = 300;

    Object.keys(depthGroups).forEach(depthStr => {
      const depth = Number(depthStr);
      const levelNodes = depthGroups[depth];
      const y = 30 + depth * 60;
      const count = levelNodes.length;

      levelNodes.forEach((node, idx) => {
        const x = (width / (count + 1)) * (idx + 1);
        nodePositions[node.id] = { x, y };
      });
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72 border border-cyber-orange/10 bg-cyber-black rounded-xl">
        {/* Draw Links */}
        {links.map((link, idx) => {
          const p1 = nodePositions[link.source];
          const p2 = nodePositions[link.target];
          if (!p1 || !p2) return null;
          return (
            <line
              key={idx}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              className={`stroke-2 transition-all ${
                link.highlight ? 'stroke-cyber-orange [filter:drop-shadow(0_0_3px_#ff5500)]' : 'stroke-slate-800'
              }`}
            />
          );
        })}

        {/* Draw Nodes */}
        {nodes.map(node => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          return (
            <g key={node.id}>
              <circle
                cx={pos.x} cy={pos.y} r={14}
                className={`transition-all stroke-2 cursor-pointer ${
                  node.isTerminus 
                    ? 'fill-cyber-orange stroke-white' 
                    : node.highlight 
                      ? 'fill-cyber-orange/20 stroke-cyber-orange [filter:drop-shadow(0_0_5px_#ff5500)]'
                      : 'fill-cyber-charcoal stroke-slate-700'
                }`}
              />
              <text
                x={pos.x} y={pos.y + 4}
                textAnchor="middle"
                className={`text-[10px] font-bold font-tech ${
                  node.isTerminus ? 'fill-black' : node.highlight ? 'fill-cyber-orange font-bold' : 'fill-slate-400'
                }`}
              >
                {node.label}
              </text>
              {node.isWord && (
                <circle cx={pos.x + 9} cy={pos.y - 9} r={3.5} className="fill-cyber-orange border border-white" />
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // SVG Render Helper for Huffman Tree
  const renderHuffmanSvg = () => {
    if (!huffmanData?.nodes) return null;
    const { nodes, links } = huffmanData;

    // Lay out tree based on path binary prefixes
    const width = 600;
    const height = 300;
    const nodePositions = {};

    const traverseLayout = (nodeId, x, y, spreadX) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      nodePositions[nodeId] = { x, y };

      // Find children
      const leftLink = links.find(l => l.source === nodeId && l.bit === '0');
      const rightLink = links.find(l => l.source === nodeId && l.bit === '1');

      if (leftLink) {
        traverseLayout(leftLink.target, x - spreadX, y + 55, spreadX * 0.5);
      }
      if (rightLink) {
        traverseLayout(rightLink.target, x + spreadX, y + 55, spreadX * 0.5);
      }
    };

    // Find Root
    const childSet = new Set(links.map(l => l.target));
    const rootNode = nodes.find(n => !childSet.has(n.id));

    if (rootNode) {
      traverseLayout(rootNode.id, width / 2, 35, width / 4);
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72 border border-cyber-orange/10 bg-cyber-black rounded-xl">
        {/* Links */}
        {links.map((link, idx) => {
          const p1 = nodePositions[link.source];
          const p2 = nodePositions[link.target];
          if (!p1 || !p2) return null;
          return (
            <g key={idx}>
              <line
                x1={p1.x} y1={p1.y}
                x2={p2.x} y2={p2.y}
                className="stroke-slate-800 stroke-2"
              />
              <text
                x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 4}
                className="text-[9px] font-mono fill-cyber-orange font-bold text-center"
              >
                {link.bit}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          return (
            <g key={node.id}>
              <circle
                cx={pos.x} cy={pos.y} r={13}
                className={`stroke-2 ${
                  node.isLeaf 
                    ? 'fill-cyber-orange/10 stroke-cyber-orange [filter:drop-shadow(0_0_3px_#ff5500)]' 
                    : 'fill-cyber-charcoal stroke-slate-700'
                }`}
              />
              <text
                x={pos.x} y={pos.y + 4}
                textAnchor="middle"
                className="text-[9px] font-bold font-mono fill-slate-200"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // SVG Render Helper for Graph (Dijkstra/MST Canvas)
  const renderGraphSvg = () => {
    if (!networkData?.vertices) return null;
    const { vertices, edges } = networkData;

    const width = 600;
    const height = 300;

    // Layout vertices in a circle
    const nodePositions = {};
    const center = { x: width / 2, y: height / 2 };
    const radius = 90;

    vertices.forEach((v, idx) => {
      const angle = (idx * 2 * Math.PI) / vertices.length;
      nodePositions[v] = {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle)
      };
    });

    // Playback state extraction
    let activePath = [];
    let visitedNodes = [];
    let edgeEvaluated = [];
    let mstEdgesToShow = [];

    if (playbackMode === 'dijkstra' && dijkstraPlayback) {
      const step = dijkstraPlayback.steps[dijkstraPlayback.currentStep];
      if (step) {
        visitedNodes = step.visited || [];
        edgeEvaluated = step.evaluating || [];
        // If it's final step and path exists
        if (dijkstraPlayback.currentStep === dijkstraPlayback.steps.length - 1 && networkData.dijkstra?.path) {
          activePath = networkData.dijkstra.path;
        }
      }
    } else if (playbackMode === 'mst' && mstPlayback) {
      const step = mstPlayback.steps[mstPlayback.currentStep];
      if (step) {
        mstEdgesToShow = step.mstState || [];
      }
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72 border border-cyber-orange/10 bg-cyber-black rounded-xl">
        {/* Draw Edges */}
        {edges.map((edge, idx) => {
          const p1 = nodePositions[edge.u];
          const p2 = nodePositions[edge.v];
          if (!p1 || !p2) return null;

          // Determine highlighting
          let isMst = mstEdgesToShow.some(me => (me.u === edge.u && me.v === edge.v) || (me.u === edge.v && me.v === edge.u));
          
          let isPath = false;
          for (let i = 0; i < activePath.length - 1; i++) {
            if ((activePath[i] === edge.u && activePath[i+1] === edge.v) || (activePath[i] === edge.v && activePath[i+1] === edge.u)) {
              isPath = true;
            }
          }

          let isEvaluating = edgeEvaluated.some(e => (e.from === edge.u && e.to === edge.v) || (e.from === edge.v && e.to === edge.u));

          let strokeClass = 'stroke-slate-800';
          if (isPath) strokeClass = 'stroke-cyber-orange stroke-3 [filter:drop-shadow(0_0_4px_#ff5500)]';
          else if (isMst) strokeClass = 'stroke-amber-500 stroke-3 [filter:drop-shadow(0_0_4px_#802000)]';
          else if (isEvaluating) strokeClass = 'stroke-yellow-400 stroke-2 animate-pulse';

          return (
            <g key={idx}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className={`transition-all ${strokeClass}`} />
              <text x={(p1.x + p2.x)/2} y={(p1.y + p2.y)/2 - 3} className="text-[8px] font-mono fill-slate-500 text-center">{edge.weight}ms</text>
            </g>
          );
        })}

        {/* Draw Vertices */}
        {vertices.map(v => {
          const pos = nodePositions[v];
          if (!pos) return null;

          let isVisited = visitedNodes.includes(v);
          let isStart = v === startUser;
          let isEnd = v === endUser;

          let nodeClass = 'fill-cyber-charcoal stroke-slate-700';
          if (isStart) nodeClass = 'fill-cyber-orange/10 stroke-cyber-orange shadow-glow-orange';
          else if (isEnd) nodeClass = 'fill-amber-500/10 stroke-amber-500';
          else if (isVisited) nodeClass = 'fill-cyber-orange/20 stroke-cyber-orange';

          return (
            <g key={v}>
              <circle cx={pos.x} cy={pos.y} r={12} className={`stroke-2 transition-all ${nodeClass}`} />
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" className="text-[8px] font-bold font-tech fill-slate-200">{v}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  // SVG Render Helper for Scheduled Message binary Min-Heap
  const renderHeapSvg = () => {
    if (!heapData?.nodes) return null;
    const { nodes, links } = heapData;

    const width = 600;
    const height = 300;
    const nodePositions = {};

    // Helper positions for complete binary tree index layout
    const getCoordinates = (index, total) => {
      let depth = Math.floor(Math.log2(index + 1));
      let itemsInRow = Math.pow(2, depth);
      let posInRow = index - (itemsInRow - 1);
      
      let y = 35 + depth * 55;
      let x = (width / (itemsInRow + 1)) * (posInRow + 1);
      return { x, y };
    };

    nodes.forEach((n, idx) => {
      nodePositions[n.id] = getCoordinates(idx, nodes.length);
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-72 border border-cyber-orange/10 bg-cyber-black rounded-xl">
        {/* Draw Links */}
        {links.map((link, idx) => {
          const p1 = nodePositions[link.source];
          const p2 = nodePositions[link.target];
          if (!p1 || !p2) return null;
          return (
            <line
              key={idx}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              className="stroke-slate-800 stroke-2"
            />
          );
        })}

        {/* Draw Nodes */}
        {nodes.map((node, index) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          return (
            <g key={node.id}>
              <circle
                cx={pos.x} cy={pos.y} r={13}
                className={`stroke-2 ${
                  index === 0 
                    ? 'fill-cyber-orange/10 stroke-cyber-orange [filter:drop-shadow(0_0_4px_#ff5500)]' 
                    : 'fill-cyber-charcoal stroke-slate-700'
                }`}
              />
              <text
                x={pos.x} y={pos.y + 3}
                textAnchor="middle"
                className="text-[8px] font-bold font-mono fill-slate-200"
              >
                [{node.index}]
              </text>
              {/* Tooltip text for heap element */}
              <text
                x={pos.x} y={pos.y + 24}
                textAnchor="middle"
                className="text-[7px] font-mono fill-cyber-orange font-bold uppercase"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex-1 h-screen flex flex-col p-4 bg-cyber-black overflow-y-auto relative scanlines z-10 text-left">
      <div className="cyber-grid"></div>

      {/* Header Panel */}
      <div className="relative z-10 p-4 rounded-xl border border-cyber-orange/15 bg-cyber-charcoal/80 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyber-orange animate-pulse" />
          <h2 className="text-sm font-bold tracking-widest text-white uppercase">DSA & DAA Core Subsystems</h2>
        </div>
        <div className="text-[10px] font-tech text-slate-400 uppercase tracking-widest">
          Quantum Computing Engine Link: <span className="text-cyber-orange font-bold">ACCELERATED</span>
        </div>
      </div>

      {/* Tab Switcher Headers */}
      <div className="relative z-10 flex gap-1 bg-cyber-charcoal/60 p-1 rounded-xl border border-cyber-orange/5 mb-4">
        {[
          { id: 'trie', label: 'Trie Tree', icon: GitBranch },
          { id: 'graph', label: 'Dijkstra / MST', icon: Share2 },
          { id: 'huffman', label: 'Huffman Code', icon: Layers },
          { id: 'heap', label: 'Heap Queue', icon: HardDrive },
          { id: 'edit', label: 'DP Matrix', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-tech uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-cyber-orange text-white shadow-glow-orange font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        
        {/* Left Visualizer Canvas (Spans 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-cyber-orange/10 pb-2">
            <span className="text-[10px] font-tech text-cyber-orange uppercase tracking-widest">Interactive Sandbox Output</span>
            
            {/* Playback Controls (visible only on Graph tab) */}
            {activeTab === 'graph' && networkData && (
              <div className="flex items-center gap-2">
                <button
                  onClick={runDijkstraPathfinder}
                  className="px-2 py-1 text-[9px] font-tech bg-cyber-orange/10 text-cyber-orange border border-cyber-orange/20 rounded uppercase hover:bg-cyber-orange hover:text-white transition-all"
                >
                  Run Dijkstra
                </button>
                <button
                  onClick={runKruskalMST}
                  className="px-2 py-1 text-[9px] font-tech bg-cyber-orange/10 text-cyber-orange border border-cyber-orange/20 rounded uppercase hover:bg-cyber-orange hover:text-white transition-all"
                >
                  Run Kruskal MST
                </button>
                {playbackMode && (
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1 rounded bg-cyber-gray border border-cyber-orange/15 text-white"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )}

            <button onClick={loadTabLogs} className="p-1.5 rounded hover:bg-cyber-orange/10 text-slate-400 hover:text-white">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SVG Visualizer Rendering */}
          <div className="flex-1 flex items-center justify-center min-h-[280px]">
            {activeTab === 'trie' && renderTrieSvg()}
            {activeTab === 'huffman' && renderHuffmanSvg()}
            {activeTab === 'graph' && renderGraphSvg()}
            {activeTab === 'heap' && renderHeapSvg()}
            {activeTab === 'edit' && editData && (
              <div className="w-full overflow-x-auto p-2">
                <div className="text-[10px] font-tech text-cyber-orange uppercase mb-2">Edit Operations Trace: {word1} &rarr; {word2}</div>
                <table className="border-collapse mx-auto text-[10px] font-mono">
                  <thead>
                    <tr>
                      <th className="border border-cyber-orange/20 p-2 bg-cyber-black text-slate-500"></th>
                      <th className="border border-cyber-orange/20 p-2 bg-cyber-black text-slate-500">ø</th>
                      {word2.split('').map((char, c) => (
                        <th key={c} className="border border-cyber-orange/20 p-2 bg-cyber-black text-white">{char}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editData.matrix.map((row, r) => (
                      <tr key={r}>
                        <td className="border border-cyber-orange/20 p-2 bg-cyber-black text-white font-bold">
                          {r === 0 ? 'ø' : word1[r - 1]}
                        </td>
                        {row.map((val, c) => {
                          const isPathCell = editData.path.some(p => p.r === r && p.c === c);
                          return (
                            <td 
                              key={c}
                              className={`border border-cyber-orange/20 p-2 text-center transition-all ${
                                isPathCell 
                                  ? 'bg-cyber-orange/25 text-white font-bold [filter:drop-shadow(0_0_1px_#ff5500)]' 
                                  : 'bg-cyber-black/40 text-slate-400'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Info Details panel (Spans 1 col) */}
        <div className="rounded-2xl glass-panel p-4 flex flex-col justify-between text-xs space-y-4">
          <div>
            <div className="text-[10px] font-tech text-cyber-orange uppercase tracking-widest border-b border-cyber-orange/10 pb-1 mb-2">
              Parameters & Diagnostics
            </div>

            {/* Content for Trie */}
            {activeTab === 'trie' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-tech text-slate-500 uppercase">Search Query Prefix</label>
                  <input
                    type="text"
                    value={trieQuery}
                    onChange={(e) => setTrieQuery(e.target.value)}
                    className="w-full px-2 py-1.5 bg-cyber-black border border-cyber-orange/20 rounded text-white focus:outline-none focus:border-cyber-orange"
                  />
                </div>
                <div className="space-y-1 bg-cyber-black/40 rounded-xl p-3 border border-cyber-orange/10">
                  <span className="text-[9px] font-tech text-slate-400 uppercase">Matching Contacts</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto mt-1">
                    {trieData?.matches?.map((m, idx) => (
                      <div key={idx} className="font-mono text-emerald-500">&gt; {m.username}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content for Huffman */}
            {activeTab === 'huffman' && huffmanData && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-tech text-slate-500 uppercase">Payload Input Text</label>
                  <input
                    type="text"
                    value={huffmanText}
                    onChange={(e) => setHuffmanText(e.target.value)}
                    className="w-full px-2 py-1.5 bg-cyber-black border border-cyber-orange/20 rounded text-white focus:outline-none focus:border-cyber-orange"
                  />
                  <button onClick={loadHuffman} className="w-full mt-1.5 py-1 text-[9px] font-tech text-white bg-cyber-orange hover:bg-cyber-orange/80 rounded uppercase">Recalculate</button>
                </div>

                <div className="bg-cyber-black/40 rounded-xl p-3 border border-cyber-orange/10 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-tech uppercase">Original Bits (8-bit ASCII):</span>
                    <span className="font-mono text-white font-bold">{huffmanData.stats.originalBits}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-tech uppercase">Compressed Bits (Huffman):</span>
                    <span className="font-mono text-cyber-orange font-bold">{huffmanData.stats.compressedBits}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-cyber-orange/15 pt-1.5 text-[11px]">
                    <span className="text-slate-300 font-tech uppercase font-bold">Space Savings:</span>
                    <span className="font-tech text-emerald-500 font-bold text-glow-green">{huffmanData.stats.compressionRatio}% Saved</span>
                  </div>
                </div>
              </div>
            )}

            {/* Content for Edit Distance */}
            {activeTab === 'edit' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-tech text-slate-500 uppercase">Word 1</label>
                    <input
                      type="text"
                      value={word1}
                      onChange={(e) => setWord1(e.target.value)}
                      className="w-full px-2 py-1 bg-cyber-black border border-cyber-orange/20 rounded text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[8px] font-tech text-slate-500 uppercase">Word 2</label>
                    <input
                      type="text"
                      value={word2}
                      onChange={(e) => setWord2(e.target.value)}
                      className="w-full px-2 py-1 bg-cyber-black border border-cyber-orange/20 rounded text-white focus:outline-none"
                    />
                  </div>
                </div>
                <button onClick={loadEditDistance} className="w-full py-1 text-[9px] font-tech text-white bg-cyber-orange hover:bg-cyber-orange/80 rounded uppercase">Compute DP Table</button>

                {editData && (
                  <div className="bg-cyber-black/40 rounded-xl p-3 border border-cyber-orange/10 text-left">
                    <div className="text-[10px] text-slate-400 font-tech uppercase mb-1">Traceback alignment:</div>
                    <div className="font-mono text-[10px] text-emerald-500 space-y-0.5">
                      {editData.path.map((p, idx) => (
                        <div key={idx}>Step {idx}: Cell ({p.r},{p.c}) &rarr; {p.op}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content for Network Graph */}
            {activeTab === 'graph' && networkData && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-tech text-slate-500 uppercase">Start Vertex</label>
                    <select
                      value={startUser}
                      onChange={(e) => setStartUser(e.target.value)}
                      className="w-full px-2 py-1 bg-cyber-black border border-cyber-orange/20 rounded text-white focus:outline-none text-[10px]"
                    >
                      {networkData.vertices.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[8px] font-tech text-slate-500 uppercase">End Vertex</label>
                    <select
                      value={endUser}
                      onChange={(e) => setEndUser(e.target.value)}
                      className="w-full px-2 py-1 bg-cyber-black border border-cyber-orange/20 rounded text-white focus:outline-none text-[10px]"
                    >
                      {networkData.vertices.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={loadNetwork} className="w-full py-1 text-[9px] font-tech text-white bg-cyber-orange hover:bg-cyber-orange/80 rounded uppercase">Recalculate Routes</button>

                {dijkstraPlayback && playbackMode === 'dijkstra' && (
                  <div className="bg-cyber-black/40 rounded-xl p-3 border border-cyber-orange/10 space-y-1 text-left">
                    <span className="text-[9px] font-tech text-cyber-orange uppercase font-bold">Dijkstra Playback Log</span>
                    <div className="text-[10px] font-mono text-slate-300">
                      Step {dijkstraPlayback.currentStep + 1}/{dijkstraPlayback.steps.length} <br />
                      Current Node evaluated: {dijkstraPlayback.steps[dijkstraPlayback.currentStep]?.currentNode || 'None'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content for Min-Heap Scheduler */}
            {activeTab === 'heap' && heapData && (
              <div className="space-y-3">
                <span className="text-[9px] font-tech text-slate-400 uppercase">Linear heap array:</span>
                <div className="grid grid-cols-4 gap-2 bg-cyber-black/40 p-2 rounded-xl border border-cyber-orange/10 font-mono text-center text-[10px]">
                  {heapData.nodes.map((node, index) => (
                    <div key={index} className="p-1 rounded bg-cyber-charcoal border border-cyber-orange/10 text-white">
                      idx:{index} <br />
                      <span className="text-cyber-orange text-[9px] font-bold">{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-cyber-orange/15 pt-3 flex items-center justify-between text-[9px] font-tech uppercase text-slate-500">
            <span>Subsystem check</span>
            <span className="text-emerald-500 font-bold text-glow-green">C++ accelerated</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DsaVisualizer;

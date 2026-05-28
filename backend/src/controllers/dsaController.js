import User from '../models/User.js';
import Message from '../models/Message.js';
import Group from '../models/Group.js';
import ScheduledMessage from '../models/ScheduledMessage.js';
import { 
  runTrie, 
  runHuffman, 
  runEditDistance, 
  runNetwork, 
  runScheduler,
  isCxxEnabled
} from '../services/cppEngine.js';
import { getSmartReplySuggestions, SUGGESTION_TEMPLATES } from '../algorithms/editDistance.js';

export const getTrieVisual = async (req, res) => {
  try {
    const { query = '' } = req.query;
    
    // Fetch all users to construct the Trie
    const users = await User.find({});
    const usernames = users.map(u => u.username);
    
    const result = runTrie(query, usernames);

    res.json({
      success: true,
      data: {
        visualization: result.visualization,
        matches: result.matches,
        engine: isCxxEnabled() ? 'C++' : 'JavaScript Fallback'
      }
    });
  } catch (error) {
    console.error('Trie visual error:', error);
    res.status(500).json({ success: false, message: 'Trie compilation error' });
  }
};

export const getHuffmanVisual = async (req, res) => {
  try {
    const { text = 'nebula chat protocol operational' } = req.body;
    
    const result = runHuffman(text);
    
    res.json({
      success: true,
      data: {
        ...result,
        engine: isCxxEnabled() ? 'C++' : 'JavaScript Fallback'
      }
    });
  } catch (error) {
    console.error('Huffman visual error:', error);
    res.status(500).json({ success: false, message: 'Huffman encoding failed' });
  }
};

export const getEditDistanceVisual = async (req, res) => {
  try {
    const { word1 = 'hi', word2 = 'hello' } = req.body;
    
    const result = runEditDistance(word1, word2);
    
    res.json({
      success: true,
      data: {
        word1,
        word2,
        distance: result.distance,
        matrix: result.matrix,
        path: result.path,
        engine: isCxxEnabled() ? 'C++' : 'JavaScript Fallback'
      }
    });
  } catch (error) {
    console.error('Edit distance visual error:', error);
    res.status(500).json({ success: false, message: 'Edit distance matrix error' });
  }
};

export const getSmartReplies = async (req, res) => {
  try {
    const { text = '' } = req.body;
    const suggestions = getSmartReplySuggestions(text, SUGGESTION_TEMPLATES);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Smart replies error:', error);
    res.status(500).json({ success: false, message: 'Autocorrect suggestions failed' });
  }
};

export const getNetworkVisual = async (req, res) => {
  try {
    const { startUser = '', endUser = '' } = req.query;

    const users = await User.find({});
    const messages = await Message.find({});
    const groups = await Group.find({ isRoom: true });

    // Construct flat edges list
    const conversationCounts = {};
    messages.forEach(msg => {
      if (msg.sender && msg.recipient) {
        const u1 = users.find(u => u._id.toString() === msg.sender.toString())?.username;
        const u2 = users.find(u => u._id.toString() === msg.recipient.toString())?.username;

        if (u1 && u2) {
          const key = [u1, u2].sort().join('-');
          conversationCounts[key] = (conversationCounts[key] || 0) + 1;
        }
      }
    });

    const edges = [];

    // Populate graph edges based on direct communication count
    for (let key in conversationCounts) {
      const [u1, u2] = key.split('-');
      const count = conversationCounts[key];
      const weight = Math.max(1, 10 - Math.floor(count / 2));
      edges.push({ u: u1, v: u2, weight, roomName: 'Direct Chat' });
    }

    // Seed dummy connections between some users to ensure the graph is connected and interesting
    if (users.length >= 3) {
      for (let i = 0; i < users.length; i++) {
        const u1 = users[i].username;
        const u2 = users[(i + 1) % users.length].username;
        const u3 = users[(i + 2) % users.length].username;
        
        // Add if not already present
        if (!edges.some(e => (e.u === u1 && e.v === u2) || (e.u === u2 && e.v === u1))) {
          edges.push({ u: u1, v: u2, weight: 8, roomName: 'Sector Direct' });
        }
        if (!edges.some(e => (e.u === u2 && e.v === u3) || (e.u === u3 && e.v === u2))) {
          edges.push({ u: u2, v: u3, weight: 6, roomName: 'Grid Sector' });
        }
      }
    }

    // Add connections for active groups/rooms
    for (let grp of groups) {
      const creatorName = users.find(u => u._id.toString() === grp.createdBy.toString())?.username;
      if (creatorName) {
        users.slice(0, 4).forEach(u => {
          if (u.username !== creatorName) {
            if (!edges.some(e => (e.u === creatorName && e.v === u.username) || (e.u === u.username && e.v === creatorName))) {
              edges.push({ u: creatorName, v: u.username, weight: 4, roomName: grp.name });
            }
          }
        });
      }
    }

    const result = runNetwork(startUser, endUser, edges);

    res.json({
      success: true,
      data: {
        ...result,
        engine: isCxxEnabled() ? 'C++' : 'JavaScript Fallback'
      }
    });
  } catch (error) {
    console.error('Network visual error:', error);
    res.status(500).json({ success: false, message: 'Dijkstra / MST path computation error' });
  }
};

export const getSchedulerVisual = async (req, res) => {
  try {
    const list = await ScheduledMessage.find({ isSent: false });
    
    // We get names for visual representation
    const populated = [];
    for (let item of list) {
      populated.push({
        _id: item._id,
        content: item.content,
        sendAt: item.sendAt,
        recipientName: item.recipientName || 'User'
      });
    }

    const result = runScheduler(populated);

    res.json({
      success: true,
      data: {
        ...result,
        engine: isCxxEnabled() ? 'C++' : 'JavaScript Fallback'
      }
    });
  } catch (error) {
    console.error('Scheduler visual error:', error);
    res.status(500).json({ success: false, message: 'Scheduler priority queue lookup error' });
  }
};

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { api } from '../../utils/api.js';
import { createRateLimiter } from '../../utils/validators.js';
import { 
  Search, Users, MessageSquare, Terminal, Power, LogOut, 
  Smile, Radio, Sliders, Battery, ChevronRight 
} from 'lucide-react';

export const SideBar = ({ 
  selectedChat, 
  setSelectedChat, 
  activeTab, 
  setActiveTab 
}) => {
  const { user, logout, updateProfile } = useAuth();
  const socket = useSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [chats, setChats] = useState({ rooms: [], groups: [], direct: [] });
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [profileStatus, setProfileStatus] = useState(user?.status || '');
  const [profileMood, setProfileMood] = useState(user?.mood || 'cyber');
  const [profileEnergy, setProfileEnergy] = useState(user?.energyLevel || 80);
  
  // Rate limiters
  const searchLimiter = useRef(createRateLimiter(2, 2000)).current; // 2 per 2 seconds
  const fetchChatsLimiter = useRef(createRateLimiter(1, 5000)).current; // 1 per 5 seconds

  useEffect(() => {
    fetchChats();
  }, [selectedChat]);

  // Handle Socket.IO presence events
  useEffect(() => {
    if (!socket) return;

    const handleStatusChange = (data) => {
      // data: { userId, isOnline }
      setChats(prev => {
        const updatedDirect = prev.direct.map(d => {
          if (d._id === data.userId) {
            return { ...d, isOnline: data.isOnline, lastSeen: data.lastSeen || new Date() };
          }
          return d;
        });
        return { ...prev, direct: updatedDirect };
      });
    };

    const handleProfileUpdate = (data) => {
      // data: { userId, username, avatar, status, mood, energyLevel }
      setChats(prev => {
        const updatedDirect = prev.direct.map(d => {
          if (d._id === data.userId) {
            return { 
              ...d, 
              status: data.status, 
              mood: data.mood, 
              energyLevel: data.energyLevel,
              avatar: data.avatar || d.avatar
            };
          }
          return d;
        });
        return { ...prev, direct: updatedDirect };
      });
    };

    socket.on('user_status_change', handleStatusChange);
    socket.on('user_profile_updated', handleProfileUpdate);

    return () => {
      socket.off('user_status_change', handleStatusChange);
      socket.off('user_profile_updated', handleProfileUpdate);
    };
  }, [socket]);

  // Trie Search Trigger on Input change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchChats = async () => {
    if (!fetchChatsLimiter()) {
      console.warn('Fetch chats rate limited');
      return;
    }
    try {
      const res = await api.get('/api/chat/chats');
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const performSearch = async () => {
    if (!searchLimiter()) {
      console.warn('Search rate limited');
      return;
    }
    try {
      const res = await api.get(`/api/dsa/trie?query=${encodeURIComponent(searchQuery)}`);
      if (res.data.success) {
        setSearchResults(res.data.data.matches);
      }
    } catch (err) {
      console.error('Trie search failed:', err);
      setSearchResults([]);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({
        status: profileStatus,
        mood: profileMood,
        energyLevel: Number(profileEnergy)
      });
      if (res.success) {
        setShowProfileCard(false);
        // Broadcast profile change via Socket.io
        if (socket) {
          socket.emit('update_profile_status', {
            userId: user._id,
            username: user.username,
            avatar: user.avatar,
            status: profileStatus,
            mood: profileMood,
            energyLevel: Number(profileEnergy)
          });
        }
      }
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  const startDirectChat = (contact) => {
    setSelectedChat({
      type: 'direct',
      id: contact._id,
      name: contact.username,
      avatar: contact.avatar,
      status: contact.status,
      mood: contact.mood,
      energyLevel: contact.energyLevel,
      isOnline: contact.isOnline
    });
    setActiveTab('chat');
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="w-80 h-screen bg-cyber-charcoal border-r border-cyber-orange/15 flex flex-col relative z-20">
      
      {/* App Logo */}
      <div className="p-4 border-b border-cyber-orange/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyber-orange/15 flex items-center justify-center border border-cyber-orange shadow-glow-orange animate-pulse">
            <Radio className="w-4 h-4 text-cyber-orange" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-glow-orange text-white">NEBULA</h1>
            <p className="text-[9px] text-cyber-orange font-tech uppercase tracking-widest leading-none">Quantum Node</p>
          </div>
        </div>

        {/* C++ engine status indicator */}
        <div className="flex items-center gap-1 bg-cyber-black px-2 py-0.5 rounded border border-cyber-orange/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[8px] font-tech text-emerald-500 uppercase tracking-widest">C++ ON</span>
        </div>
      </div>

      {/* Trie-Search bar */}
      <div className="p-3 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Trie Search Prefix..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl glass-input placeholder-slate-500"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-tech text-cyber-orange uppercase hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Trie Search Overlay Results */}
        {searchQuery && (
          <div className="absolute left-3 right-3 mt-1.5 glass-panel-heavy rounded-xl p-2 border border-cyber-orange shadow-glow-orange max-h-60 overflow-y-auto z-30">
            <div className="text-[8px] font-tech text-cyber-orange uppercase tracking-wider mb-2 border-b border-cyber-orange/15 pb-1">
              Trie prefix matches found: {searchResults.length}
            </div>
            {searchResults.length > 0 ? (
              searchResults.map(contact => (
                <button
                  key={contact._id}
                  onClick={() => startDirectChat(contact)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-cyber-orange/10 text-left transition-all"
                >
                  <img src={contact.avatar} alt="avatar" className="w-8 h-8 rounded-lg bg-cyber-gray border border-cyber-orange/20" />
                  <div>
                    <div className="text-xs font-bold text-white">{contact.username}</div>
                    <div className="text-[10px] text-slate-400 truncate w-44">{contact.status}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyber-orange ml-auto" />
                </button>
              ))
            ) : (
              <div className="text-[10px] text-slate-400 p-2 text-center">No terminal prefix coordinates match.</div>
            )}
          </div>
        )}
      </div>

      {/* Main Switch Toggles */}
      <div className="px-3 py-1 flex gap-2">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-tech uppercase tracking-wider border transition-all ${
            activeTab === 'chat'
              ? 'bg-cyber-orange/10 text-cyber-orange border-cyber-orange shadow-glow-orange'
              : 'bg-transparent text-slate-400 border-cyber-orange/10 hover:text-white hover:border-cyber-orange/25'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Comms
        </button>

        <button
          onClick={() => setActiveTab('dsa')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-tech uppercase tracking-wider border transition-all ${
            activeTab === 'dsa'
              ? 'bg-cyber-orange/10 text-cyber-orange border-cyber-orange shadow-glow-orange'
              : 'bg-transparent text-slate-400 border-cyber-orange/10 hover:text-white hover:border-cyber-orange/25'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          DSA Core
        </button>
      </div>

      {/* Conversations Navigation List (Visible only when Comms tab is selected) */}
      {activeTab === 'chat' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Public trending chatrooms */}
          <div className="space-y-1">
            <h2 className="text-[9px] font-tech text-cyber-orange uppercase tracking-wider pl-1 mb-1.5 flex items-center justify-between">
              <span>Trending Channels</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-orange animate-ping"></span>
            </h2>
            {chats.rooms.map(room => (
              <button
                key={room._id}
                onClick={() => setSelectedChat({
                  type: 'room',
                  id: room._id,
                  name: room.name,
                  description: room.description,
                  avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${room.name}&colors[]=ff5500`,
                  activityIndex: room.activityIndex || 30
                })}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                  selectedChat?.id === room._id
                    ? 'bg-cyber-orange/10 border-cyber-orange/45 text-white shadow-glow-orange'
                    : 'bg-transparent border-transparent hover:bg-cyber-gray/30 hover:border-cyber-orange/10 text-slate-300'
                }`}
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-lg bg-cyber-black flex items-center justify-center border border-cyber-orange/15 font-tech text-xs text-cyber-orange font-bold uppercase">
                    #
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    {room.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{room.description || 'Virtual discussion node'}</div>
                </div>

                {/* activity level bubble */}
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-tech text-cyber-orange/80 uppercase">Activity</span>
                  <span className="text-[9px] font-tech font-bold text-glow-orange text-cyber-orange">{room.activityIndex || 30}%</span>
                </div>
              </button>
            ))}
          </div>

          {/* Direct chats list */}
          <div className="space-y-1">
            <h2 className="text-[9px] font-tech text-slate-400 uppercase tracking-wider pl-1 mb-1.5">Direct Connections</h2>
            {chats.direct.length > 0 ? (
              chats.direct.map(contact => (
                <button
                  key={contact._id}
                  onClick={() => startDirectChat(contact)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    selectedChat?.id === contact._id
                      ? 'bg-cyber-orange/10 border-cyber-orange/45 text-white shadow-glow-orange'
                      : 'bg-transparent border-transparent hover:bg-cyber-gray/30 hover:border-cyber-orange/10 text-slate-300'
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={contact.avatar} 
                      alt="avatar" 
                      className={`w-9 h-9 rounded-lg bg-cyber-black border transition-all ${
                        contact.isOnline ? 'border-emerald-500 shadow-glow-green' : 'border-cyber-orange/10'
                      }`}
                    />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-cyber-charcoal ${
                      contact.isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}></span>
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-bold text-slate-100 truncate">{contact.username}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {contact.lastMessage ? contact.lastMessage.content : contact.status}
                    </div>
                  </div>

                  {/* energy visual tag */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <Battery className={`w-3.5 h-3.5 ${contact.energyLevel > 50 ? 'text-emerald-500' : 'text-cyber-orange'}`} />
                    <span className="text-[8px] font-tech text-slate-400">{contact.energyLevel}%</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-[10px] text-slate-500 p-2 text-center">No active direct connection links.</div>
            )}
          </div>
        </div>
      )}

      {/* DSA core menu listing (Visible when DSA Core tab is selected) */}
      {activeTab === 'dsa' && (
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          <div className="text-[9px] font-tech text-cyber-orange uppercase tracking-widest pl-1 mb-2">Core Algorithms Panel</div>
          <p className="text-[10px] text-slate-400 px-2 pb-2 leading-relaxed">
            Select a core subsystem visualizer below to monitor, analyze, and playback native C++ algorithm trace outputs.
          </p>
          <div className="border border-cyber-orange/20 rounded-xl p-2 bg-cyber-black/40 space-y-1">
            <div className="text-[9px] text-slate-500 font-tech uppercase px-2 py-1">Direct Debug Links</div>
            <div className="text-xs text-slate-300 font-tech p-2 hover:bg-cyber-orange/5 rounded-lg flex items-center justify-between cursor-pointer" onClick={() => setSelectedChat({ type: 'dsa_visualizer', dsaTab: 'trie' })}>
              <span>1. Trie search path</span>
              <span className="text-[8px] text-cyber-orange font-bold px-1.5 py-0.5 rounded bg-cyber-orange/10">Trie</span>
            </div>
            <div className="text-xs text-slate-300 font-tech p-2 hover:bg-cyber-orange/5 rounded-lg flex items-center justify-between cursor-pointer" onClick={() => setSelectedChat({ type: 'dsa_visualizer', dsaTab: 'graph' })}>
              <span>2. Dijkstra & MST graph</span>
              <span className="text-[8px] text-cyber-orange font-bold px-1.5 py-0.5 rounded bg-cyber-orange/10">Kruskal</span>
            </div>
            <div className="text-xs text-slate-300 font-tech p-2 hover:bg-cyber-orange/5 rounded-lg flex items-center justify-between cursor-pointer" onClick={() => setSelectedChat({ type: 'dsa_visualizer', dsaTab: 'huffman' })}>
              <span>3. Huffman bit coder</span>
              <span className="text-[8px] text-cyber-orange font-bold px-1.5 py-0.5 rounded bg-cyber-orange/10">Greedy</span>
            </div>
            <div className="text-xs text-slate-300 font-tech p-2 hover:bg-cyber-orange/5 rounded-lg flex items-center justify-between cursor-pointer" onClick={() => setSelectedChat({ type: 'dsa_visualizer', dsaTab: 'heap' })}>
              <span>4. Scheduler Priority Queue</span>
              <span className="text-[8px] text-cyber-orange font-bold px-1.5 py-0.5 rounded bg-cyber-orange/10">Heap</span>
            </div>
            <div className="text-xs text-slate-300 font-tech p-2 hover:bg-cyber-orange/5 rounded-lg flex items-center justify-between cursor-pointer" onClick={() => setSelectedChat({ type: 'dsa_visualizer', dsaTab: 'edit' })}>
              <span>5. DP Edit Distance reply</span>
              <span className="text-[8px] text-cyber-orange font-bold px-1.5 py-0.5 rounded bg-cyber-orange/10">DP</span>
            </div>
          </div>
        </div>
      )}

      {/* User profile capsule at bottom */}
      {user && (
        <div className="p-3 border-t border-cyber-orange/10 bg-cyber-black/60 relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowProfileCard(!showProfileCard)}
              className="relative focus:outline-none hover:scale-105 transition-all"
            >
              <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-lg bg-cyber-gray border border-cyber-orange/20 shadow-glow-orange" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-cyber-charcoal"></span>
            </button>
            
            <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => setShowProfileCard(!showProfileCard)}>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                {user.username}
              </div>
              
              {/* Energy bar preview */}
              <div className="mt-1 flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-cyber-gray rounded-full overflow-hidden border border-cyber-orange/5">
                  <div 
                    className="h-full bg-gradient-to-r from-cyber-orange to-cyber-amber rounded-full"
                    style={{ width: `${user.energyLevel}%` }}
                  ></div>
                </div>
                <span className="text-[8px] font-tech text-cyber-orange font-bold">{user.energyLevel}%</span>
              </div>
            </div>

            <button 
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
              title="Logout connection"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Profile Customizer Drop-up Card */}
          {showProfileCard && (
            <div className="absolute bottom-16 left-3 right-3 p-4 rounded-xl glass-panel-heavy border border-cyber-orange shadow-glow-orange-lg z-50 animate-slide-up">
              <div className="text-xs font-tech text-cyber-orange uppercase tracking-wider mb-3 pb-1 border-b border-cyber-orange/15 flex items-center justify-between">
                <span>Update Node profile</span>
                <button onClick={() => setShowProfileCard(false)} className="text-[9px] hover:text-white uppercase">Close</button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[8px] font-tech text-slate-400 uppercase">Status Message</label>
                  <input
                    type="text"
                    value={profileStatus}
                    onChange={(e) => setProfileStatus(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded bg-cyber-black border border-cyber-orange/20 text-white focus:outline-none focus:border-cyber-orange"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[8px] font-tech text-slate-400 uppercase">Node Mood Color</label>
                  <select
                    value={profileMood}
                    onChange={(e) => setProfileMood(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded bg-cyber-black border border-cyber-orange/20 text-white focus:outline-none focus:border-cyber-orange"
                  >
                    <option value="cyber">Cyberpunk Orange</option>
                    <option value="neon">Neon Mint Green</option>
                    <option value="amber">Burnt Amber</option>
                    <option value="deep">Carbon Blue</option>
                    <option value="minimal">Silver Minimal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] font-tech text-slate-400 uppercase">
                    <span>Energy Level Indicator</span>
                    <span className="text-cyber-orange font-bold">{profileEnergy}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={profileEnergy}
                    onChange={(e) => setProfileEnergy(e.target.value)}
                    className="w-full accent-cyber-orange h-1 bg-cyber-black rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 font-tech text-[10px] font-bold text-white bg-cyber-orange hover:bg-cyber-orange/80 rounded transition-all uppercase tracking-wider mt-2"
                >
                  Save Coordinates
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default SideBar;

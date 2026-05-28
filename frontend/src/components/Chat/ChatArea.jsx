import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { api } from '../../utils/api.js';
import { sanitizeMessageContent, sanitizeText } from '../../utils/sanitizer.js';
import { isValidMessage, createRateLimiter } from '../../utils/validators.js';
import { 
  Send, Smile, Paperclip, Clock, Trash2, Edit2, 
  Trash, ChevronDown, Mic, Radio, Sparkles, BookOpen, AlertCircle
} from 'lucide-react';
import { SchedulerModal } from './SchedulerModal.jsx';
import { MoodCustomizer } from './MoodCustomizer.jsx';

export const ChatArea = ({ selectedChat }) => {
  const { user } = useAuth();
  const socket = useSocket();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [disappearingTime, setDisappearingTime] = useState(0); // 0 = disabled
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // messageId
  const [editingMessage, setEditingMessage] = useState(null); // { id, text }
  const [smartReplies, setSmartReplies] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [chatTheme, setChatTheme] = useState('cyber'); // cyber, neon, amber, deep, minimal
  const [loading, setLoading] = useState(false);
  
  // Custom panels
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(true);
  const [notes, setNotes] = useState('// COLLABORATION NODE NOTES\n- Mission briefing scheduled for 1800h\n- Security patch v4.9 deployed successfully\n- Encryption key rotated');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Rate limiters for API calls
  const sendMessageLimiter = useRef(createRateLimiter(3, 1000)).current; // 3 per second
  const uploadLimiter = useRef(createRateLimiter(2, 5000)).current; // 2 per 5 seconds

  useEffect(() => {
    if (!selectedChat) return;

    fetchMessages();
    setSmartReplies([]);
    
    // Join socket channel for group/room
    if (socket) {
      if (selectedChat.type === 'room') {
        socket.emit('join_room', selectedChat.id);
      }
    }

    return () => {
      if (socket && selectedChat.type === 'room') {
        socket.emit('leave_room', selectedChat.id);
      }
    };
  }, [selectedChat, socket]);

  useEffect(() => {
    scrollToBottom();
    // Compute AI Smart replies based on the last message in feed
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender !== user._id && !lastMsg.deleted) {
        fetchSmartReplies(lastMsg.content);
      } else {
        setSmartReplies([]);
      }
    }
  }, [messages]);

  // Hook up Socket events for real-time delivery
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg) => {
      // Check if message belongs to current selected conversation
      const isCurrentDM = selectedChat?.type === 'direct' && 
                          !msg.group && 
                          (msg.sender === selectedChat.id || msg.recipient === selectedChat.id);
      
      const isCurrentRoom = selectedChat?.type === 'room' && 
                           msg.group && 
                           msg.group === selectedChat.id;

      if (isCurrentDM || isCurrentRoom) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTypingEvent = (data) => {
      if (selectedChat?.type === 'direct' && data.senderId === selectedChat.id && !data.groupId) {
        setTypingUser(data.isTyping ? data.senderName : null);
      } else if (selectedChat?.type === 'room' && data.groupId === selectedChat.id && data.senderId !== user._id) {
        setTypingUser(data.isTyping ? data.senderName : null);
      }
    };

    const handleMessageAction = (data) => {
      setMessages(prev => prev.map(m => {
        if (m._id === data.messageId) {
          if (data.action === 'delete') {
            return { ...m, content: 'Message was deleted', deleted: true };
          }
          if (data.action === 'edit') {
            return { ...m, content: data.content, edited: true };
          }
        }
        return m;
      }));
    };

    socket.on('receive_message', handleIncomingMessage);
    socket.on('typing', handleTypingEvent);
    socket.on('message_action', handleMessageAction);

    return () => {
      socket.off('receive_message', handleIncomingMessage);
      socket.off('typing', handleTypingEvent);
      socket.off('message_action', handleMessageAction);
    };
  }, [socket, selectedChat]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const endpoint = selectedChat.type === 'room' 
        ? `/api/chat/messages?groupId=${selectedChat.id}`
        : `/api/chat/messages?partnerId=${selectedChat.id}`;
      
      const res = await api.get(endpoint);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmartReplies = async (text) => {
    try {
      const res = await api.post('/api/dsa/smart-replies', { text });
      if (res.data.success) {
        setSmartReplies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch smart replies:', err);
      setSmartReplies([]);
    }
  };

  const handleSend = async (textToSend = inputText) => {
    if (!textToSend.trim()) return;

    // Validate message
    if (!isValidMessage(textToSend)) {
      console.warn('Invalid message content');
      return;
    }

    // Check rate limit
    if (!sendMessageLimiter()) {
      console.warn('Message rate limit exceeded');
      return;
    }

    try {
      const payload = {
        content: textToSend
      };

      if (selectedChat.type === 'room') {
        payload.group = selectedChat.id;
      } else {
        payload.recipient = selectedChat.id;
      }

      const res = await api.post('/api/chat/send', payload);
      
      if (res.data.success) {
        const newMsg = {
          ...res.data.data,
          senderName: user.username,
          senderAvatar: user.avatar
        };

        setMessages(prev => [...prev, newMsg]);
        setInputText('');

        // Emit via socket
        if (socket) {
          socket.emit('send_message', newMsg);
          // Stop typing
          socket.emit('typing', {
            senderId: user._id,
            recipientId: selectedChat.type === 'direct' ? selectedChat.id : null,
            groupId: selectedChat.type === 'room' ? selectedChat.id : null,
            isTyping: false
          });
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);

    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        senderId: user._id,
        senderName: user.username,
        recipientId: selectedChat.type === 'direct' ? selectedChat.id : null,
        groupId: selectedChat.type === 'room' ? selectedChat.id : null,
        isTyping: true
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', {
        senderId: user._id,
        recipientId: selectedChat.type === 'direct' ? selectedChat.id : null,
        groupId: selectedChat.type === 'room' ? selectedChat.id : null,
        isTyping: false
      });
    }, 2000);
  };

  const handleEditMessage = async (msgId, newText) => {
    try {
      // Typically edits are PATCH/PUT, let's keep it simple and update local state + socket
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, content: newText, edited: true } : m));
      setEditingMessage(null);

      if (socket) {
        socket.emit('message_action', {
          messageId: msgId,
          action: 'edit',
          content: newText,
          recipientId: selectedChat.type === 'direct' ? selectedChat.id : null,
          groupId: selectedChat.type === 'room' ? selectedChat.id : null
        });
      }
    } catch (err) {
      console.error('Edit error:', err);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, content: 'Message was deleted', deleted: true } : m));
      
      if (socket) {
        socket.emit('message_action', {
          messageId: msgId,
          action: 'delete',
          recipientId: selectedChat.type === 'direct' ? selectedChat.id : null,
          groupId: selectedChat.type === 'room' ? selectedChat.id : null
        });
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleReaction = (msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if (m._id === msgId) {
        const reactions = [...m.reactions];
        const existIdx = reactions.findIndex(r => r.user === user._id);
        if (existIdx !== -1) {
          reactions[existIdx].emoji = emoji;
        } else {
          reactions.push({ user: user._id, emoji });
        }
        return { ...m, reactions };
      }
      return m;
    }));
    setShowEmojiPicker(null);
    // Expand to emit socket reaction in production
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Chat area background class based on theme choice
  const getThemeBackground = () => {
    switch (chatTheme) {
      case 'neon':
        return 'border-emerald-500/10 [background:radial-gradient(circle_at_bottom,rgba(16,185,129,0.05),transparent_60%)]';
      case 'amber':
        return 'border-amber-500/10 [background:radial-gradient(circle_at_bottom,rgba(245,158,11,0.05),transparent_60%)]';
      case 'deep':
        return 'border-blue-500/10 [background:radial-gradient(circle_at_bottom,rgba(59,130,246,0.05),transparent_60%)]';
      case 'minimal':
        return 'border-slate-500/10 [background:radial-gradient(circle_at_bottom,rgba(226,232,240,0.02),transparent_60%)]';
      default:
        return 'border-cyber-orange/10 [background:radial-gradient(circle_at_bottom,rgba(255,85,0,0.05),transparent_60%)]';
    }
  };

  const getThemeAccent = () => {
    switch (chatTheme) {
      case 'neon': return 'text-emerald-500';
      case 'amber': return 'text-amber-500';
      case 'deep': return 'text-blue-500';
      case 'minimal': return 'text-slate-300';
      default: return 'text-cyber-orange';
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center p-8 bg-cyber-black relative scanlines">
        <div className="cyber-grid"></div>
        <div className="text-center relative z-10 space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-cyber-orange/10 border border-cyber-orange/30 shadow-glow-orange flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Radio className="w-10 h-10 text-cyber-orange" />
          </div>
          <h3 className="text-2xl font-bold tracking-widest text-white uppercase">NEBULA COMMUNICATIONS</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
            Quantum encrypted transmission pipeline. Select a terminal sector channel or contact coordinate to begin sync.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 h-screen flex flex-col bg-cyber-black relative z-10 transition-all ${getThemeBackground()} overflow-hidden`}>
      <div className="cyber-grid"></div>

      {/* Floating Music Player Widget */}
      {showMusicPlayer && (
        <div className="absolute top-16 right-4 z-30 p-3.5 w-64 rounded-xl glass-panel-heavy shadow-glow-orange border border-cyber-orange/40 animate-slide-down text-left">
          <div className="flex items-center justify-between border-b border-cyber-orange/20 pb-2 mb-2 text-[9px] font-tech text-cyber-orange uppercase tracking-wider">
            <span>Grid Broadcast Player</span>
            <button onClick={() => setShowMusicPlayer(false)} className="text-[9px] hover:text-white uppercase font-bold">Hide</button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPlayingMusic(!isPlayingMusic)} 
              className="w-10 h-10 rounded-lg bg-cyber-orange/15 border border-cyber-orange/40 flex items-center justify-center text-cyber-orange hover:bg-cyber-orange hover:text-white transition-all shadow-glow-orange"
            >
              {isPlayingMusic ? (
                <Radio className="w-5 h-5 animate-pulse" />
              ) : (
                <span className="text-[10px] font-tech font-bold">&gt;&gt;</span>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate uppercase font-tech tracking-wider">Cyber_Pulse_132BPM.wav</div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">Stream: Active // 132 bpm</div>
            </div>
          </div>
          
          {/* Animated Music waveform lines */}
          <div className="flex items-end gap-1 h-7 mt-3 px-1">
            {[10, 18, 14, 24, 8, 16, 26, 12, 6, 16, 20, 10, 14, 22].map((val, idx) => (
              <div 
                key={idx} 
                className="flex-1 bg-gradient-to-t from-cyber-orange to-cyber-amber rounded-t-sm transition-all duration-300"
                style={{ 
                  height: isPlayingMusic ? `${val * 3.5}%` : '20%',
                  animation: isPlayingMusic ? `pulse ${0.5 + (idx % 4) * 0.15}s ease-in-out infinite alternate` : 'none'
                }}
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area Header */}
      <div className="p-4 border-b border-cyber-orange/15 bg-cyber-charcoal/80 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <img src={selectedChat.avatar} alt="avatar" className="w-10 h-10 rounded-lg bg-cyber-gray border border-cyber-orange/20" />
          <div className="text-left">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">{selectedChat.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {selectedChat.type === 'direct' ? (
                <>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedChat.isOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`}></span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                    {selectedChat.isOnline ? 'Active Sync Link' : 'Offline Node'}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-orange animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                    Public Room Index: {selectedChat.activityIndex}% Activity
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-2">
          {/* Mood Theme Selector */}
          <MoodCustomizer chatTheme={chatTheme} setChatTheme={setChatTheme} />
          
          {/* Music player widget toggle */}
          <button 
            onClick={() => setShowMusicPlayer(!showMusicPlayer)}
            className={`p-2 rounded-lg border transition-all ${
              showMusicPlayer 
                ? 'bg-cyber-orange/10 border-cyber-orange text-cyber-orange shadow-glow-orange' 
                : 'border-cyber-orange/15 text-slate-400 hover:text-white'
            }`}
            title="Music Sharing Grid Broadcast"
          >
            <Radio className={`w-4.5 h-4.5 ${isPlayingMusic && showMusicPlayer ? 'animate-pulse' : ''}`} />
          </button>

          {/* Notes toggle */}
          <button 
            onClick={() => { setShowNotesPanel(!showNotesPanel); setShowAiSidebar(false); }}
            className={`p-2 rounded-lg border transition-all ${
              showNotesPanel 
                ? 'bg-cyber-orange/10 border-cyber-orange text-cyber-orange' 
                : 'border-cyber-orange/15 text-slate-400 hover:text-white'
            }`}
            title="Collaboration Notes"
          >
            <BookOpen className="w-4.5 h-4.5" />
          </button>

          {/* AI sidebar toggle */}
          <button 
            onClick={() => { setShowAiSidebar(!showAiSidebar); setShowNotesPanel(false); }}
            className={`p-2 rounded-lg border transition-all ${
              showAiSidebar 
                ? 'bg-cyber-orange/10 border-cyber-orange text-cyber-orange shadow-glow-orange' 
                : 'border-cyber-orange/15 text-slate-400 hover:text-white'
            }`}
            title="AI Assistant Sidebar"
          >
            <Sparkles className="w-4.5 h-4.5 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Main Panel Content: Chat Feed + Drawer Panels */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
          {messages.map((msg, index) => {
            const isMe = msg.sender === user._id;
            return (
              <div 
                key={msg._id || index}
                className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Sender Avatar */}
                <img 
                  src={msg.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Unknown'} 
                  alt="avatar" 
                  className="w-8 h-8 rounded-lg bg-cyber-gray border border-cyber-orange/10 flex-shrink-0"
                />

                <div className="space-y-1 text-left relative group">
                  {/* Sender Name (Room only) */}
                  {selectedChat.type === 'room' && !isMe && (
                    <span className="text-[9px] font-tech text-cyber-orange uppercase pl-1">{msg.senderName}</span>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`p-3 rounded-xl border relative ${
                    isMe 
                      ? 'bg-cyber-orange/5 border-cyber-orange/30 text-white rounded-tr-none' 
                      : 'bg-cyber-charcoal/80 border-cyber-orange/10 text-slate-200 rounded-tl-none'
                  }`}>
                    
                    {/* Disappearing badge if scheduled/deleted */}
                    {msg.deleted ? (
                      <span className="text-xs italic text-slate-500">Message was wiped from node.</span>
                    ) : (
                      <>
                        {editingMessage?.id === msg._id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingMessage.text}
                              onChange={(e) => setEditingMessage({ ...editingMessage, text: e.target.value })}
                              className="w-full bg-cyber-black text-xs p-1 px-2 border border-cyber-orange rounded"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleEditMessage(msg._id, editingMessage.text)} className="text-[9px] font-tech text-cyber-orange uppercase">Save</button>
                              <button onClick={() => setEditingMessage(null)} className="text-[9px] font-tech text-slate-500 uppercase">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </>
                    )}

                    {/* Meta info footer */}
                    <div className="flex items-center justify-between gap-4 mt-1.5 pt-1.5 border-t border-white/5 text-[9px] text-slate-500">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.edited && <span className="text-cyber-orange uppercase font-tech">Edited</span>}
                    </div>

                    {/* Bubble Reaction pills */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="absolute -bottom-2 right-2 flex gap-1 bg-cyber-black px-1.5 py-0.5 rounded-full border border-cyber-orange/10 text-[9px]">
                        {msg.reactions.map((r, rIdx) => (
                          <span key={rIdx} title="Reacted">{r.emoji}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Drawer (visible on hover) */}
                  {!msg.deleted && (
                    <div className={`absolute top-0 opacity-0 group-hover:opacity-100 flex gap-1.5 p-1 rounded bg-cyber-black border border-cyber-orange/15 shadow-glow-orange z-20 transition-all ${
                      isMe ? '-left-20' : '-right-20'
                    }`}>
                      {/* Emoji trigger */}
                      <button 
                        onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                        className="text-[10px] hover:text-cyber-orange"
                        title="React"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      {isMe && (
                        <>
                          <button 
                            onClick={() => setEditingMessage({ id: msg._id, text: msg.content })}
                            className="text-[10px] hover:text-cyber-orange"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="text-[10px] hover:text-red-500"
                            title="Wipe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {/* Emoji Picker mini panel */}
                      {showEmojiPicker === msg._id && (
                        <div className="absolute bottom-6 left-0 flex gap-1 bg-cyber-black border border-cyber-orange/20 p-1 rounded-lg">
                          {['👍', '🔥', '👏', '😮', '😂', '💀'].map(em => (
                            <button 
                              key={em} 
                              onClick={() => handleReaction(msg._id, em)}
                              className="hover:scale-125 transition-transform"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing indication notification */}
          {typingUser && (
            <div className="flex items-center gap-2 text-[10px] text-slate-400 pl-12 text-left font-tech uppercase animate-pulse">
              <span className="w-1.5 h-1.5 bg-cyber-orange rounded-full animate-ping"></span>
              <span>{typingUser} is loading packet transmission...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Collaboration Notes Panel */}
        {showNotesPanel && (
          <div className="w-80 h-full bg-cyber-charcoal border-l border-cyber-orange/15 p-4 flex flex-col relative z-20 animate-slide-left">
            <div className="text-xs font-tech text-cyber-orange uppercase tracking-wider mb-2 pb-1 border-b border-cyber-orange/15 flex items-center justify-between">
              <span>Sector Notes Panel</span>
              <button onClick={() => setShowNotesPanel(false)} className="text-[9px] hover:text-white uppercase">Close</button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 bg-cyber-black text-xs font-mono p-3 rounded-lg border border-cyber-orange/10 focus:outline-none focus:border-cyber-orange text-emerald-500 resize-none"
            />
            <div className="text-[8px] text-slate-500 mt-2 text-center uppercase tracking-widest font-tech">
              Secure live local collaborative sync
            </div>
          </div>
        )}

        {/* AI Assistant Sidebar Panel */}
        {showAiSidebar && (
          <div className="w-80 h-full bg-cyber-charcoal border-l border-cyber-orange/15 p-4 flex flex-col relative z-20 animate-slide-left">
            <div className="text-xs font-tech text-cyber-orange uppercase tracking-wider mb-2 pb-1 border-b border-cyber-orange/15 flex items-center justify-between">
              <span>AI Assistant node</span>
              <button onClick={() => setShowAiSidebar(false)} className="text-[9px] hover:text-white uppercase">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 bg-cyber-black/40 rounded-xl p-3 border border-cyber-orange/10 text-left">
              <div className="space-y-1">
                <span className="text-[9px] font-tech text-cyber-orange uppercase font-bold">SYSTEM BROADCAST</span>
                <p className="text-[11px] text-slate-300 leading-relaxed bg-cyber-orange/5 p-2 rounded border border-cyber-orange/10">
                  Ready to optimize communications. Ask me to draft a response, decrypt a protocol, or summarize current transcripts.
                </p>
              </div>
              <div className="border-t border-cyber-orange/10 pt-2 space-y-1.5">
                <span className="text-[8px] font-tech text-slate-500 uppercase">Suggested commands</span>
                <button onClick={() => handleSend("Describe Nebula core metrics")} className="w-full text-left text-[10px] text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded">
                  &gt; Explain project metrics
                </button>
                <button onClick={() => handleSend("System status update report")} className="w-full text-left text-[10px] text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded">
                  &gt; Run connection diagnostic
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic AI Quick Replies bar (pills calculated using DP Edit Distance) */}
      {smartReplies.length > 0 && (
        <div className="px-4 py-2 border-t border-cyber-orange/10 bg-cyber-black/80 flex gap-2 overflow-x-auto relative z-20">
          <span className="text-[9px] font-tech text-cyber-orange/70 flex items-center gap-1 uppercase mr-2 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-cyber-orange animate-pulse" />
            AI suggestions:
          </span>
          {smartReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => handleSend(reply.reply)}
              className="text-[10px] font-tech bg-cyber-orange/10 hover:bg-cyber-orange hover:text-white text-cyber-orange border border-cyber-orange/20 rounded-full px-3 py-1 transition-all flex-shrink-0"
              title={`DP distance similarity match: ${reply.similarity}%`}
            >
              {reply.template} &rarr;
            </button>
          ))}
        </div>
      )}

      {/* Input Action Controls Footer */}
      <div className="p-3 border-t border-cyber-orange/15 bg-cyber-charcoal/80 relative z-20">
        {/* Mock Audio Wave visualizer */}
        <div className="flex items-center gap-3">
          {/* Action options */}
          <div className="flex gap-2 flex-shrink-0">
            {/* Attachment trigger */}
            <label
              className="p-2 rounded-lg bg-cyber-gray border border-cyber-orange/10 text-slate-400 hover:text-white cursor-pointer"
              title="Attach Sector Files / Pictures / Videos"
            >
              <Paperclip className="w-4.5 h-4.5" />
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf,.txt,.zip,.mp3,.wav"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    // Upload file first
                    const formData = new FormData();
                    formData.append('file', file);
                    const upRes = await axios.post('/api/chat/upload', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (!upRes.data?.success) {
                      console.error('Upload failed', upRes.data);
                      return;
                    }

                    const { url, mediaType } = upRes.data.data;

                    // Send message with media
                    const payload = {
                      content: inputText?.trim() || (mediaType === 'image' ? '📷 Photo' : mediaType === 'video' ? '🎬 Video' : '📎 File'),
                      mediaUrl: url,
                      mediaType
                    };

                    if (selectedChat.type === 'room') payload.group = selectedChat.id;
                    else payload.recipient = selectedChat.id;

                    const res = await axios.post('/api/chat/send', payload);
                    if (res.data.success) {
                      const newMsg = {
                        ...res.data.data,
                        senderName: user.username,
                        senderAvatar: user.avatar
                      };
                      setMessages(prev => [...prev, newMsg]);
                      setInputText('');

                      if (socket) {
                        socket.emit('send_message', newMsg);
                        socket.emit('typing', {
                          senderId: user._id,
                          recipientId: selectedChat.type === 'direct' ? selectedChat.id : null,
                          groupId: selectedChat.type === 'room' ? selectedChat.id : null,
                          isTyping: false
                        });
                      }
                    }
                  } catch (err) {
                    console.error('Upload/send failed:', err);
                  } finally {
                    // reset input so selecting same file again triggers change
                    e.target.value = '';
                  }
                }}
              />
            </label>

            {/* Scheduled modal trigger */}
            <button 
              onClick={() => setShowScheduler(true)}
              className="p-2 rounded-lg bg-cyber-gray border border-cyber-orange/10 text-slate-400 hover:text-white hover:border-cyber-orange hover:shadow-glow-orange"
              title="Schedule transmission link"
            >
              <Clock className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Core Input box */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Send message package..."
              className="w-full pl-4 pr-12 py-3 rounded-xl glass-input placeholder-slate-500 text-xs"
            />
            {/* Voice mic triggers */}
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded text-slate-400 hover:text-cyber-orange">
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {/* Send Trigger */}
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="p-3 rounded-xl bg-gradient-to-r from-cyber-orange to-cyber-amber text-white hover:shadow-glow-orange transition-all disabled:opacity-50 flex-shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Message Scheduler Modal */}
      {showScheduler && (
        <SchedulerModal 
          selectedChat={selectedChat}
          onClose={() => setShowScheduler(false)} 
        />
      )}
    </div>
  );
};
export default ChatArea;

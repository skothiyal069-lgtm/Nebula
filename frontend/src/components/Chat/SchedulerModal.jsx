import React, { useState } from 'react';
import axios from 'axios';
import { Calendar, Clock, X, AlertCircle } from 'lucide-react';

export const SchedulerModal = ({ selectedChat, onClose }) => {
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!content.trim() || !date || !time) {
      setError('Please specify text and schedule timing.');
      return;
    }

    const sendAt = new Date(`${date}T${time}`);
    if (sendAt <= new Date()) {
      setError('Schedule time must be in the future.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post('/api/chat/schedule', {
        recipient: selectedChat.type === 'direct' ? selectedChat.id : null,
        recipientName: selectedChat.name,
        content: content,
        sendAt: sendAt.toISOString()
      });

      if (res.data.success) {
        setSuccess(true);
        setContent('');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError('Failed to schedule message package.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-filter blur-sm">
      <div className="relative w-full max-w-md p-6 rounded-2xl glass-panel-heavy shadow-glow-orange border border-cyber-orange animate-zoom-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyber-orange/20 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyber-orange animate-pulse" />
            <h3 className="font-tech text-xs tracking-widest text-cyber-orange uppercase">Transmission Scheduler</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-cyber-orange/10 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs bg-red-950/70 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 text-xs bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Transmission queue coordinate registered successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          <div className="space-y-1">
            <label className="block text-[10px] font-tech text-slate-400 uppercase">Recipient Coordinate</label>
            <input
              type="text"
              readOnly
              value={selectedChat.name}
              className="w-full px-3 py-2 text-xs rounded-xl bg-cyber-black border border-cyber-orange/15 text-slate-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-tech text-slate-400 uppercase">Transmission Content</label>
            <textarea
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Inject text packets..."
              className="w-full px-3 py-2 text-xs rounded-xl glass-input placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-tech text-slate-400 uppercase">Transmission Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-tech text-slate-400 uppercase">Trigger Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-4 font-tech font-bold text-xs tracking-widest text-white uppercase bg-gradient-to-r from-cyber-orange to-cyber-amber rounded-xl hover:shadow-glow-orange transition-all"
          >
            {loading ? 'Registering Queue...' : 'Lock transmission target'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default SchedulerModal;

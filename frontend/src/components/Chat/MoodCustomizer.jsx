import React, { useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';

export const MoodCustomizer = ({ chatTheme, setChatTheme }) => {
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { id: 'cyber', name: 'Cyber Orange', color: 'bg-cyber-orange' },
    { id: 'neon', name: 'Neon Mint', color: 'bg-emerald-500' },
    { id: 'amber', name: 'Burnt Amber', color: 'bg-amber-600' },
    { id: 'deep', name: 'Deep Carbon', color: 'bg-blue-600' },
    { id: 'minimal', name: 'Silver Minimal', color: 'bg-slate-400' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyber-orange/15 text-xs text-slate-400 hover:text-white hover:border-cyber-orange/40 transition-all"
      >
        <Palette className="w-3.5 h-3.5 text-cyber-orange" />
        <span className="text-[10px] font-tech uppercase tracking-wider hidden md:inline">Mood: {themes.find(t => t.id === chatTheme)?.name}</span>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-1.5 w-40 glass-panel-heavy rounded-xl border border-cyber-orange/30 p-1.5 shadow-glow-orange z-40 animate-slide-down">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setChatTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all hover:bg-cyber-orange/10 ${
                  chatTheme === t.id ? 'text-cyber-orange font-bold bg-cyber-orange/5' : 'text-slate-300'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${t.color} border border-white/10`}></span>
                <span className="font-tech text-[10px] uppercase tracking-wider">{t.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
export default MoodCustomizer;

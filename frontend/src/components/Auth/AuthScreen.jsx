import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Shield, Cpu, Lock, User, Mail, Sparkles, Terminal } from 'lucide-react';
import { registerValidator, loginValidator } from '../../utils/validators.js';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Nebula1&colors[]=ff5500',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Core&colors[]=ffb300',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Matrix&colors[]=10b981',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Ghost&colors[]=3b82f6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyborg&colors[]=ec4899'
];

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let validationError = null;

      if (isLogin) {
        validationError = loginValidator(email, password);
      } else {
        validationError = registerValidator(username, email, password);
      }

      if (validationError) {
        setError(validationError);
        setSubmitting(false);
        return;
      }

      let res;
      if (isLogin) {
        res = await login(email, password);
      } else {
        res = await register(username, email, password, avatar);
      }

      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError('Connection sync error. Core server offline.');
      console.error('Auth error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden scanlines">
      {/* Cyber Grid Background */}
      <div className="cyber-grid"></div>

      {/* Futuristic Orbiting Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-orange/5 rounded-full filter blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-amber/5 rounded-full filter blur-[100px] animate-pulse-fast"></div>

      {/* Main Glass Panel Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-2xl glass-panel-heavy shadow-glow-orange border-t-2 border-t-cyber-orange/40">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-cyber-orange/20 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyber-orange animate-pulse" />
            <span className="font-tech text-xs tracking-widest text-cyber-orange uppercase">Node://Auth.sys</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-orange/40"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-orange/70"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-orange animate-ping"></span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black tracking-wider text-glow-orange text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-cyber-orange">
            NEBULA CHAT
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
            {isLogin ? 'Establish secure network link' : 'Register new quantum credentials'}
          </p>
        </div>

        {/* Form Error Banner */}
        {error && (
          <div className="mb-4 p-3 text-xs bg-red-950/70 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2 animate-bounce">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar preset selection (Signup only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-xs font-tech text-slate-400 tracking-wider uppercase">Select Interface Avatar</label>
              <div className="flex justify-center gap-3 py-2">
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`relative p-1 rounded-xl border-2 transition-all ${
                      avatar === av 
                        ? 'border-cyber-orange shadow-glow-orange bg-cyber-orange/10 scale-110' 
                        : 'border-transparent hover:border-cyber-orange/40 hover:scale-105'
                    }`}
                  >
                    <img src={av} alt="Preset avatar" className="w-12 h-12 bg-cyber-gray/40 rounded-lg" />
                    {avatar === av && (
                      <span className="absolute -top-1.5 -right-1.5 bg-cyber-orange text-white p-0.5 rounded-full text-[8px]">
                        <Sparkles className="w-2 h-2" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Username Input (Signup only) */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-xs font-tech text-slate-400 tracking-wider uppercase">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-orange/50" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="AGENT_CODENAME"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1">
            <label className="block text-xs font-tech text-slate-400 tracking-wider uppercase">Email / Account Node</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-orange/50" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@nebula.net"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-xs font-tech text-slate-400 tracking-wider uppercase">Access Code</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-orange/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl glass-input"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="relative w-full py-3 mt-6 font-tech font-bold text-sm tracking-widest text-white uppercase bg-gradient-to-r from-cyber-orange to-cyber-amber rounded-xl hover:shadow-glow-orange-lg transition-all duration-300 disabled:opacity-50 overflow-hidden group"
          >
            <div className="absolute inset-0 w-full h-full bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Cpu className="w-4 h-4 animate-spin-slow" />
              {submitting ? 'Connecting...' : isLogin ? 'INITIATE CONNECTION' : 'GENERATE NODE LINK'}
            </span>
          </button>
        </form>

        {/* Tab Toggle */}
        <div className="text-center mt-6 pt-4 border-t border-cyber-orange/10">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs tracking-wider text-slate-400 hover:text-cyber-orange hover:text-glow-orange transition-all uppercase"
          >
            {isLogin 
              ? "New agent? Build credentials link" 
              : "Registered node? Login connection link"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AuthScreen;

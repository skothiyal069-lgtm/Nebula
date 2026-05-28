import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import AuthScreen from './components/Auth/AuthScreen.jsx';
import SideBar from './components/Sidebar/SideBar.jsx';
import ChatArea from './components/Chat/ChatArea.jsx';
import DsaVisualizer from './components/Visualizers/DsaVisualizer.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { Terminal, Shield } from 'lucide-react';

const MainLayout = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // chat, dsa

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-black text-slate-100">
      {/* Discord style left column sidebar */}
      <SideBar 
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Right Area View */}
      <div className="flex-1 h-full overflow-hidden relative">
        {activeTab === 'dsa' ? (
          <DsaVisualizer />
        ) : selectedChat?.type === 'dsa_visualizer' ? (
          <DsaVisualizer defaultTab={selectedChat.dsaTab} />
        ) : (
          <ChatArea selectedChat={selectedChat} />
        )}
      </div>
    </div>
  );
};

const NavigationWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-cyber-black scanlines relative">
        <div className="cyber-grid"></div>
        <div className="space-y-4 text-center z-10">
          <Terminal className="w-10 h-10 text-cyber-orange animate-spin mx-auto" />
          <h2 className="text-sm font-tech text-cyber-orange uppercase tracking-widest animate-pulse">Syncing Nebula Node Link...</h2>
        </div>
      </div>
    );
  }

  return user ? (
    <SocketProvider>
      <MainLayout />
    </SocketProvider>
  ) : (
    <AuthScreen />
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationWrapper />
      </AuthProvider>
    </ErrorBoundary>
  );
}

import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      try {
        // Connect to root path with configuration
        let socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
        if (socketUrl && !socketUrl.startsWith('http://') && !socketUrl.startsWith('https://') && !socketUrl.startsWith('ws://') && !socketUrl.startsWith('wss://')) {
          socketUrl = `https://${socketUrl}`;
        }
        const socketConnection = io(socketUrl, {
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: parseInt(import.meta.env.VITE_SOCKET_RECONNECTION_DELAY || '1000'),
          reconnectionDelayMax: 5000,
          reconnectionAttempts: parseInt(import.meta.env.VITE_SOCKET_RECONNECTION_ATTEMPTS || '5')
        });

        setSocket(socketConnection);

        // Authenticate socket link
        socketConnection.emit('register_user', user._id);

        const handleConnect = () => {
          console.log('🔌 [SOCKET CONNECTED] Node ID:', socketConnection.id);
          socketConnection.emit('register_user', user._id);
        };

        socketConnection.on('connect', handleConnect);

        return () => {
          socketConnection.off('connect', handleConnect);
          socketConnection.disconnect();
          console.log('🔌 [SOCKET DISCONNECTED]');
        };
      } catch (err) {
        console.error('Failed to initialize socket:', err);
        setSocket(null);
      }
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

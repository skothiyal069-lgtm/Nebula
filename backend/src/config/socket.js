import { Server } from 'socket.io';
import User from '../models/User.js';
import { getMockStore } from './db.js';

// Global map of userId -> socketId
const userSocketMap = new Map();

export const getSocketId = (userId) => {
  return userSocketMap.get(userId.toString());
};

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all in dev
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [NEBULA SOCKET] Connection established: ${socket.id}`);

    // User authentication/join room binding
    socket.on('register_user', async (userId) => {
      if (!userId) return;
      
      socket.userId = userId;
      userSocketMap.set(userId.toString(), socket.id);
      
      console.log(`🔌 [NEBULA SOCKET] User registered: ${userId} -> Socket: ${socket.id}`);

      try {
        // Mark online
        await User.findByIdAndUpdate(userId, { isOnline: true });
        
        // Broadcast user status change
        socket.broadcast.emit('user_status_change', {
          userId,
          isOnline: true
        });
      } catch (err) {
        console.error('Socket register error:', err);
      }
    });

    // Handle joining group/room socket channel
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`🔌 [NEBULA SOCKET] Socket ${socket.id} joined channel room: ${roomId}`);
    });

    // Handle leaving room channel
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`🔌 [NEBULA SOCKET] Socket ${socket.id} left channel room: ${roomId}`);
    });

    // Real-time message broadcasting
    socket.on('send_message', (messageData) => {
      // messageData: { sender, recipient, group, content, huffmanEncoded, category, createdAt, senderName, senderAvatar }
      if (messageData.group) {
        // Send to group channel
        socket.to(messageData.group).emit('receive_message', messageData);
        return;
      }

      if (messageData.recipient) {
        // Send to specific recipient socket
        const recipientSocketId = getSocketId(messageData.recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receive_message', messageData);

          // Unread/notification signal for recipient (used by Sidebar)
          io.to(recipientSocketId).emit('new_message_notification', {
            senderId: messageData.sender,
            recipientId: messageData.recipient,
            groupId: null,
            chatId: messageData.recipient,
            // For direct chats, treat partner as sender
            partnerId: messageData.sender,
            contentPreview: messageData.content,
            createdAt: messageData.createdAt || new Date().toISOString()
          });
        }
      }
    });

    // Typing indicators
    socket.on('typing', (data) => {
      // data: { senderId, senderName, recipientId, groupId, isTyping }
      if (data.groupId) {
        socket.to(data.groupId).emit('typing', data);
      } else if (data.recipientId) {
        const recipientSocketId = getSocketId(data.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('typing', data);
        }
      }
    });

    // Profile updates (mood theme, energy level changes)
    socket.on('update_profile_status', (data) => {
      // data: { userId, username, avatar, status, mood, energyLevel }
      socket.broadcast.emit('user_profile_updated', data);
    });

    // Handle message editing / deleting
    socket.on('message_action', (data) => {
      // data: { messageId, action: 'edit'|'delete', content, recipientId, groupId }
      if (data.groupId) {
        socket.to(data.groupId).emit('message_action', data);
      } else if (data.recipientId) {
        const recipientSocketId = getSocketId(data.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message_action', data);
        }
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`🔌 [NEBULA SOCKET] Client disconnected: ${socket.id}`);
      
      if (socket.userId) {
        userSocketMap.delete(socket.userId.toString());
        
        try {
          await User.findByIdAndUpdate(socket.userId, { 
            isOnline: false, 
            lastSeen: new Date() 
          });

          // Broadcast offline event
          socket.broadcast.emit('user_status_change', {
            userId: socket.userId,
            isOnline: false,
            lastSeen: new Date()
          });
        } catch (err) {
          console.error('Socket disconnect updates error:', err);
        }
      }
    });
  });

  return io;
};

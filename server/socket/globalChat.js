const ChatMessage = require('../models/ChatMessage');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Badge = require('../models/Badge');
const BannedWord = require('../models/BannedWord');

// Helper function to check for banned words
async function containsBannedWord(text) {
  const bannedWords = await BannedWord.find({}, 'word');
  const words = bannedWords.map(b => b.word.toLowerCase());
  const textLower = text.toLowerCase();

  for (const word of words) {
    if (textLower.includes(word)) {
      return word;
    }
  }
  return null;
}

// Track online users
const onlineUsers = new Map(); // socketId -> { userId, username, avatar }

function initializeGlobalChatSocket(io) {
  const globalChatNamespace = io.of('/globalchat');
  
  // Handle connection errors for iOS debugging
  globalChatNamespace.on('connect_error', (err) => {
    console.error('[GlobalChat] Connection error:', err.message);
  });

  globalChatNamespace.use(async (socket, next) => {
    try {
      const auth = socket.handshake.auth || {};
      const token = auth.token;
      
      console.log('[GlobalChat] Auth attempt:', { 
        hasToken: !!token, 
        hasUserId: !!auth.userId,
        username: auth.username 
      });
      
      if (token) {
        // Authenticated user - verify token
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
          socket.username = decoded.name;
          socket.avatar = decoded.avatar;
          socket.communityRole = decoded.communityRole || 'member';
          socket.isAdmin = decoded.communityRole === 'admin' || decoded.isAdmin === true;
          socket.isGuest = false;
          console.log('[GlobalChat] User authenticated:', socket.username, 'admin:', socket.isAdmin);
        } catch (jwtErr) {
          // Token invalid, check if client sent user info (fallback)
          if (auth.userId && auth.username) {
            socket.userId = auth.userId;
            socket.username = auth.username;
            socket.avatar = auth.avatar || null;
            socket.communityRole = auth.communityRole || 'member';
            socket.isAdmin = auth.communityRole === 'admin';
            socket.isGuest = false;
            console.log('[GlobalChat] User info from client (fallback):', socket.username);
          } else {
            // Truly guest
            const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            socket.userId = guestId;
            socket.username = auth.username || `Guest ${Math.floor(Math.random() * 9999)}`;
            socket.avatar = null;
            socket.isGuest = true;
            console.log('[GlobalChat] Guest user (token invalid):', socket.username);
          }
        }
      } else {
        // Guest user - generate guest ID
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        socket.userId = guestId;
        socket.username = auth.username || `Guest ${Math.floor(Math.random() * 9999)}`;
        socket.avatar = null;
        socket.isGuest = true;
        console.log('[GlobalChat] Guest user:', socket.username);
      }
      
      next();
    } catch (err) {
      console.error('[GlobalChat] Auth error:', err.message);
      // Fallback to guest
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      socket.userId = guestId;
      socket.username = `Guest ${Math.floor(Math.random() * 9999)}`;
      socket.avatar = null;
      socket.isGuest = true;
      next();
    }
  });

  globalChatNamespace.on('connection', async (socket) => {
    console.log(`[GlobalChat] User ${socket.username} connected, socket id: ${socket.id}, guest: ${socket.isGuest}`);
    
    // Track online user
    onlineUsers.set(socket.id, {
      userId: socket.userId,
      username: socket.username,
      avatar: socket.avatar,
      communityRole: socket.communityRole || 'member',
      isGuest: socket.isGuest
    });

    // Send online users count
    broadcastOnlineCount(globalChatNamespace);

    // Send recent messages to newly connected user
    try {
      const recentMessages = await ChatMessage.getRecentMessages('global', 50);
      socket.emit('message-history', recentMessages.reverse());
    } catch (err) {
      console.error('[GlobalChat] Error fetching recent messages:', err);
    }

    // Handle new message
    socket.on('send-message', async ({ message }) => {
      try {
        if (!message || !message.trim()) {
          return;
        }

        const trimmedMessage = message.trim();
        
        // Validate message length
        if (trimmedMessage.length > 500) {
          socket.emit('error', { message: 'Pesan terlalu panjang (maks 500 karakter)' });
          return;
        }

        // Check for banned words
        const bannedWord = await containsBannedWord(trimmedMessage);
        if (bannedWord) {
          socket.emit('error', { 
            message: `Pesan mengandung kata yang tidak diizinkan: "${bannedWord}"`,
            bannedWord: bannedWord 
          });
          return;
        }

        // Determine community role - if admin, force to 'admin'
        const communityRole = socket.isAdmin ? 'admin' : (socket.communityRole || 'member');

        // Save message to database
        const newMessage = new ChatMessage({
          userId: socket.userId,
          username: socket.username,
          avatar: socket.avatar,
          communityRole: communityRole,
          message: trimmedMessage,
          room: 'global'
        });

        await newMessage.save();

        // Broadcast to all connected users
        const messageData = {
          id: newMessage._id.toString(),
          userId: socket.userId,
          username: socket.username,
          avatar: socket.avatar,
          communityRole: communityRole,
          message: trimmedMessage,
          timestamp: newMessage.timestamp,
          isGuest: socket.isGuest
        };

        globalChatNamespace.emit('new-message', messageData);

      } catch (err) {
        console.error('[GlobalChat] Send message error:', err);
        socket.emit('error', { message: 'Gagal mengirim pesan' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (isTyping) => {
      socket.broadcast.emit('user-typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping
      });
    });

    // Handle request for more messages (pagination)
    socket.on('load-more-messages', async ({ before }) => {
      try {
        const beforeDate = before ? new Date(before) : new Date();
        const messages = await ChatMessage.find({
          room: 'global',
          timestamp: { $lt: beforeDate }
        })
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();

        socket.emit('more-messages', messages.reverse());
      } catch (err) {
        console.error('[GlobalChat] Load more messages error:', err);
        socket.emit('error', { message: 'Failed to load messages' });
      }
    });

    // Handle delete message (admin only)
    socket.on('delete-message', async ({ messageId }) => {
      try {
        // Check if user is admin
        if (!socket.isAdmin) {
          socket.emit('error', { message: 'Hanya admin yang dapat menghapus pesan' });
          return;
        }

        console.log(`[GlobalChat] Delete request for message: ${messageId}`);

        // Validate messageId format
        if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
          console.log(`[GlobalChat] Invalid messageId format: ${messageId}`);
          socket.emit('error', { message: 'ID pesan tidak valid' });
          return;
        }

        const message = await ChatMessage.findById(messageId);
        if (!message) {
          console.log(`[GlobalChat] Message not found in DB: ${messageId}`);
          socket.emit('error', { message: 'Pesan tidak ditemukan' });
          return;
        }

        await ChatMessage.findByIdAndDelete(messageId);
        
        // Broadcast deletion to all users
        globalChatNamespace.emit('message-deleted', { messageId });
        
        console.log(`[GlobalChat] Message ${messageId} deleted by admin ${socket.username}`);
      } catch (err) {
        console.error('[GlobalChat] Delete message error:', err);
        socket.emit('error', { message: 'Gagal menghapus pesan' });
      }
    });

    // Handle pin/unpin message (admin only)
    socket.on('pin-message', async ({ messageId, isPinned }) => {
      try {
        // Check if user is admin
        if (!socket.isAdmin) {
          socket.emit('error', { message: 'Hanya admin yang dapat menyematkan pesan' });
          return;
        }

        const message = await ChatMessage.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Pesan tidak ditemukan' });
          return;
        }

        // If pinning, unpin all other messages first (only one pinned message at a time)
        if (isPinned) {
          await ChatMessage.updateMany(
            { room: 'global', isPinned: true },
            { isPinned: false }
          );
        }

        message.isPinned = isPinned;
        await message.save();

        // Broadcast pin update to all users
        globalChatNamespace.emit('message-pinned', { 
          messageId, 
          isPinned,
          message: {
            id: message._id.toString(),
            userId: message.userId,
            username: message.username,
            avatar: message.avatar,
            communityRole: message.communityRole,
            message: message.message,
            timestamp: message.timestamp,
            isPinned: message.isPinned
          }
        });
        
        console.log(`[GlobalChat] Message ${messageId} ${isPinned ? 'pinned' : 'unpinned'} by admin ${socket.username}`);
      } catch (err) {
        console.error('[GlobalChat] Pin message error:', err);
        socket.emit('error', { message: 'Gagal menyematkan pesan' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[GlobalChat] User ${socket.username} disconnected`);
      onlineUsers.delete(socket.id);
      broadcastOnlineCount(globalChatNamespace);
    });
  });

  return globalChatNamespace;
}

// Broadcast online users count to all clients
function broadcastOnlineCount(namespace) {
  const count = onlineUsers.size;
  namespace.emit('online-count', count);
}

// Get online users (for admin purposes)
function getOnlineUsers() {
  return Array.from(onlineUsers.values());
}

module.exports = { initializeGlobalChatSocket, getOnlineUsers };

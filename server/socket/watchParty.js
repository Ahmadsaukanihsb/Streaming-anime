const WatchParty = require('../models/WatchParty');
const jwt = require('jsonwebtoken');

// Store active socket connections
const watchPartyRooms = new Map();

function initializeWatchPartySocket(io) {
  const watchPartyNamespace = io.of('/watchparty');

  watchPartyNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userName = decoded.name;
      socket.userAvatar = decoded.avatar;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  watchPartyNamespace.on('connection', (socket) => {
    console.log(`[WatchParty] User ${socket.userName} connected, socket id: ${socket.id}`);
    
    // Log all registered event handlers
    console.log('[WatchParty] Registering event handlers for socket:', socket.id);

    // Join or create room
    socket.on('join-room', async ({ roomId, animeId, episodeId, animeTitle, episodeNumber, isHost }) => {
      try {
        let room = await WatchParty.findOne({ roomId, isActive: true });
        
        // Create new room if host
        if (!room && isHost) {
          // Generate 6 character room code
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let code = '';
          for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          room = new WatchParty({
            roomId: code,
            animeId,
            episodeId,
            animeTitle,
            episodeNumber,
            hostId: socket.userId,
            participants: [{
              userId: socket.userId,
              name: socket.userName,
              avatar: socket.userAvatar || '',
              isHost: true,
              isReady: false
            }]
          });
          await room.save();
        }

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if room is full
        if (room.participants.length >= room.maxParticipants) {
          socket.emit('error', { message: 'Room is full' });
          return;
        }

        // Check if user already in room
        const existingParticipant = room.participants.find(
          p => p.userId.toString() === socket.userId
        );

        if (!existingParticipant) {
          room.participants.push({
            userId: socket.userId,
            name: socket.userName,
            avatar: socket.userAvatar,
            isHost: false,
            isReady: false
          });
          await room.save();
        }

        // Join socket room (use room.roomId which is always set)
        const actualRoomId = room.roomId;
        socket.join(actualRoomId);
        socket.roomId = actualRoomId;

        // Track in memory
        if (!watchPartyRooms.has(actualRoomId)) {
          watchPartyRooms.set(actualRoomId, {
            sockets: new Set(),
            videoState: room.videoState
          });
        }
        watchPartyRooms.get(actualRoomId).sockets.add(socket.id);

        // Determine if user is host (check if userId matches hostId)
        const isUserHost = room.hostId.toString() === socket.userId;
        
        // Get current video state from memory or DB
        const roomMemory = watchPartyRooms.get(actualRoomId);
        const currentVideoState = roomMemory?.videoState || room.videoState;
        
        // Send room data to user
        socket.emit('room-joined', {
          roomId: room.roomId,
          animeId: room.animeId,
          episodeId: room.episodeId,
          animeTitle: room.animeTitle,
          episodeNumber: room.episodeNumber,
          participants: room.participants,
          messages: room.messages.slice(-50),
          videoState: currentVideoState,
          isHost: isUserHost
        });
        
        // If video is playing, immediately sync to participant
        if (!isUserHost && currentVideoState?.isPlaying) {
          socket.emit('video-state-update', {
            isPlaying: currentVideoState.isPlaying,
            currentTime: currentVideoState.currentTime,
            timestamp: Date.now()
          });
        }

        // Notify others
        socket.to(actualRoomId).emit('user-joined', {
          userId: socket.userId,
          name: socket.userName,
          avatar: socket.userAvatar,
          isHost: false
        });

      } catch (err) {
        console.error('[WatchParty] Join room error:', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle video state changes (play/pause)
    socket.on('video-state-change', async ({ isPlaying, currentTime }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        const room = await WatchParty.findOne({ roomId });
        if (!room) return;

        // Only host can control video
        const participant = room.participants.find(
          p => p.userId.toString() === socket.userId && p.isHost
        );

        if (!participant) {
          socket.emit('error', { message: 'Only host can control video' });
          return;
        }

        // Update video state
        room.videoState = {
          isPlaying,
          currentTime,
          lastUpdate: new Date()
        };
        await room.save();

        // Update in memory
        const roomData = watchPartyRooms.get(roomId);
        if (roomData) {
          roomData.videoState = room.videoState;
        }

        // Broadcast to all except sender
        socket.to(roomId).emit('video-state-update', {
          isPlaying,
          currentTime,
          timestamp: Date.now()
        });

      } catch (err) {
        console.error('[WatchParty] Video state change error:', err);
      }
    });

    // Handle seek
    socket.on('video-seek', async ({ currentTime }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        const room = await WatchParty.findOne({ roomId });
        if (!room) return;

        const participant = room.participants.find(
          p => p.userId.toString() === socket.userId && p.isHost
        );

        if (!participant) {
          socket.emit('error', { message: 'Only host can seek' });
          return;
        }

        room.videoState.currentTime = currentTime;
        room.videoState.lastUpdate = new Date();
        await room.save();

        socket.to(roomId).emit('video-seek', { currentTime });

      } catch (err) {
        console.error('[WatchParty] Video seek error:', err);
      }
    });

    // Handle chat messages
    socket.on('send-message', async ({ message }) => {
      console.log('[WatchParty] Send message received:', message);
      try {
        const roomId = socket.roomId;
        if (!roomId || !message.trim()) {
          console.log('[WatchParty] Message rejected: no room or empty message');
          return;
        }

        const room = await WatchParty.findOne({ roomId });
        if (!room) return;

        const newMessage = {
          userId: socket.userId,
          name: socket.userName,
          message: message.trim(),
          timestamp: new Date()
        };

        room.messages.push(newMessage);
        if (room.messages.length > 100) {
          room.messages = room.messages.slice(-100);
        }
        await room.save();

        // Broadcast to all in room
        watchPartyNamespace.to(roomId).emit('new-message', newMessage);

      } catch (err) {
        console.error('[WatchParty] Send message error:', err);
      }
    });

    // Handle ready status
    socket.on('toggle-ready', async () => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        const room = await WatchParty.findOne({ roomId });
        if (!room) return;

        const participant = room.participants.find(
          p => p.userId.toString() === socket.userId
        );

        if (participant) {
          participant.isReady = !participant.isReady;
          await room.save();

          watchPartyNamespace.to(roomId).emit('user-ready', {
            userId: socket.userId,
            isReady: participant.isReady
          });
        }

      } catch (err) {
        console.error('[WatchParty] Toggle ready error:', err);
      }
    });

    // Transfer host
    socket.on('transfer-host', async ({ newHostId }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        const room = await WatchParty.findOne({ roomId });
        if (!room) return;

        const currentHost = room.participants.find(
          p => p.userId.toString() === socket.userId && p.isHost
        );

        if (!currentHost) {
          socket.emit('error', { message: 'Only host can transfer ownership' });
          return;
        }

        room.participants.forEach(p => {
          p.isHost = p.userId.toString() === newHostId;
        });

        await room.save();

        watchPartyNamespace.to(roomId).emit('host-transferred', {
          newHostId,
          newHostName: room.participants.find(p => p.userId.toString() === newHostId)?.name
        });

      } catch (err) {
        console.error('[WatchParty] Transfer host error:', err);
      }
    });

    // Handle kick participant
    socket.on('kick-participant', async ({ userId }) => {
      console.log('[WatchParty] =======================================');
      console.log('[WatchParty] KICK REQUEST received');
      console.log('[WatchParty] Target userId:', userId);
      console.log('[WatchParty] Requester socket.userId:', socket.userId);
      console.log('[WatchParty] Requester socket.roomId:', socket.roomId);
      try {
        const roomId = socket.roomId;
        if (!roomId) {
          console.log('[WatchParty] Kick FAILED: socket.roomId is undefined');
          socket.emit('error', { message: 'Not in a room' });
          return;
        }

        const room = await WatchParty.findOne({ roomId });
        if (!room) {
          console.log('[WatchParty] Kick FAILED: room not found in DB');
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        
        console.log('[WatchParty] Room found, hostId:', room.hostId.toString());
        console.log('[WatchParty] Participants:', room.participants.map(p => ({ id: p.userId.toString(), name: p.name, isHost: p.isHost })));

        // Check if requester is host
        const currentHost = room.participants.find(
          p => p.userId.toString() === socket.userId && p.isHost
        );

        if (!currentHost) {
          console.log('[WatchParty] Kick FAILED: requester is not host');
          console.log('[WatchParty] socket.userId:', socket.userId);
          socket.emit('error', { message: 'Only host can kick participants' });
          return;
        }

        // Remove participant from DB
        const participantToKick = room.participants.find(
          p => p.userId.toString() === userId
        );
        
        if (!participantToKick) {
          console.log('[WatchParty] Kick FAILED: participant not found in room');
          socket.emit('error', { message: 'Participant not found' });
          return;
        }
        
        console.log('[WatchParty] Kicking participant:', participantToKick.name);

        room.participants = room.participants.filter(
          p => p.userId.toString() !== userId
        );
        await room.save();
        console.log('[WatchParty] Participant removed from DB');

        // Find and kick socket
        const roomSockets = await watchPartyNamespace.in(roomId).fetchSockets();
        console.log('[WatchParty] Found', roomSockets.length, 'sockets in room');
        
        let kicked = false;
        for (const s of roomSockets) {
          console.log('[WatchParty] Checking socket - userId:', s.userId, 'id:', s.id);
          if (s.userId === userId || s.userId === participantToKick.userId.toString()) {
            console.log('[WatchParty] MATCH! Kicking socket:', s.id);
            s.emit('kicked', { reason: 'Kicked by host' });
            s.leave(roomId);
            kicked = true;
            break;
          }
        }
        
        if (!kicked) {
          console.log('[WatchParty] WARNING: Socket not found for user, but removed from DB');
        }

        // Notify others
        watchPartyNamespace.to(roomId).emit('user-left', { userId });
        socket.emit('participant-kicked', { userId, name: participantToKick.name });
        console.log('[WatchParty] Kick COMPLETE');
        console.log('[WatchParty] =======================================');

      } catch (err) {
        console.error('[WatchParty] Kick participant ERROR:', err);
        socket.emit('error', { message: 'Kick failed: ' + err.message });
      }
    });

    // Handle rejoin (reconnect)
    socket.on('rejoin-room', async ({ roomId }) => {
      try {
        const room = await WatchParty.findOne({ roomId, isActive: true });
        if (!room) {
          socket.emit('error', { message: 'Room not found or closed' });
          return;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        
        const isUserHost = room.hostId.toString() === socket.userId;
        const roomMemory = watchPartyRooms.get(roomId);
        const currentVideoState = roomMemory?.videoState || room.videoState;
        
        socket.emit('room-joined', {
          roomId: room.roomId,
          animeId: room.animeId,
          episodeId: room.episodeId,
          animeTitle: room.animeTitle,
          episodeNumber: room.episodeNumber,
          participants: room.participants,
          messages: room.messages.slice(-50),
          videoState: currentVideoState,
          isHost: isUserHost
        });
        
        // Sync video state immediately
        if (!isUserHost && currentVideoState?.isPlaying) {
          socket.emit('video-state-update', {
            isPlaying: currentVideoState.isPlaying,
            currentTime: currentVideoState.currentTime,
            timestamp: Date.now()
          });
        }
        
        console.log(`[WatchParty] User ${socket.userName} rejoined room ${roomId}`);
      } catch (err) {
        console.error('[WatchParty] Rejoin room error:', err);
      }
    });

    // Handle reactions
    socket.on('send-reaction', ({ emoji }) => {
      try {
        const roomId = socket.roomId;
        if (!roomId || !emoji) return;

        // Broadcast reaction to all in room
        watchPartyNamespace.to(roomId).emit('new-reaction', {
          name: socket.userName,
          emoji
        });
        
        console.log(`[WatchParty] ${socket.userName} sent reaction: ${emoji}`);
      } catch (err) {
        console.error('[WatchParty] Send reaction error:', err);
      }
    });

    console.log('[WatchParty] All event handlers registered for:', socket.id);

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        const roomId = socket.roomId;
        if (!roomId) return;

        console.log(`[WatchParty] User ${socket.userName} disconnected`);

        const room = await WatchParty.findOne({ roomId });
        if (!room) return;

        const roomData = watchPartyRooms.get(roomId);
        if (roomData) {
          roomData.sockets.delete(socket.id);
          
          if (roomData.sockets.size === 0) {
            room.isActive = false;
            await room.save();
            watchPartyRooms.delete(roomId);
          }
        }

        const wasHost = room.participants.find(
          p => p.userId.toString() === socket.userId && p.isHost
        );

        room.participants = room.participants.filter(
          p => p.userId.toString() !== socket.userId
        );

        if (wasHost && room.participants.length > 0) {
          room.participants[0].isHost = true;
          
          const newHostId = room.participants[0].userId.toString();
          const sockets = await watchPartyNamespace.in(roomId).fetchSockets();
          const newHostSocket = sockets.find(s => s.userId === newHostId);
          if (newHostSocket) {
            newHostSocket.emit('became-host');
          }
        }

        await room.save();

        socket.to(roomId).emit('user-left', {
          userId: socket.userId,
          name: socket.userName
        });

      } catch (err) {
        console.error('[WatchParty] Disconnect error:', err);
      }
    });
  });

  return watchPartyNamespace;
}

module.exports = { initializeWatchPartySocket, watchPartyRooms };

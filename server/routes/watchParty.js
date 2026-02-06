const express = require('express');
const watchPartyRouter = express.Router();
const WatchParty = require('../models/WatchParty');
const { authenticateToken } = require('../middleware/auth');

// Get all active public rooms
watchPartyRouter.get('/rooms', async (req, res) => {
  try {
    const rooms = await WatchParty.find({ 
      isActive: true, 
      isPublic: true 
    })
      .select('roomId animeId animeTitle episodeNumber participants createdAt')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(rooms.map(room => ({
      roomId: room.roomId,
      animeId: room.animeId,
      animeTitle: room.animeTitle,
      episodeNumber: room.episodeNumber,
      participantCount: room.participants.length,
      maxParticipants: room.maxParticipants,
      createdAt: room.createdAt
    })));
  } catch (err) {
    console.error('[WatchParty] Get rooms error:', err);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Get room by ID (validate if exists and active)
watchPartyRouter.get('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await WatchParty.findOne({ 
      roomId: roomId.toUpperCase(),
      isActive: true 
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    res.json({
      roomId: room.roomId,
      animeId: room.animeId,
      episodeId: room.episodeId,
      animeTitle: room.animeTitle,
      episodeNumber: room.episodeNumber,
      participantCount: room.participants.length,
      maxParticipants: room.maxParticipants,
      isFull: room.participants.length >= room.maxParticipants
    });
  } catch (err) {
    console.error('[WatchParty] Get room error:', err);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Create new room
watchPartyRouter.post('/rooms', authenticateToken, async (req, res) => {
  try {
    const { animeId, episodeId, animeTitle, episodeNumber, isPublic, maxParticipants } = req.body;

    if (!animeId || !episodeId || !animeTitle || !episodeNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already has an active room
    const existingRoom = await WatchParty.findOne({
      hostId: req.user.id,
      isActive: true
    });

    if (existingRoom) {
      return res.status(400).json({ 
        error: 'You already have an active room',
        roomId: existingRoom.roomId
      });
    }

    const room = new WatchParty({
      animeId,
      episodeId,
      animeTitle,
      episodeNumber,
      hostId: req.user.id,
      isPublic: isPublic || false,
      maxParticipants: maxParticipants || 10,
      participants: [{
        userId: req.user.id,
        name: req.user.name,
        avatar: req.user.avatar,
        isHost: true,
        isReady: false
      }]
    });

    await room.save();

    res.status(201).json({
      roomId: room.roomId,
      message: 'Room created successfully'
    });
  } catch (err) {
    console.error('[WatchParty] Create room error:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Close room (host only)
watchPartyRouter.delete('/rooms/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await WatchParty.findOne({ roomId: roomId.toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.hostId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only host can close room' });
    }

    room.isActive = false;
    await room.save();

    res.json({ message: 'Room closed successfully' });
  } catch (err) {
    console.error('[WatchParty] Close room error:', err);
    res.status(500).json({ error: 'Failed to close room' });
  }
});

// Get user's active room
watchPartyRouter.get('/my-room', authenticateToken, async (req, res) => {
  try {
    const room = await WatchParty.findOne({
      'participants.userId': req.user.id,
      isActive: true
    });

    if (!room) {
      return res.json(null);
    }

    res.json({
      roomId: room.roomId,
      animeId: room.animeId,
      animeTitle: room.animeTitle,
      episodeNumber: room.episodeNumber,
      isHost: room.hostId.toString() === req.user.id
    });
  } catch (err) {
    console.error('[WatchParty] Get my room error:', err);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

module.exports = watchPartyRouter;

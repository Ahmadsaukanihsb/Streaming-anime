const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  communityRole: {
    type: String,
    default: 'member'
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  room: {
    type: String,
    default: 'global',
    index: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index untuk query cepat
chatMessageSchema.index({ room: 1, timestamp: -1 });

// Static method untuk get recent messages
chatMessageSchema.statics.getRecentMessages = async function(room = 'global', limit = 50) {
  return this.find({ room })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);

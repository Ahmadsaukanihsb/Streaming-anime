const mongoose = require('mongoose');

const WatchProgressSchema = new mongoose.Schema({
    animeId: {
        type: String,
        required: true,
        index: true
    },
    episodeNumber: {
        type: Number,
        required: true
    },
    userId: {
        type: String,
        default: 'anonymous', // For non-logged-in users, use a device/session ID
        index: true
    },
    currentTime: {
        type: Number,
        required: true,
        default: 0
    },
    duration: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true }); // Use built-in timestamps

// Compound index for quick lookups
WatchProgressSchema.index({ animeId: 1, episodeNumber: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('WatchProgress', WatchProgressSchema);

const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['anime_added', 'anime_edited', 'anime_deleted', 'episode_added', 'user_registered', 'comment_added']
    },
    description: {
        type: String,
        required: true
    },
    itemId: {
        type: String // anime id, user id, etc
    },
    itemTitle: {
        type: String // anime title, username, etc
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    userName: {
        type: String,
        default: 'System'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 604800 // Auto-delete after 7 days (in seconds)
    }
});

// Index for efficient querying
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

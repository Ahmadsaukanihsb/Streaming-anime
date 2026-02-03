const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'like_discussion',
            'like_reply',
            'reply',
            'mention',
            'new_episode',
            // Legacy/system types for backward compatibility
            'system',
            'anime',
            'episode'
        ],
        required: true
    },
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // Not required for new_episode type
    },
    fromUserName: {
        type: String
        // Not required for new_episode type
    },
    discussionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discussion'
    },
    discussionTitle: {
        type: String
    },
    replyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DiscussionReply'
    },
    // For new_episode notifications
    animeId: {
        type: String
    },
    animeTitle: {
        type: String
    },
    animePoster: {
        type: String
    },
    episodeNumber: {
        type: Number
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Auto delete old notifications (older than 30 days)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);

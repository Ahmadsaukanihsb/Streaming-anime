const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userAvatar: {
        type: String,
        default: ''
    },
    userRole: {
        type: String,
        default: 'member',
        trim: true,
        lowercase: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200,
        trim: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    category: {
        type: String,
        enum: ['general', 'anime', 'recommendation', 'question', 'info'],
        default: 'general'
    },
    animeId: {
        type: String,
        default: null
    },
    animeTitle: {
        type: String,
        default: null
    },
    animePoster: {
        type: String,
        default: null
    },
    replyCount: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isPinned: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ category: 1, createdAt: -1 });
discussionSchema.index({ isPinned: -1, createdAt: -1 });
discussionSchema.index({ userId: 1 });

// Virtual for like count
discussionSchema.virtual('likeCount').get(function () {
    return this.likes.length;
});

// Ensure virtuals are included in JSON output
discussionSchema.set('toJSON', { virtuals: true });
discussionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Discussion', discussionSchema);

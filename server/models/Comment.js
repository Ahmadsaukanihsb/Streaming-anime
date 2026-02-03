const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
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
    animeId: {
        type: String,
        required: true,
        index: true
    },
    episodeNumber: {
        type: Number,
        default: null, // null means it's an anime comment, not episode comment
        index: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null // null means it's a top-level comment
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
commentSchema.index({ animeId: 1, episodeNumber: 1, createdAt: -1 });
commentSchema.index({ parentId: 1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function () {
    return this.likes.length;
});

// Ensure virtuals are included in JSON output
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);

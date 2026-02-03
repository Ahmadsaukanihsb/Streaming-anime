const mongoose = require('mongoose');

const discussionReplySchema = new mongoose.Schema({
    discussionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Discussion',
        required: true,
        index: true
    },
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
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    parentReplyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DiscussionReply',
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
discussionReplySchema.index({ discussionId: 1, createdAt: 1 });
discussionReplySchema.index({ parentReplyId: 1 });

// Virtual for like count
discussionReplySchema.virtual('likeCount').get(function () {
    return this.likes.length;
});

// Ensure virtuals are included in JSON output
discussionReplySchema.set('toJSON', { virtuals: true });
discussionReplySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('DiscussionReply', discussionReplySchema);

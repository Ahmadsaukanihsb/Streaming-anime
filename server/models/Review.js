const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
    animeTitle: {
        type: String,
        required: true
    },
    animePoster: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 10
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
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    helpful: [{
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

// Compound index for unique review per user per anime
reviewSchema.index({ userId: 1, animeId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

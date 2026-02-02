const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true, // In real app, this should be hashed
    },
    avatar: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    communityRole: {
        type: String,
        enum: ['member', 'supporter', 'knight', 'guardian', 'legend', 'moderator', 'admin'],
        default: 'member',
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    bannedAt: {
        type: Date,
    },
    bannedReason: {
        type: String,
    },
    lastActive: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('User', userSchema);

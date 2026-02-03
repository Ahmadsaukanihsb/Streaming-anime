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
        default: 'member',
        trim: true,
        lowercase: true,
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
    refreshTokenHash: {
        type: String,
    },
    refreshTokenExpiresAt: {
        type: Date,
    },
    // Multi-device refresh tokens
    refreshTokens: [{
        hash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
        userAgent: { type: String },
        ip: { type: String }
    }],
});

module.exports = mongoose.model('User', userSchema);

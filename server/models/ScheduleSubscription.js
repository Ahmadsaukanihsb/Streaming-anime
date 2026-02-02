const mongoose = require('mongoose');

const scheduleSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
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
        type: String
    },
    // Schedule info
    scheduleDay: {
        type: String // 'Senin', 'Selasa', etc.
    },
    scheduleTime: {
        type: String // '21:00'
    },
    // For future push notification support
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for efficient lookup
scheduleSubscriptionSchema.index({ userId: 1, animeId: 1 }, { unique: true });

module.exports = mongoose.model('ScheduleSubscription', scheduleSubscriptionSchema);

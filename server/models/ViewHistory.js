const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
    animeId: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    // Store date as YYYY-MM-DD for easy daily aggregation
    dateString: {
        type: String,
        index: true
    }
});

// Compound index for efficient weekly queries
viewHistorySchema.index({ animeId: 1, date: -1 });

// Auto-delete views older than 30 days to save space
viewHistorySchema.index({ date: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

module.exports = mongoose.model('ViewHistory', viewHistorySchema);

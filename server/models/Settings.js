const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // Use built-in timestamps instead

module.exports = mongoose.model('Settings', SettingsSchema);

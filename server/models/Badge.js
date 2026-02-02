const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    // Unique identifier for the badge (used as communityRole value)
    roleId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    // Display name
    name: {
        type: String,
        required: true,
        trim: true
    },
    // Icon from lucide-react (e.g., 'Crown', 'Shield', 'Star', 'Award')
    icon: {
        type: String,
        default: 'Award'
    },
    // Color scheme
    bgColor: {
        type: String,
        default: 'bg-gray-500/20'
    },
    textColor: {
        type: String,
        default: 'text-gray-400'
    },
    // Sort order (lower = higher priority)
    order: {
        type: Number,
        default: 99
    },
    // Is this a system badge that cannot be deleted?
    isSystem: {
        type: Boolean,
        default: false
    },
    // Is this badge active?
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for sorting
badgeSchema.index({ order: 1 });

module.exports = mongoose.model('Badge', badgeSchema);

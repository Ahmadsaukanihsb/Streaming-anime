const mongoose = require('mongoose');

const skipTimeSchema = new mongoose.Schema({
    animeId: {
        type: String,
        required: true,
        index: true
    },
    malId: {
        type: Number,
        index: true
    },
    episodeNumber: {
        type: Number,
        required: true
    },
    // Opening (Intro) time range
    op: {
        startTime: {
            type: Number,
            default: 0
        },
        endTime: {
            type: Number,
            default: 85
        }
    },
    // Ending time range
    ed: {
        startTime: {
            type: Number,
            default: null
        },
        endTime: {
            type: Number,
            default: null
        }
    },
    // Episode-specific markers
    markers: [{
        time: {
            type: Number,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        color: {
            type: String,
            default: '#FFD700'
        }
    }],
    // Source of the data (aniskip, manual, etc)
    source: {
        type: String,
        enum: ['aniskip', 'manual', 'auto'],
        default: 'manual'
    },
    // Who created/updated this entry
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Episode duration for validation
    duration: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index untuk query cepat
skipTimeSchema.index({ animeId: 1, episodeNumber: 1 }, { unique: true });
skipTimeSchema.index({ malId: 1, episodeNumber: 1 });

module.exports = mongoose.model('SkipTime', skipTimeSchema);

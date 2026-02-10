const mongoose = require('mongoose');

const animeInteractionSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bookmarks: [{
        type: String, // animeId
    }],
    watchlist: [{
        type: String, // animeId
    }],
    watchHistory: [{
        animeId: String,
        episodeId: String,
        episodeNumber: Number,
        timestamp: Number,
        progress: Number,
        lastWatched: {
            type: Date,
            default: Date.now,
        }
    }],
    // New: User ratings for anime
    ratings: [{
        animeId: String,
        rating: {
            type: Number,
            min: 1,
            max: 10
        },
        ratedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // New: Episodes marked as watched per anime
    watchedEpisodes: [{
        animeId: String,
        episodes: [Number] // Array of episode numbers
    }],
    // New: Notification subscriptions (anime to follow)
    subscribedAnime: [{
        type: String // animeId
    }],
    // New: User settings
    settings: {
        autoPlayNext: {
            type: Boolean,
            default: true
        },
        autoSkipIntro: {
            type: Boolean,
            default: false
        },
        defaultQuality: {
            type: String,
            enum: ['480', '720', '1080', 'auto'],
            default: '1080'
        },
        notifyNewEpisode: {
            type: Boolean,
            default: true
        },
        notifyNewAnime: {
            type: Boolean,
            default: true
        }
    }
}, {
    versionKey: false, // Disable versioning to prevent version conflicts
    optimisticConcurrency: false // Disable optimistic concurrency
});

module.exports = mongoose.model('AnimeInteraction', animeInteractionSchema);

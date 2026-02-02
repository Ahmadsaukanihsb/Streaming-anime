const mongoose = require('mongoose');

const customAnimeSchema = new mongoose.Schema({
    // For manually added anime
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    synopsis: String,
    poster: String,
    rating: Number,
    status: String,
    type: { type: String, enum: ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'], default: 'TV' },
    episodes: Number,
    releasedYear: Number,
    studio: String,
    genres: [String],
    views: Number,
    trailer: String, // YouTube embed URL or direct video URL
    trailerType: { type: String, enum: ['youtube', 'direct'], default: 'youtube' },
    malId: Number, // MyAnimeList ID for Smashy Stream
    tmdbId: Number, // TMDB ID for Smashy Stream /tv endpoint
    episodeData: [{ // Episode details from Jikan
        ep: Number,
        title: String,
        releaseDate: String,
        streams: [{
            server: String,
            url: String,
            type: { type: String, default: 'embed' },
            quality: String
        }],
        subtitle: {
            url: String,
            language: String,
            provider: { type: String, enum: ['openai', 'local'] },
            generatedAt: Date
        }
    }],
    jadwalRilis: { // Release schedule for ongoing anime
        hari: String, // Senin, Selasa, etc.
        jam: String,  // 20:00
    },
    lastEpisodeUpload: Date, // Track last episode upload time
    isCustom: { type: Boolean, default: true },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: { type: Date, default: Date.now },
});

// Since we also need to track deleted IDs (blacklist)
const deletedAnimeSchema = new mongoose.Schema({
    animeId: { type: String, required: true, unique: true },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    deletedAt: { type: Date, default: Date.now },
});

module.exports = {
    CustomAnime: mongoose.model('CustomAnime', customAnimeSchema),
    DeletedAnime: mongoose.model('DeletedAnime', deletedAnimeSchema),
};

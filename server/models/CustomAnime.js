const mongoose = require('mongoose');

const customAnimeSchema = new mongoose.Schema({
    // For manually added anime
    id: { type: String, required: true, unique: true }, // Format lama: title-malId (contoh: naruto-12345)
    cleanSlug: { type: String, index: true }, // Format baru: title saja tanpa ID (contoh: naruto)
    title: { type: String, required: true },
    synopsis: String,
    poster: String,
    banner: String, // Banner image for hero/seo
    rating: Number,
    status: String,
    type: { type: String, enum: ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'], default: 'TV' },
    episodes: Number,
    duration: String, // Episode duration (e.g., "24 min per ep")
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
        thumbnail: String, // Episode thumbnail URL (auto-generated)
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

// Auto-generate cleanSlug before saving
customAnimeSchema.pre('save', function(next) {
    if (this.title && !this.cleanSlug) {
        this.cleanSlug = this.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Hapus karakter special
            .replace(/\s+/g, '-') // Spasi jadi dash
            .replace(/-+/g, '-') // Multiple dash jadi satu
            .replace(/^-|-$/g, ''); // Hapus dash di awal/akhir
    }
    next();
});

// Helper function to generate clean slug from title
function generateCleanSlug(title) {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Hapus karakter special
        .replace(/\s+/g, '-') // Spasi jadi dash
        .replace(/-+/g, '-') // Multiple dash jadi satu
        .replace(/^-|-$/g, ''); // Hapus dash di awal/akhir
}

// Helper function to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Method to find anime by either id or cleanSlug
customAnimeSchema.statics.findBySlug = async function(slug) {
    // Escape regex special characters untuk pencarian yang aman
    const safeSlug = escapeRegex(slug);
    
    // 1. Coba cari langsung dengan id (format exact match)
    let anime = await this.findOne({ id: slug });
    if (anime) return anime;
    
    // 2. Coba cari dengan cleanSlug
    anime = await this.findOne({ cleanSlug: slug });
    if (anime) return anime;
    
    // 3. Coba cari dengan id yang mengandung slug (partial match di awal)
    // Contoh: slug = "naruto", id = "naruto-shippuden-123"
    anime = await this.findOne({ id: { $regex: new RegExp(`^${safeSlug}[-\d]`, 'i') } });
    if (anime) return anime;
    
    // 4. Coba cari dengan id yang mengandung slug (partial match di mana saja)
    anime = await this.findOne({ id: { $regex: new RegExp(safeSlug, 'i') } });
    if (anime) return anime;
    
    // 5. Coba cari dengan title (case insensitive)
    const slugWithSpaces = slug.replace(/-/g, ' ');
    const safeSlugWithSpaces = escapeRegex(slugWithSpaces);
    anime = await this.findOne({ 
        title: { $regex: new RegExp(`^${safeSlugWithSpaces}$`, 'i') } 
    });
    if (anime) return anime;
    
    // 6. Coba cari dengan title yang mengandung (partial match)
    anime = await this.findOne({ 
        title: { $regex: new RegExp(safeSlugWithSpaces, 'i') } 
    });
    if (anime) return anime;
    
    // 7. Coba ekstrak ID angka dari format lama (contoh: naruto-12345)
    const match = slug.match(/-?(\d+)$/);
    if (match) {
        const possibleId = match[1];
        // Cari anime yang id-nya diakhiri dengan angka tersebut
        anime = await this.findOne({ id: { $regex: `-${possibleId}$` } });
        if (anime) return anime;
    }
    
    return null;
};

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

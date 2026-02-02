const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const BannedWord = require('../models/BannedWord');

// Helper function to check for banned words
async function containsBannedWord(text) {
    const bannedWords = await BannedWord.find({}, 'word');
    const words = bannedWords.map(b => b.word.toLowerCase());
    const textLower = text.toLowerCase();

    for (const word of words) {
        if (textLower.includes(word)) {
            return word;
        }
    }
    return null;
}

// Get all reviews (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { animeId, userId, sort = 'latest', limit = 20, page = 1 } = req.query;

        const filter = { isDeleted: false };
        if (animeId) filter.animeId = animeId;
        if (userId) filter.userId = userId;

        let sortOption = { createdAt: -1 }; // latest first
        if (sort === 'rating') sortOption = { rating: -1, createdAt: -1 };
        if (sort === 'helpful') sortOption = { 'helpful.length': -1, createdAt: -1 };
        if (sort === 'likes') sortOption = { 'likes.length': -1, createdAt: -1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reviews = await Review.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Review.countDocuments(filter);

        res.json({
            reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('[Review] Get all error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Get single review
router.get('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id).lean();
        if (!review || review.isDeleted) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json(review);
    } catch (err) {
        console.error('[Review] Get one error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Create new review
router.post('/', async (req, res) => {
    try {
        const { userId, userName, userAvatar, animeId, animeTitle, animePoster, rating, title, content } = req.body;

        if (!userId || !userName || !animeId || !animeTitle || !rating || !title || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check for banned words in title
        const bannedInTitle = await containsBannedWord(title);
        if (bannedInTitle) {
            return res.status(400).json({
                error: 'Judul review mengandung kata terlarang',
                bannedWord: bannedInTitle
            });
        }

        // Check for banned words in content
        const bannedInContent = await containsBannedWord(content);
        if (bannedInContent) {
            return res.status(400).json({
                error: 'Konten review mengandung kata terlarang',
                bannedWord: bannedInContent
            });
        }

        // Check if user already reviewed this anime
        const existing = await Review.findOne({ userId, animeId, isDeleted: false });
        if (existing) {
            return res.status(400).json({ error: 'Anda sudah mereview anime ini' });
        }

        // Get user's community role
        const user = await User.findById(userId).select('communityRole isAdmin').lean();
        let userRole = 'member';
        if (user) {
            if (user.isAdmin) userRole = 'admin';
            else if (user.communityRole) userRole = user.communityRole;
        }

        const review = new Review({
            userId,
            userName,
            userAvatar: userAvatar || '',
            userRole,
            animeId,
            animeTitle,
            animePoster: animePoster || '',
            rating: Math.min(10, Math.max(1, parseInt(rating))),
            title: title.trim(),
            content: content.trim()
        });

        await review.save();
        console.log('[Review] Created:', title, 'for', animeTitle);

        res.status(201).json(review);
    } catch (err) {
        console.error('[Review] Create error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Update review (owner only)
router.put('/:id', async (req, res) => {
    try {
        const { userId, rating, title, content } = req.body;

        const review = await Review.findById(req.params.id);
        if (!review || review.isDeleted) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.userId.toString() !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (rating) review.rating = Math.min(10, Math.max(1, parseInt(rating)));
        if (title) review.title = title.trim();
        if (content) review.content = content.trim();

        await review.save();
        res.json(review);
    } catch (err) {
        console.error('[Review] Update error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Delete review (owner or admin)
router.delete('/:id', async (req, res) => {
    try {
        const { userId, isAdmin } = req.body;

        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.userId.toString() !== userId && !isAdmin) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        review.isDeleted = true;
        await review.save();

        console.log('[Review] Deleted:', review.title);
        res.json({ success: true });
    } catch (err) {
        console.error('[Review] Delete error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Toggle like on review
router.post('/:id/like', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const review = await Review.findById(req.params.id);
        if (!review || review.isDeleted) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const likeIndex = review.likes.indexOf(userId);
        if (likeIndex === -1) {
            review.likes.push(userId);
        } else {
            review.likes.splice(likeIndex, 1);
        }

        await review.save();
        res.json({ likes: review.likes.length, isLiked: likeIndex === -1 });
    } catch (err) {
        console.error('[Review] Like error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Toggle helpful on review
router.post('/:id/helpful', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const review = await Review.findById(req.params.id);
        if (!review || review.isDeleted) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const helpfulIndex = review.helpful.indexOf(userId);
        if (helpfulIndex === -1) {
            review.helpful.push(userId);
        } else {
            review.helpful.splice(helpfulIndex, 1);
        }

        await review.save();
        res.json({ helpful: review.helpful.length, isHelpful: helpfulIndex === -1 });
    } catch (err) {
        console.error('[Review] Helpful error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

module.exports = router;

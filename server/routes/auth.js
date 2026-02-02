const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

const SALT_ROUNDS = 10;

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        user = new User({
            name,
            email,
            password: hashedPassword,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            isAdmin: false, // Admin harus di-set manual di database
        });

        await user.save();

        // Return user tanpa password
        const userResponse = user.toObject();
        delete userResponse.password;

        // Log activity
        const Activity = require('../models/Activity');
        await Activity.create({
            type: 'user_registered',
            description: 'User baru terdaftar',
            itemId: user._id.toString(),
            itemTitle: user.name,
            userName: 'System'
        });

        res.json(userResponse);
    } catch (err) {
        console.error('[Auth] Register error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        // Compare password dengan hash
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Return user tanpa password
        const userResponse = user.toObject();
        delete userResponse.password;
        res.json(userResponse);
    } catch (err) {
        console.error('[Auth] Login error:', err.message);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

module.exports = router;


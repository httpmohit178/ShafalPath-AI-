const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, targetRole } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      targetRole: targetRole || 'SDE',
      badges: ['First Step'],
      activityLog: [{ date: new Date().toISOString().split('T')[0], title: 'Joined SafalPath', score: 40 }]
    });

    res.json({ token: signToken(user._id), user, levelInfo: user.getLevelInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (user.streak.lastActiveDate === yesterday) {
      user.streak.current += 1;
      user.streak.best = Math.max(user.streak.best, user.streak.current);
    } else if (user.streak.lastActiveDate !== today) {
      user.streak.current = 1;
    }
    user.streak.lastActiveDate = today;
    await user.save();

    res.json({ token: signToken(user._id), user, levelInfo: user.getLevelInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user, levelInfo: req.user.getLevelInfo() });
});

module.exports = router;
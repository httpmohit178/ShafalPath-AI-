const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -passwordResetTokenHash -passwordResetExpires');
    if (!user) return res.status(401).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];
    if (user.dailyQuests.date !== today) {
      user.dailyQuests = { date: today, dsaDone: false, interviewDone: false, codingDone: false };
      await user.save();
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

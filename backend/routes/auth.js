const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const { recordDailyActivity } = require('../utils/streak');

const router = express.Router();
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const hasJwtSecret = (res) => {
  if (process.env.JWT_SECRET) return true;
  res.status(503).json({ error: 'JWT_SECRET is missing. Add it to backend/.env before creating or signing into accounts.' });
  return false;
};
const publicUser = (user) => { const value = user.toObject ? user.toObject() : { ...user }; delete value.password; delete value.passwordResetTokenHash; delete value.passwordResetExpires; return value; };
const emailFilter = (email) => ({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });

router.post('/register', async (req, res) => {
  try {
    if (!hasJwtSecret(res)) return;
    const { name, password, targetRole } = req.body;
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    if (!String(name || '').trim() || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (String(password).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const exists = await User.findOne(emailFilter(normalizedEmail));
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      targetRole: targetRole || 'SDE',
      badges: ['First Step'],
      activityLog: [{ date: new Date().toISOString().split('T')[0], title: 'Joined SafalPath', score: 40 }]
    });

    res.json({ token: signToken(user._id), user: publicUser(user), levelInfo: user.getLevelInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    if (!hasJwtSecret(res)) return;
    const { password } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne(emailFilter(email));
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    recordDailyActivity(user);
    await user.save();

    res.json({ token: signToken(user._id), user: publicUser(user), levelInfo: user.getLevelInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Enter your account email.' });
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM || !process.env.FRONTEND_URL) return res.status(503).json({ error: 'Password reset email is not configured. Set RESEND_API_KEY, MAIL_FROM, and FRONTEND_URL on the backend.' });
  try {
    const user = await User.findOne(emailFilter(email));
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      const link = `${process.env.FRONTEND_URL.replace(/\/$/, '')}/forgot-password?token=${token}`;
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.MAIL_FROM, to: [email], subject: 'Reset your SafalPath password', html: `<p>Use this link to choose a new SafalPath password. It expires in 30 minutes.</p><p><a href="${link}">Reset password</a></p><p>If you did not request this, ignore this email.</p>` }) });
      if (!response.ok) { user.passwordResetTokenHash = ''; user.passwordResetExpires = null; await user.save(); throw new Error('Reset email could not be sent. Check the email provider settings.'); }
    }
    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (err) { res.status(502).json({ error: err.message || 'Could not send the password reset email.' }); }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || String(password || '').length < 6) return res.status(400).json({ error: 'Use a valid reset link and a password with at least 6 characters.' });
  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
  const user = await User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ error: 'This password reset link is invalid or expired. Request a new one.' });
  user.password = await bcrypt.hash(String(password), 10); user.passwordResetTokenHash = ''; user.passwordResetExpires = null; await user.save();
  res.json({ message: 'Password updated. You can now log in.' });
});

router.get('/me', auth, async (req, res) => {
  res.json({ user: publicUser(req.user), levelInfo: req.user.getLevelInfo() });
});

module.exports = router;

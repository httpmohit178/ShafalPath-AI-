const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { randomInt } = require('crypto');
const { completeWeeklyChallenge } = require('../utils/weeklyChallenge');

const router = express.Router();
const todayKey = () => new Date().toISOString().slice(0, 10);
const resetDailyIfNeeded = (user) => {
  const today = todayKey();
  if (user.dailyQuests.date !== today) user.dailyQuests = { date: today, dsaDone: false, interviewDone: false, codingDone: false, assessmentDone: false };
  return today;
};

router.post('/roadmap/toggle', auth, async (req, res) => {
  try {
    const { weekIdx, taskIdx } = req.body;
    const user = req.user;
    if (!user.roadmap?.plan?.[weekIdx]?.tasks?.[taskIdx]) return res.status(404).json({ error: 'Roadmap task not found.' });
    const task = user.roadmap.plan[weekIdx].tasks[taskIdx];
    task.completed = !task.completed;

    if (task.completed && !task.xpAwarded) {
      user.xp += 10;
      task.xpAwarded = true;
      const completedCount = user.roadmap.plan.reduce(
        (sum, w) => sum + w.tasks.filter((t) => t.completed).length,
        0
      );
      if (completedCount >= 10 && !user.badges.includes('Planner')) {
        user.badges.push('Planner');
      }
    }
    user.markModified('roadmap');
    await user.save();
    res.json({ user, levelInfo: user.getLevelInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/dsa/solve', auth, async (req, res) => {
  try {
    const { title, topic, difficulty } = req.body;
    if (!title) return res.status(400).json({ error: 'Problem title is required.' });
    const user = req.user;
    resetDailyIfNeeded(user);
    const alreadySolved = user.dsaSolved.some((p) => p.title === title);
    if (!alreadySolved) {
      user.dsaSolved.push({ title, topic, difficulty });
      user.xp += 15;
      if (user.dsaSolved.length >= 10 && !user.badges.includes('DSA Grinder')) {
        user.badges.push('DSA Grinder');
      }
      const hardCount = user.dsaSolved.filter((p) => p.difficulty === 'Hard').length;
      if (hardCount >= 3 && !user.badges.includes('Hard Hitter')) {
        user.badges.push('Hard Hitter');
      }
      user.activityLog.unshift({
        date: new Date().toISOString().split('T')[0],
        title: `Solved DSA: ${title}`,
        score: 15
      });
    }
    user.dailyQuests.dsaDone = true;
    await user.save();
    res.json({ user, levelInfo: user.getLevelInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interview/complete', auth, async (req, res) => {
  try {
    const user = req.user;
    const today = resetDailyIfNeeded(user);
    user.interviewHistory.unshift({ type: req.body.round || 'Mock interview', score: req.body.score || 0, date: today });
    user.activityLog.unshift({ date: today, title: `Aria interview · ${req.body.role || 'Career practice'}`, score: req.body.score || 0 });
    if (!user.dailyQuests.interviewDone) {
      user.dailyQuests.interviewDone = true; user.xp += 40;
      if (!user.badges.includes('First Interview')) user.badges.push('First Interview');
    }
    if ((req.body.score || 0) >= 80 && !user.badges.includes('Smooth Talker')) user.badges.push('Smooth Talker');
    completeWeeklyChallenge(user, 'aria-round');
    await user.save(); res.json({ user, levelInfo: user.getLevelInfo() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/coding/complete', auth, async (req, res) => {
  try {
    const user = req.user; const today = resetDailyIfNeeded(user);
    if (req.body.passedTest !== true) return res.status(400).json({ error: 'Pass the challenge sample test before submitting.' });
    if (!user.dailyQuests.codingDone) {
      user.dailyQuests.codingDone = true; user.xp += 40;
      user.activityLog.unshift({ date: today, title: `Completed coding challenge: ${req.body.title || 'Daily challenge'}`, score: 40 });
      if (!user.badges.includes('All Green')) user.badges.push('All Green');
    }
    completeWeeklyChallenge(user, 'arena-problem');
    await user.save(); res.json({ user, levelInfo: user.getLevelInfo() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/assessment/complete', auth, async (req, res) => {
  try {
    const categories = ['JavaScript', 'React', 'Web fundamentals'];
    const category = categories.includes(req.body.category) ? req.body.category : null;
    const score = Number(req.body.score); const total = Number(req.body.total); const warnings = Number(req.body.warnings) || 0;
    if (!category || total !== 5 || !Number.isInteger(score) || score < 0 || score > total || !Number.isInteger(warnings) || warnings < 0 || warnings > 20) return res.status(400).json({ error: 'Assessment result is invalid.' });
    const user = req.user; const today = resetDailyIfNeeded(user);
    user.assessmentHistory.unshift({ category, score, total, warnings, date: today });
    user.assessmentHistory = user.assessmentHistory.slice(0, 30);
    let xpAwarded = 0;
    if (!user.dailyQuests.assessmentDone) { user.dailyQuests.assessmentDone = true; user.xp += 25; xpAwarded = 25; user.activityLog.unshift({ date: today, title: `Completed ${category} assessment · ${score}/${total}`, score: 25 }); }
    if (score >= 4 && !user.badges.includes('Assessment Ace')) user.badges.push('Assessment Ace');
    if (warnings === 0 && !user.badges.includes('Focused Mind')) user.badges.push('Focused Mind');
    const weeklyXpAwarded = completeWeeklyChallenge(user, 'assessment-week') ? 60 : 0;
    await user.save(); res.json({ user, levelInfo: user.getLevelInfo(), xpAwarded, weeklyXpAwarded });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/profile/avatar', auth, async (req, res) => {
  try {
    const allowed = ['🌱', '🚀', '🦊', '🐼', '🦉', '🐯', '🐸', '🦋', '🐙', '🦄'];
    if (!allowed.includes(req.body.avatar)) return res.status(400).json({ error: 'Choose an avatar from the SafalPath collection.' });
    req.user.avatar = req.body.avatar; await req.user.save();
    res.json({ user: req.user, levelInfo: req.user.getLevelInfo() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/resume-draft', auth, async (req, res) => {
  try {
    const fields = ['fullName', 'email', 'location', 'title', 'summary', 'skills', 'experience', 'projects', 'education'];
    const draft = {};
    fields.forEach((field) => { draft[field] = String(req.body[field] || '').slice(0, field === 'experience' || field === 'projects' ? 8000 : 1500); });
    req.user.resumeDraft = draft; await req.user.save();
    res.json({ user: req.user, levelInfo: req.user.getLevelInfo() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rewards/spin', auth, async (req, res) => {
  try {
    const user = req.user; const today = todayKey();
    if (user.lastSpinDate === today) return res.json({ user, levelInfo: user.getLevelInfo(), reward: user.lastSpinReward, alreadySpun: true });
    const prizes = [10, 15, 20, 25, 30, 40, 50, 75];
    const reward = prizes[randomInt(prizes.length)];
    user.xp += reward; user.lastSpinDate = today; user.lastSpinReward = reward;
    if (!user.badges.includes('Lucky Spinner')) user.badges.push('Lucky Spinner');
    user.activityLog.unshift({ date: today, title: 'Daily XP spin', score: reward });
    await user.save();
    res.json({ user, levelInfo: user.getLevelInfo(), reward, alreadySpun: false });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/leaderboard', auth, async (req, res) => {
  try {
    const topUsers = await User.find().sort({ xp: -1 }).limit(10).select('name xp streak avatar');
    res.json(topUsers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.post('/roadmap/toggle', auth, async (req, res) => {
  try {
    const { weekIdx, taskIdx } = req.body;
    const user = req.user;
    const task = user.roadmap.plan[weekIdx].tasks[taskIdx];
    task.completed = !task.completed;

    if (task.completed) {
      user.xp += 10;
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
    const user = req.user;
    const alreadySolved = user.dsaSolved.some((p) => p.title === title);
    if (!alreadySolved) {
      user.dsaSolved.push({ title, topic, difficulty });
      user.xp += 15;
      user.dailyQuests.dsaDone = true;
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
      await user.save();
    }
    res.json({ user, levelInfo: user.getLevelInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard', auth, async (req, res) => {
  const topUsers = await User.find().sort({ xp: -1 }).limit(10).select('name xp streak');
  res.json(topUsers);
});

module.exports = router;
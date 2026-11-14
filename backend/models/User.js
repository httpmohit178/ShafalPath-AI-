const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  targetRole: { type: String, default: 'SDE' },
  resumeText: { type: String, default: '' },
  atsScore: { type: Number, default: 0 },
  skills: [{ type: String }],
  missingSkills: [{ type: String }],
  xp: { type: Number, default: 40 },
  streak: {
    current: { type: Number, default: 1 },
    best: { type: Number, default: 1 },
    lastActiveDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
  },
  roadmap: {
    weeks: { type: Number, default: 6 },
    hoursPerDay: { type: Number, default: 3 },
    plan: { type: Array, default: [] }
  },
  dsaSolved: [{
    title: String,
    topic: String,
    difficulty: String
  }],
  interviewHistory: [{
    type: { type: String },
    score: Number,
    correctness: Number,
    communication: Number,
    confidence: Number,
    date: { type: String, default: () => new Date().toISOString().split('T')[0] }
  }],
  badges: [{ type: String }],
  dailyQuests: {
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    dsaDone: { type: Boolean, default: false },
    interviewDone: { type: Boolean, default: false },
    codingDone: { type: Boolean, default: false }
  },
  activityLog: [{
    date: String,
    title: String,
    score: Number
  }]
}, { timestamps: true });

userSchema.methods.getLevelInfo = function () {
  const level = Math.floor(this.xp / 50) + 1;
  const titles = ['Fresher', 'Learner', 'Builder', 'Contender', 'Placement Ready'];
  const title = titles[Math.min(level - 1, titles.length - 1)];
  const xpInCurrentLevel = this.xp % 50;
  return {
    level,
    title,
    progressPercent: (xpInCurrentLevel / 50) * 100,
    xpToNext: 50 - xpInCurrentLevel
  };
};

module.exports = mongoose.model('User', userSchema);
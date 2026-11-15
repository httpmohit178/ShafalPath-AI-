const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  passwordResetTokenHash: { type: String, default: '' },
  passwordResetExpires: { type: Date, default: null },
  targetRole: { type: String, default: 'SDE' },
  avatar: { type: String, default: '🌱' },
  resumeText: { type: String, default: '' },
  resumeRewrite: { type: String, default: '' },
  resumeDraft: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    location: { type: String, default: '' },
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    skills: { type: String, default: '' },
    experience: { type: String, default: '' },
    projects: { type: String, default: '' },
    education: { type: String, default: '' }
  },
  atsScore: { type: Number, default: 0 },
  skills: [{ type: String }],
  missingSkills: [{ type: String }],
  jobMatches: [{ company: String, score: Number, date: String }],
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
  assessmentHistory: [{ category: String, score: Number, total: Number, warnings: Number, date: String }],
  badges: [{ type: String }],
  dailyQuests: {
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    dsaDone: { type: Boolean, default: false },
    interviewDone: { type: Boolean, default: false },
    codingDone: { type: Boolean, default: false },
    assessmentDone: { type: Boolean, default: false }
  },
  weeklyChallenges: {
    weekKey: { type: String, default: '' },
    completed: [{ type: String }]
  },
  lastSpinDate: { type: String, default: '' },
  lastSpinReward: { type: Number, default: 0 },
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

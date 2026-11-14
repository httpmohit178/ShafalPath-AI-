require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/user');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch((err) => console.error('❌ MongoDB Error:', err.message));
} else {
  console.error('⚠️ MONGO_URI is missing. Configure backend/.env to enable accounts and persistent progress.');
}

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  aiConfigured: Boolean(process.env.GROQ_API_KEY),
  codeRunnerConfigured: Boolean(process.env.CODE_RUNNER_API_KEY),
  provider: 'groq',
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
}));

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 SafalPath Backend running on http://localhost:${PORT}`));

const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Ensure GEMINI_API_KEY is set in Render -> Environment
const getAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in server environment variables');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

// 1. Margdarshak AI Placement Chatbot
router.post('/chat', auth, async (req, res) => {
  try {
    const ai = getAI();
    const { message } = req.body;
    const u = await User.findById(req.user.id);
    const context = `Student: ${u?.name || 'Candidate'}, Target Role: ${u?.targetRole || 'SDE'}, XP: ${u?.xp || 0}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are Margdarshak AI, a warm, practical Indian tech placement mentor.
User Context: ${context}
Answer clearly in 3-5 concise bullet points or short sentences.
Student question: ${message}`,
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error('AI Chat Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. AI Mock Interviewer (Generates Questions & Evaluates Answers)
router.post('/interview', auth, async (req, res) => {
  try {
    const ai = getAI();
    const { role = 'Software Development Engineer', round = 'Technical DSA & Core CS', history = [], userAnswer } = req.body;

    const prompt = userAnswer
      ? `You are a senior technical interviewer hiring for ${role} (${round}).
Previous conversation: ${JSON.stringify(history)}
Candidate's latest answer: "${userAnswer}"
1. Score the answer out of 10.
2. Give 2 sentences of constructive feedback (strength + improvement).
3. Ask the next logical follow-up or new interview question.
Respond strictly in JSON format: {"score": number, "feedback": "string", "nextQuestion": "string"}`
      : `You are a senior technical interviewer hiring for ${role} (${round}).
Greet the candidate briefly and ask the first realistic interview question.
Respond strictly in JSON format: {"score": null, "feedback": "", "nextQuestion": "string"}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    res.json(JSON.parse(response.text));
  } catch (err) {
    console.error('Mock Interview Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Live Code Compiler & AI Complexity Analyzer (Supports Python, C++, Java, JavaScript)
router.post('/run-code', auth, async (req, res) => {
  try {
    const ai = getAI();
    const { language, code, stdin = '', problemTitle = 'Custom Sandbox' } = req.body;

    // Fast path for JavaScript using Piston public execution engine, fallback to Gemini sandbox for C++/Java/Python/JS
    const pistonRuntimes = {
      javascript: { language: 'javascript', version: '18.15.0' },
      python: { language: 'python', version: '3.10.0' },
      cpp: { language: 'c++', version: '10.2.0' },
      java: { language: 'java', version: '15.0.2' },
    };

    let executionOutput = '';
    let executionError = '';

    if (pistonRuntimes[language]) {
      const execRes = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonRuntimes[language].language,
          version: pistonRuntimes[language].version,
          files: [{ content: code }],
          stdin,
        }),
      });
      const execData = await execRes.json();
      executionOutput = execData.run?.stdout || '';
      executionError = execData.run?.stderr || '';
    }

    // AI Time/Space Complexity & Optimization Feedback
    const reviewRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze this ${language} code for "${problemTitle}":
\`\`\`${language}
${code}
\`\`\`
Provide a 2-line Time & Space Complexity analysis and 1 optimization tip.`,
    });

    res.json({
      stdout: executionOutput,
      stderr: executionError,
      aiReview: reviewRes.text,
    });
  } catch (err) {
    console.error('Compiler Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
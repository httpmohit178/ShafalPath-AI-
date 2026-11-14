const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const hasValidKey = () =>
  process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
  process.env.GEMINI_API_KEY.trim().length > 10;

const getClient = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const askGeminiJSON = async (prompt) => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(response.text);
};

// 1. AI Resume Analyzer
router.post('/analyze-resume', auth, upload.single('resumePdf'), async (req, res) => {
  try {
    let text = req.body.resumeText || '';
    const targetRole = req.body.targetRole || req.user.targetRole;

    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer);
        text = parsed.text;
      } else {
        text = req.file.buffer.toString('utf-8');
      }
    }

    if (!text.trim()) return res.status(400).json({ error: 'Please upload a PDF/TXT or paste resume text.' });

    let analysis;
    if (hasValidKey()) {
      analysis = await askGeminiJSON(`Analyze this resume for "${targetRole}". Return JSON:
      { "atsScore": number (0-100), "skills": [string], "missingSkills": [string], "projects": [string], "feedback": [string] }
      Resume:\n${text}`);
    } else {
      analysis = {
        atsScore: 84,
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
        missingSkills: ['System Design', 'Docker', 'TypeScript', 'Unit Testing'],
        projects: ['Full Stack Web Application'],
        feedback: ['Add GEMINI_API_KEY in backend/.env for live AI resume analysis.']
      };
    }

    const user = req.user;
    user.resumeText = text;
    user.targetRole = targetRole;
    user.atsScore = analysis.atsScore;
    user.skills = analysis.skills || [];
    user.missingSkills = analysis.missingSkills || [];
    user.xp += 25;
    if (!user.badges.includes('Resume Ready')) user.badges.push('Resume Ready');
    if (analysis.atsScore >= 80 && !user.badges.includes('ATS Ace')) user.badges.push('ATS Ace');
    user.activityLog.unshift({
      date: new Date().toISOString().split('T')[0],
      title: 'Resume Analyzed',
      score: analysis.atsScore
    });
    await user.save();

    res.json({ analysis, user, levelInfo: user.getLevelInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. JD Matcher
router.post('/match-jd', auth, async (req, res) => {
  try {
    const { jobDescription, company } = req.body;
    const resume = req.user.resumeText || 'Entry level software developer with JavaScript, React, Node.js, DSA.';

    if (!hasValidKey()) {
      return res.json({
        matchPercent: 76,
        matchedKeywords: ['React', 'JavaScript', 'REST APIs', 'Problem Solving'],
        missingKeywords: ['Docker', 'CI/CD', 'Redis', 'Microservices'],
        suggestions: ['Add GEMINI_API_KEY in backend/.env for live JD comparison.']
      });
    }

    const match = await askGeminiJSON(`Compare this resume with the Job Description for ${company || 'Target Company'}. Return JSON:
    { "matchPercent": number, "matchedKeywords": [string], "missingKeywords": [string], "suggestions": [string] }
    Resume:\n${resume}\n\nJD:\n${jobDescription}`);

    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Learning Roadmap
router.post('/roadmap', auth, async (req, res) => {
  try {
    const { targetRole, weeks, hoursPerDay } = req.body;
    const missing = (req.user.missingSkills || []).join(', ');

    let plan;
    if (hasValidKey()) {
      plan = await askGeminiJSON(`Generate a ${weeks}-week placement roadmap for "${targetRole}" (${hoursPerDay} hrs/day).
      Prioritize missing skills if any: ${missing || 'Core DSA, System Design, Projects'}.
      Include 4-6 tasks per week. Return JSON array:
      [{ "week": 1, "title": "Core Language & Basics", "subtitle": "Solidify fundamentals", "tasks": [{ "title": "Language fundamentals", "type": "Learn", "hours": "5h", "resource": "Official Docs + freeCodeCamp", "completed": false }] }]`);
    } else {
      plan = [
        {
          week: 1,
          title: 'Core Language & Basics',
          subtitle: 'Solidify a primary programming language and fundamental coding concepts',
          tasks: [
            { title: 'Language fundamentals (syntax, OOP, standard library)', type: 'Learn', hours: '5h', resource: 'Official Python/Java docs + freeCodeCamp video series', completed: false },
            { title: 'Arrays & Strings concepts', type: 'Learn', hours: '5h', resource: 'GeeksforGeeks articles + YouTube DSA playlist', completed: false },
            { title: 'Complexity analysis (Big-O)', type: 'Learn', hours: '3h', resource: 'Big-O Cheat Sheet & Coursera intro lecture', completed: false }
          ]
        },
        {
          week: 2,
          title: 'Core Data Structures & Patterns',
          subtitle: 'Master Linked Lists, Stacks, Queues, Trees & Hashing',
          tasks: [
            { title: 'Two Pointers & Sliding Window patterns', type: 'Practice', hours: '6h', resource: 'NeetCode 150 roadmap', completed: false },
            { title: 'Trees & Graph BFS/DFS traversal', type: 'Practice', hours: '6h', resource: 'Striver A2Z DSA Sheet', completed: false }
          ]
        }
      ];
    }

    const user = req.user;
    user.targetRole = targetRole;
    user.roadmap = { weeks, hoursPerDay, plan };
    await user.save();

    res.json({ user, levelInfo: user.getLevelInfo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Aria AI Mock Interview
router.post('/interview', auth, async (req, res) => {
  try {
    const { action, roundType, answers } = req.body;
    if (action === 'start') {
      if (!hasValidKey()) {
        return res.json({
          questions: [
            'Can you briefly introduce yourself and describe a recent project you worked on, highlighting the technologies and your specific contributions?',
            'What is the difference between synchronous and asynchronous execution in JavaScript/Node.js?',
            'How would you optimize a slow database query in MongoDB or SQL?',
            'Explain time and space complexity for searching in a balanced Binary Search Tree vs a Hash Map.',
            'Tell me about a challenging bug you debugged recently and how you resolved it.'
          ]
        });
      }
      const data = await askGeminiJSON(`You are Aria, an AI Interviewer. Generate 5 ${roundType} interview questions for a ${req.user.targetRole} candidate. Question 1 should ask for a brief intro and a recent project. Return JSON: { "questions": [string] }`);
      return res.json(data);
    }

    if (action === 'score') {
      let report;
      if (hasValidKey()) {
        report = await askGeminiJSON(`You are Aria, an AI Interviewer. Score this ${roundType} interview transcript on 3 axes (0-100). Return JSON:
        { "correctness": number, "communication": number, "confidence": number, "overall": number, "summary": string, "tips": [string] }
        Transcript:\n${JSON.stringify(answers)}`);
      } else {
        report = {
          correctness: 78,
          communication: 82,
          confidence: 80,
          overall: 80,
          summary: 'Good structured explanations! Add GEMINI_API_KEY in backend/.env for deep AI answer evaluation.',
          tips: ['Quantify project impact with metrics', 'Discuss edge cases upfront']
        };
      }

      const user = req.user;
      user.interviewHistory.push({
        type: roundType,
        score: report.overall,
        correctness: report.correctness,
        communication: report.communication,
        confidence: report.confidence
      });
      user.xp += 40;
      user.dailyQuests.interviewDone = true;
      if (!user.badges.includes('First Interview')) user.badges.push('First Interview');
      if (report.overall >= 80 && !user.badges.includes('Smooth Talker')) user.badges.push('Smooth Talker');
      user.activityLog.unshift({
        date: new Date().toISOString().split('T')[0],
        title: `${roundType} mock interview`,
        score: report.overall
      });
      await user.save();

      return res.json({ report, user, levelInfo: user.getLevelInfo() });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DSA Recommender
router.post('/dsa-recommend', auth, async (req, res) => {
  try {
    const { topics } = req.body;
    if (!hasValidKey()) {
      return res.json([
        { title: 'Climbing Stairs', topic: 'Dynamic Programming', difficulty: 'Easy', summary: 'Classic DP that introduces the recurrence f(i)=f(i-1)+f(i-2)', leetcodeUrl: 'https://leetcode.com/problems/climbing-stairs/' },
        { title: 'Number of Islands', topic: 'Graphs', difficulty: 'Easy', summary: 'Simple DFS/BFS flood-fill problem that reinforces grid traversal', leetcodeUrl: 'https://leetcode.com/problems/number-of-islands/' },
        { title: 'Maximum Subarray', topic: 'Dynamic Programming', difficulty: 'Easy', summary: "Kadane's algorithm is a linear-time DP technique for optimal subarrays", leetcodeUrl: 'https://leetcode.com/problems/maximum-subarray/' },
        { title: 'Coin Change', topic: 'Dynamic Programming', difficulty: 'Medium', summary: 'Teaches unbounded knapsack DP, handling multiple sub-problems', leetcodeUrl: 'https://leetcode.com/problems/coin-change/' },
        { title: 'Course Schedule', topic: 'Graphs', difficulty: 'Medium', summary: "Requires cycle detection in a directed graph via DFS or Kahn's algorithm", leetcodeUrl: 'https://leetcode.com/problems/course-schedule/' },
        { title: 'Edit Distance', topic: 'Dynamic Programming', difficulty: 'Hard', summary: 'A two-dimensional DP that covers insert, delete, replace operations', leetcodeUrl: 'https://leetcode.com/problems/edit-distance/' }
      ]);
    }
    const problems = await askGeminiJSON(`Recommend 8 LeetCode-style DSA problems covering: ${topics.join(', ')}. Include 3 Easy, 3 Medium, 2 Hard. Return JSON array:
    [{ "title": "Climbing Stairs", "topic": "Dynamic Programming", "difficulty": "Easy", "summary": "Classic DP recurrence f(i)=f(i-1)+f(i-2)", "leetcodeUrl": "https://leetcode.com/problems/climbing-stairs/" }]`);
    res.json(problems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Live Coding Problem Generator & AI Judge
router.post('/coding', auth, async (req, res) => {
  try {
    const { action, topic, difficulty, problem, language, code, customInput } = req.body;

    if (action === 'generate') {
      if (!hasValidKey()) {
        return res.json({
          title: 'Reachable Nodes in an Undirected Graph',
          difficulty,
          description: 'Given an undirected graph with n nodes labeled from 0 to n-1 and a list of edges, return all nodes that are reachable from a given start node sorted in ascending order.',
          inputs: ['n - number of nodes', 'edges - list of pairs [u, v]', 'start - starting node'],
          output: 'An array of integers sorted in non-decreasing order.',
          example: { input: 'n = 5, edges = [[0,1],[1,2],[3,4]], start = 0', output: '[0, 1, 2]' },
          boilerplates: {
            cpp: 'class Solution {\npublic:\n    vector<int> reachableNodes(int n, vector<vector<int>>& edges, int start) {\n        // Write your BFS/DFS solution here\n    }\n};',
            python: 'class Solution:\n    def reachableNodes(self, n: int, edges: list[list[int]], start: int) -> list[int]:\n        # Write your BFS/DFS solution here\n        pass',
            javascript: 'function reachableNodes(n, edges, start) {\n    // Write your BFS/DFS solution here\n}'
          }
        });
      }
      const generated = await askGeminiJSON(`Generate 1 original LeetCode-style coding problem on topic "${topic}" with difficulty "${difficulty}". Return JSON:
      {
        "title": string,
        "difficulty": "${difficulty}",
        "description": string,
        "inputs": [string],
        "output": string,
        "example": { "input": string, "output": string },
        "boilerplates": {
          "cpp": string,
          "python": string,
          "javascript": string
        }
      }`);
      return res.json(generated);
    }

    if (action === 'submit') {
      let verdict;
      if (!hasValidKey()) {
        verdict = {
          passed: code.trim().length > 40,
          passedTests: code.trim().length > 40 ? '5/5' : '0/5',
          runtime: '28 ms',
          output: '[0, 1, 2]',
          aiReview: code.trim().length > 40
            ? 'Clean solution! Add GEMINI_API_KEY in backend/.env for line-by-line complexity analysis.'
            : 'Please write a complete implementation before submitting.'
        };
      } else {
        verdict = await askGeminiJSON(`Act as an online code judge & reviewer. Evaluate this ${language} solution for the problem "${problem.title}".
        Problem: ${problem.description}
        Custom Input (if any): ${customInput || 'Use standard test cases'}
        Code:\n${code}
        Return JSON: { "passed": boolean, "passedTests": "5/5", "runtime": "32 ms", "output": string, "aiReview": string }`);
      }

      if (verdict.passed) {
        const user = req.user;
        user.xp += 40;
        user.dailyQuests.codingDone = true;
        if (!user.badges.includes('All Green')) user.badges.push('All Green');
        user.activityLog.unshift({
          date: new Date().toISOString().split('T')[0],
          title: `Solved Live Coding: ${problem.title}`,
          score: 100
        });
        await user.save();
        return res.json({ verdict, user, levelInfo: user.getLevelInfo() });
      }
      return res.json({ verdict });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Margdarshak AI Assistant
router.post('/margdarshak', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const u = req.user;
    if (!hasValidKey()) {
      return res.json({
        reply: `Namaste ${u.name}! 🙏 Your current streak is ${u.streak.current} day(s) with ${u.xp} XP.\n\n1. Start by uploading your resume in Resume Analyzer.\n2. Generate your 6-week roadmap for ${u.targetRole}.\n3. Add your free GEMINI_API_KEY in backend/.env to unlock live personalized AI responses!`
      });
    }

    const ai = getClient();
    const context = `Student: ${u.name}, Role: ${u.targetRole}, ATS Score: ${u.atsScore}, XP: ${u.xp}, Streak: ${u.streak.current} days, Missing Skills: ${u.missingSkills.join(', ')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are Margdarshak AI, a warm, encouraging Indian placement mentor inside SafalPath.
      User Context: ${context}
      Give practical, actionable advice in 3-5 short sentences or bullet points.
      Student question: ${message}`
    });
    res.json({ reply: response.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
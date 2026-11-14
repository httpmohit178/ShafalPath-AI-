const BANKS = {
  technology: [
    'Walk me through a project you built. What did you personally contribute, and what trade-off did you make?',
    'How would you investigate a slow API endpoint in a MERN application?',
    'Tell me about a difficult bug. How did you find its root cause?',
    'How would you design authentication for a small web application?',
    'How do you test a feature when requirements are still changing?',
    'Explain a data structure you used recently and why it fit the problem.'
  ],
  data: ['How do you check a dataset for missing or unreliable values?', 'Describe a time data changed a recommendation you made.', 'Which metric would you choose for this role and why?'],
  general: ['Tell me about a piece of work you are proud of and the part you handled.', 'Describe a time you had to learn something quickly.', 'How do you prioritize when several deadlines compete?', 'Tell me about feedback you received and how you used it.', 'What would your teammates say you contribute?']
};

function bankFor(role = '') {
  if (/engineer|developer|software|frontend|backend|full.?stack|sde|technology/i.test(role)) return BANKS.technology;
  if (/data|analyst|research|scient/i.test(role)) return BANKS.data;
  return BANKS.general;
}

function localInterviewReply({ role = 'this role', round = 'Experience & projects', userAnswer, resumeText = '' }) {
  const bank = bankFor(role);
  if (!userAnswer) {
    const hint = resumeText.match(/(?:project|experience|internship)[^\n]{0,100}/i)?.[0];
    return { score: null, feedback: '', nextQuestion: hint ? `I noticed “${hint.trim()}” on your resume. What did you personally contribute, and what changed because of your work?` : `Let's begin with ${round.toLowerCase()}: ${bank[0]}` };
  }
  const words = userAnswer.trim().split(/\s+/).filter(Boolean).length;
  const specific = /\d|%|because|result|improv|reduc|increas|project|customer|team/i.test(userAnswer);
  const score = Math.max(3, Math.min(10, 4 + Number(words >= 25) + Number(words >= 60) + Number(specific) + Number(/I |my /i.test(userAnswer))));
  return { score, feedback: `${words >= 25 ? 'You gave useful context for your approach.' : 'You answered directly and have a clear starting point.'} ${specific ? 'Make your individual contribution explicit.' : 'Add a specific example, the action you took, and the outcome.'}`, nextQuestion: bank[Math.floor(Math.random() * bank.length)] };
}

function localMentorReply(message = '') {
  const q = String(message).toLowerCase();
  if (/resume|ats|cv/.test(q)) return 'Resume tip: tailor the top third to the role, use clear section headings, and write experience bullets as action + method + result. Add numbers only when you can support them.';
  if (/interview|tell me about yourself|behavior|star/.test(q)) return 'For behavioral questions, use STAR: briefly set the situation and task, explain your actions, then finish with a concrete result and what you learned. Practice with Aria for a five-question round.';
  if (/dsa|algorithm|coding|leetcode|array|string/.test(q)) return 'For coding practice, state a simple approach first, test a small example, then improve it. Explain time and space complexity and check edge cases such as empty input and duplicates.';
  if (/roadmap|plan|first|today|start/.test(q)) return 'A focused session: 30 minutes reviewing one target role, 45 minutes on one skill gap, 30 minutes solving a practice problem, and 15 minutes writing down what to improve tomorrow. Keep the goal small enough to finish.';
  if (/salary|offer|job|apply|career/.test(q)) return 'For job applications, compare the role requirements with evidence from your projects, tailor your resume, and keep a short tracker of applications and follow-ups. I can help with resume, interview, DSA, or study-plan questions.';
  return 'I can help with resume and ATS tips, common interview questions, STAR answers, DSA practice, role preparation, and a daily study plan. Try asking about one of those and include your target role for more relevant guidance.';
}

module.exports = { localInterviewReply, localMentorReply };

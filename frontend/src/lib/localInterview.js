const BANKS = {
  technology: [
    'Walk me through a project you built. What was your contribution and the main trade-off you made?',
    'How do you break down an unfamiliar technical problem before writing code?',
    'Tell me about a bug that took time to solve. How did you find the root cause?',
    'How do you make sure your work is reliable when requirements change?',
    'Describe a time you disagreed with a teammate about an implementation. How did you resolve it?',
    'What would you improve next in the project you are most proud of?'
  ],
  data: ['How would you check whether a dataset is complete and trustworthy?', 'Tell me about a time you turned data into a recommendation for someone else.', 'How do you explain an analysis when the results are uncertain?', 'Which metric would you choose to measure success for this role, and why?', 'Describe how you would investigate a sudden change in a key metric.'],
  sales: ['How do you learn what a potential customer actually needs?', 'Tell me about a time you handled a rejection and what you did next.', 'How would you prioritize several prospects who are at different stages?', 'How do you build trust with a customer who is unsure about a product?', 'What would you do if a customer asks for a feature the product does not have?'],
  marketing: ['How would you plan a campaign for a new audience with a limited budget?', 'Which signals would tell you a campaign is reaching the right people?', 'Tell me about a message or piece of content you improved. What changed?', 'How would you respond if engagement is high but conversions are low?', 'How do you keep a brand message consistent across channels?'],
  people: ['How would you help a new team member feel welcome and productive?', 'Tell me about a sensitive conversation you handled with care.', 'How do you balance an employee request with a policy or business need?', 'How would you protect confidentiality while resolving a workplace concern?', 'Describe how you organize several hiring or people tasks at once.'],
  service: ['How would you help an upset customer feel heard and reach a solution?', 'Tell me about a time you turned a negative experience around.', 'What would you do if you do not know the answer to a customer question?', 'How do you balance speed with a thoughtful, accurate response?', 'How would you handle several urgent support requests at once?'],
  education: ['How would you explain a difficult idea to someone encountering it for the first time?', 'How do you adapt your approach when a learner is struggling?', 'Tell me about a time you helped someone make progress.', 'How do you know whether a lesson or learning activity worked?', 'How would you create an inclusive learning environment?'],
  healthcare: ['How do you communicate clearly with a person who is worried or in pain?', 'What steps do you take to protect privacy and follow procedure?', 'Tell me about a time you stayed calm in a demanding situation.', 'How do you make sure important information is handed over accurately?', 'How would you respond when a patient or family member has a concern?'],
  operations: ['How would you find the cause of a process that keeps running late?', 'Tell me about a time you made a process simpler or more reliable.', 'How do you prioritize when several deadlines compete?', 'What would you do if a supplier or partner missed an important commitment?', 'How would you measure whether a process improvement worked?'],
  finance: ['How do you check your work when accuracy matters?', 'How would you explain a financial result to someone without a finance background?', 'Tell me about a time you caught a discrepancy or risk.', 'How do you handle confidential financial information?', 'How would you investigate a result that differs from the forecast?'],
  general: ['Tell me about a piece of work you are proud of and the part you personally handled.', 'Describe a time you had to learn something quickly to complete a task.', 'How do you organize your work when several priorities compete?', 'Tell me about a time you received feedback and used it to improve.', 'What would your teammates say you contribute to a team?']
};

function groupFor(role = '') {
  const value = role.toLowerCase();
  if (/data|analyst|scient|research|business intelligence/.test(value)) return 'data';
  if (/sales|account executive|business development/.test(value)) return 'sales';
  if (/market|content|social media|brand|seo/.test(value)) return 'marketing';
  if (/human resource|\bhr\b|recruit|people|talent/.test(value)) return 'people';
  if (/support|customer service|success|call center/.test(value)) return 'service';
  if (/teacher|teach|educat|tutor|instructor|professor/.test(value)) return 'education';
  if (/health|nurse|doctor|clinical|medical|caregiver/.test(value)) return 'healthcare';
  if (/operation|project manager|product manager|logistic|supply/.test(value)) return 'operations';
  if (/finance|accountant|audit|bank|investment/.test(value)) return 'finance';
  if (/engineer|developer|software|frontend|backend|full stack|\bsde\b|technology|data/.test(value)) return 'technology';
  return 'general';
}

export function localInterviewReply({ role, userAnswer: answer, resumeText }) {
  const group = groupFor(role);
  const questions = BANKS[group] || BANKS.general;
  if (!answer) {
    const projectLine = resumeText?.match(/(?:project|experience|volunteer|internship)[^\n]{0,150}/i)?.[0];
    const question = projectLine
      ? `I noticed this on your resume: “${projectLine.trim()}”. What did you personally contribute, and what changed because of your work?`
      : questions[Math.floor(Math.random() * questions.length)];
    return { score: null, feedback: '', nextQuestion: `Welcome! I’ll ask practice questions for ${role}. ${question}` };
  }
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const evidence = /\b(i|we|my|our|because|result|improv|increased|reduced|learned|customer|student|team|project)\b/i.test(answer);
  const concrete = /\d|%|minute|week|month|customer|student|team|project/i.test(answer);
  const score = Math.max(3, Math.min(10, 4 + Number(words >= 28) + Number(words >= 65) + Number(evidence) + Number(concrete)));
  const strength = words >= 28 ? 'You gave enough context to understand your approach.' : 'You answered directly and have a useful starting point.';
  const nextStep = concrete ? 'Make the outcome and your personal contribution even clearer.' : 'Add a specific example, the action you took, and a measurable result if you have one.';
  const nextQuestion = questions[Math.floor(Math.random() * questions.length)];
  return { score, feedback: `${strength} ${nextStep}`, nextQuestion: `Let’s build on that: ${nextQuestion}` };
}

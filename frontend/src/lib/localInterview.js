const BANKS = {
  technology: [
    'How would you select a data structure for a new feature and check that it handles important edge cases?',
    'How do you break down an unfamiliar technical problem before writing code?',
    'Tell me about a bug that took time to solve. How did you find the root cause?',
    'How do you make sure your work is reliable when requirements change?',
    'Describe a time you disagreed with a teammate about an implementation. How did you resolve it?',
    'What would you improve next in the project you are most proud of?',
    'How would you test a change that affects several parts of an application?'
  ],
  data: ['How would you check whether a dataset is complete and trustworthy?', 'Tell me about a time you turned data into a recommendation for someone else.', 'How do you explain an analysis when the results are uncertain?', 'Which metric would you choose to measure success for this role, and why?', 'Describe how you would investigate a sudden change in a key metric.', 'How would you present a finding that conflicts with a stakeholder’s expectation?'],
  sales: ['How do you learn what a potential customer actually needs?', 'Tell me about a time you handled a rejection and what you did next.', 'How would you prioritize several prospects who are at different stages?', 'How do you build trust with a customer who is unsure about a product?', 'What would you do if a customer asks for a feature the product does not have?', 'How would you prepare for an important customer conversation?'],
  marketing: ['How would you plan a campaign for a new audience with a limited budget?', 'Which signals would tell you a campaign is reaching the right people?', 'Tell me about a message or piece of content you improved. What changed?', 'How would you respond if engagement is high but conversions are low?', 'How do you keep a brand message consistent across channels?', 'How would you test two campaign ideas before scaling either one?'],
  people: ['How would you help a new team member feel welcome and productive?', 'Tell me about a sensitive conversation you handled with care.', 'How do you balance an employee request with a policy or business need?', 'How would you protect confidentiality while resolving a workplace concern?', 'Describe how you organize several hiring or people tasks at once.', 'How would you reduce bias in a hiring or people process?'],
  service: ['How would you help an upset customer feel heard and reach a solution?', 'Tell me about a time you turned a negative experience around.', 'What would you do if you do not know the answer to a customer question?', 'How do you balance speed with a thoughtful, accurate response?', 'How would you handle several urgent support requests at once?', 'How would you explain a policy a customer does not agree with?'],
  education: ['How would you explain a difficult idea to someone encountering it for the first time?', 'How do you adapt your approach when a learner is struggling?', 'Tell me about a time you helped someone make progress.', 'How do you know whether a lesson or learning activity worked?', 'How would you create an inclusive learning environment?', 'How would you respond when a learner repeatedly disengages?'],
  healthcare: ['How do you communicate clearly with a person who is worried or in pain?', 'What steps do you take to protect privacy and follow procedure?', 'Tell me about a time you stayed calm in a demanding situation.', 'How do you make sure important information is handed over accurately?', 'How would you respond when a patient or family member has a concern?', 'What would you do if you noticed a potential safety concern?'],
  operations: ['How would you find the cause of a process that keeps running late?', 'Tell me about a time you made a process simpler or more reliable.', 'How do you prioritize when several deadlines compete?', 'What would you do if a supplier or partner missed an important commitment?', 'How would you measure whether a process improvement worked?', 'How would you keep a team informed when a plan changes unexpectedly?'],
  finance: ['How do you check your work when accuracy matters?', 'How would you explain a financial result to someone without a finance background?', 'Tell me about a time you caught a discrepancy or risk.', 'How do you handle confidential financial information?', 'How would you investigate a result that differs from the forecast?', 'How would you communicate an error you found in a report?'],
  general: ['Tell me about a piece of work you are proud of and the part you personally handled.', 'Describe a time you had to learn something quickly to complete a task.', 'How do you organize your work when several priorities compete?', 'Tell me about a time you received feedback and used it to improve.', 'What would your teammates say you contribute to a team?', 'Describe a time you handled an unexpected change at work or school.']
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

const INTERVIEW_STOP_WORDS = new Set(['aria', 'welcome', 'role', 'focus', 'tell', 'please', 'think', 'about', 'that', 'this', 'would', 'could', 'should', 'your', 'you', 'how', 'what', 'when', 'where', 'which', 'with', 'from', 'have', 'does', 'did', 'are', 'the', 'and', 'for', 'into', 'after', 'before', 'then', 'next', 'question', 'build', 'lets', 'experience']);
const interviewQuestionTokens = (value) => String(value || '')
  .replace(/^welcome!?\s*i['’]ll ask practice questions for [^.]+\.\s*/i, '')
  .replace(/^let['’]s build on that:\s*/i, '')
  .toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').split(/\s+/)
  .filter((word) => word.length > 2 && !INTERVIEW_STOP_WORDS.has(word));

export function isRepeatedInterviewQuestion(candidate, previousQuestions = []) {
  const candidateTokens = interviewQuestionTokens(candidate);
  if (!candidateTokens.length) return false;
  return previousQuestions.some((previous) => {
    const previousTokens = interviewQuestionTokens(previous);
    if (!previousTokens.length) return false;
    const left = new Set(candidateTokens); const right = new Set(previousTokens);
    const shared = [...left].filter((token) => right.has(token)).length;
    const union = new Set([...left, ...right]).size;
    return (left.size === right.size && shared === union) || (shared >= 4 && (shared / union >= 0.58 || shared / Math.min(left.size, right.size) >= 0.8));
  });
}

export function localInterviewReply({ role, round, history = [], userAnswer: answer, resumeText }) {
  const group = groupFor(role);
  const questions = BANKS[group] || BANKS.general;
  const questionIndex = Math.min(history.filter((item) => item.sender === 'user').length, questions.length - 1);
  const roleOpeners = {
    technology: /react|frontend|front-end/i.test(role) ? 'How would you diagnose a React page that rerenders too often and feels slow?' : /backend|node|api/i.test(role) ? 'How would you design and validate an authenticated REST endpoint for creating a resource?' : /full.?stack|mern/i.test(role) ? 'How would you trace and debug a form submission from a React UI through an Express API into MongoDB?' : 'How would you choose a data structure for a feature and verify its important edge cases?',
    data: 'A key business metric suddenly drops by 20%. What data would you inspect first, and how would you check whether the drop is real?',
    sales: 'How would you qualify an inbound prospect before recommending a product or next step?',
    marketing: 'How would you choose a campaign goal and metric for a new audience?',
    people: 'How would you structure an interview to assess candidates fairly against a role’s requirements?',
    service: 'How would you troubleshoot a customer issue when your first suggested fix does not work?',
    education: 'How would you check during a lesson whether learners understand a new topic?',
    healthcare: 'How do you prioritize competing care needs while following the required procedures?',
    operations: 'How would you find the root cause of a recurring process delay?',
    finance: 'What checks would you perform to validate a monthly expense report before close?',
    general: `In a ${role} role, which day-to-day task requires the most judgment, and how would you approach it?`
  };
  const behaviorOpeners = {
    technology: 'Tell me about a time you had to explain a technical decision to someone with a different perspective. What did you do?',
    data: 'Tell me about a time you had to communicate an uncertain finding. How did you explain the limits and recommendation?',
    sales: 'Tell me about a time a customer rejected your recommendation. How did you respond?',
    marketing: 'Tell me about a time feedback changed your communication or campaign approach. What changed?',
    people: 'Tell me about a time you handled a sensitive conversation while respecting confidentiality.',
    service: 'Tell me about a time you helped someone who was frustrated. How did you move the conversation forward?',
    education: 'Tell me about a time you adapted your approach to help a learner who was struggling.',
    healthcare: 'Tell me about a time you had to stay calm and communicate clearly under pressure.',
    operations: 'Tell me about a time priorities changed suddenly. How did you keep the work moving?',
    finance: 'Tell me about a time you found an error or risk. How did you raise and resolve it?',
    general: 'Tell me about a time you received difficult feedback. How did you respond and what did you change?'
  };
  const situationalOpeners = {
    technology: 'A production API starts timing out just after a release. What steps would you take to investigate and reduce impact?',
    data: 'A stakeholder asks you to present a conclusion that the available data does not support. How would you respond?',
    sales: 'A prospect likes the product but says the price is too high. How would you handle the conversation?',
    marketing: 'A campaign is getting clicks but few conversions. What would you investigate and change first?',
    people: 'A hiring manager asks you to reject a candidate for a reason unrelated to the role. What would you do?',
    service: 'A customer is upset about a delay you cannot immediately resolve. What would you say and do next?',
    education: 'A learner is falling behind while the rest of the class is ready to move on. How would you respond?',
    healthcare: 'You notice a possible safety issue during a busy shift. What steps would you take?',
    operations: 'A supplier misses a deadline that could delay several teams. How would you respond and communicate?',
    finance: 'You find a discrepancy shortly before a reporting deadline. How would you verify and escalate it?',
    general: `Imagine a high-priority issue arises during a busy day as a ${role}. How would you assess it and decide what to do first?`
  };
  const questionForRound = (index) => {
    const base = questions[index % questions.length];
    const focus = String(round || '').toLowerCase();
    if (index === 0 && focus.includes('experience')) {
      const resumeLine = resumeText?.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 28 && /\b(project|experience|volunteer|internship)\b/i.test(line) && !/^(projects?|work experience|experience|internships?|volunteer experience)\s*:?[\s]*$/i.test(line));
      return resumeLine ? `Regarding “${resumeLine.trim()}”, what was your personal contribution and what outcome did it have?` : `Describe a project, work example, or practical experience that prepared you for a ${role} role. What was your contribution?`;
    }
    if (index === 0 && focus.includes('behavioral')) return behaviorOpeners[group] || behaviorOpeners.general;
    if (index === 0 && focus.includes('situational')) return situationalOpeners[group] || situationalOpeners.general;
    if (index === 0 && (focus.includes('technical dsa') || focus.includes('problem solving'))) return group === 'technology'
      ? `For a ${role} role, how would you approach a coding problem when a straightforward solution is too slow? Explain how you would reason about the complexity.`
      : roleOpeners[group] || roleOpeners.general;
    if (index === 0 && focus.includes('role skills')) return roleOpeners[group] || roleOpeners.general;
    if (focus.includes('behavioral')) return `${base} Please structure your example around the situation, your actions, and the outcome.`;
    if (focus.includes('situational')) return `Imagine this situation in a ${role} role: ${base}`;
    if (focus.includes('experience')) return `Thinking about your experience as a ${role}: ${base}`;
    if (focus.includes('system design') || focus.includes('core cs')) {
      const systemPrompts = group === 'technology'
        ? ['How would you design a reliable system for a growing number of users? Explain the main components and trade-offs.', 'How would you design a background job service that can retry failed work safely?', 'How would you design a notification system that supports email and in-app messages?', 'How would you design a URL shortener and prevent abuse?', 'How would you investigate and reduce latency in a frequently used API?']
        : ['How would you redesign a process that must serve ten times more people without losing quality?', 'What checks would you add to make this workflow reliable when a step fails?', 'How would you prioritize a large queue of requests with different levels of urgency?', 'How would you share status updates across a team handling a busy workflow?', 'Which measures would show whether this process is improving?'];
      return `For a ${role} role: ${systemPrompts[index % systemPrompts.length]}`;
    }
    return base;
  };
  const questionAsked = (question) => history.some((item) => item.sender === 'ai' && item.questionNumber && isRepeatedInterviewQuestion(question, [item.text]));
  const nextUniqueQuestion = () => {
    for (let offset = 0; offset < questions.length; offset += 1) {
      const candidate = questionForRound(questionIndex + offset);
      if (!questionAsked(candidate)) return candidate;
    }
    return `For a ${role} role, what is another important task or decision you have not discussed yet, and how would you approach it?`;
  };
  if (!answer) {
    const question = nextUniqueQuestion();
    return { score: null, feedback: '', nextQuestion: `Welcome! I’ll ask practice questions for ${role}. ${question}` };
  }
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const evidence = /\b(i|we|my|our|because|result|improv|increased|reduced|learned|customer|student|team|project)\b/i.test(answer);
  const concrete = /\d|%|minute|week|month|customer|student|team|project/i.test(answer);
  const score = Math.max(3, Math.min(10, 4 + Number(words >= 28) + Number(words >= 65) + Number(evidence) + Number(concrete)));
  const strength = words >= 28 ? 'You gave enough context to understand your approach.' : 'You answered directly and have a useful starting point.';
  const nextStep = concrete ? 'Make the outcome and your personal contribution even clearer.' : 'Add a specific example, the action you took, and a measurable result if you have one.';
  const nextQuestion = nextUniqueQuestion();
  return { score, feedback: `${strength} ${nextStep}`, nextQuestion: `Let’s build on that: ${nextQuestion}` };
}

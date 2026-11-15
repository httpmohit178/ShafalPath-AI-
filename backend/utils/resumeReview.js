const SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'MySQL', 'SQL', 'Python', 'Java', 'C++', 'C#', 'Go', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'REST APIs', 'GraphQL', 'HTML', 'CSS', 'Tailwind CSS', 'Testing', 'Jest', 'Cypress', 'Figma', 'Agile', 'Data analysis', 'Excel', 'Power BI', 'Tableau', 'Communication', 'Leadership'
];

function auditResume(text, targetRole = '') {
  const issues = [];
  const add = (issue, whyItHurts, fix) => issues.push({ issue, whyItHurts, fix });
  const source = String(text || '');
  const lower = source.toLowerCase();
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const addIfMissing = (pattern, issue, why, fix) => { if (!pattern.test(source)) add(issue, why, fix); };
  addIfMissing(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, 'No email address found', 'Recruiters and hiring teams need a reliable contact method.', 'Add a professional email address in the contact header.');
  addIfMissing(/(?:\+?\d[\d\s().-]{7,}\d)/, 'No phone number found', 'A phone number can make it easier for recruiters to reach you.', 'Add a current phone number with country code if you apply internationally.');
  addIfMissing(/linkedin\.com|github\.com|portfolio|personal website/i, 'No professional profile or portfolio link found', 'A relevant profile or portfolio can help reviewers verify and explore your work.', 'Add a LinkedIn profile, code repository, or portfolio URL when you have one.');
  addIfMissing(/\b(education|university|college|degree|bachelor|master|diploma)\b/i, 'Education section not detected', 'Education details are often important for entry-level roles.', 'Add qualification, institution, location, and completion date; omit details that do not apply.');
  addIfMissing(/\b(experience|employment|internship|work history|professional experience)\b/i, 'Experience section heading not detected', 'A clear section heading helps both people and resume parsing software find relevant experience.', 'Add an Experience section. If you are early in your career, include internships, volunteering, or relevant projects.');
  addIfMissing(/\b(projects?)\b/i, 'Projects section not detected', 'Projects can demonstrate practical skills when formal experience is limited.', 'Add one or two relevant projects with your contribution, tools, and outcome.');
  if (/\b(experience|internship|employment|worked at)\b/i.test(source) && !/\b(?:19|20)\d{2}\b/.test(source)) add('Work or internship dates not detected', 'Reviewers cannot place the experience in a timeline.', 'Add accurate month and year dates for each role.');
  addIfMissing(/\b(summary|profile|objective)\b/i, 'Professional summary not detected', 'A short introduction can quickly connect your evidence to the target role.', `Add a concise, factual summary tailored to ${targetRole || 'the target role'}.`);
  addIfMissing(/\b(skills|technical skills|core competencies)\b/i, 'Skills section heading not detected', 'A labeled skills section makes relevant qualifications easier to scan.', 'Add a concise Skills section containing only skills you can demonstrate.');
  if (!/\d+\s?%|\$\s?\d|\b\d+\s?(?:users|customers|requests|projects|hours|days|weeks|months|people|records)\b/i.test(source)) add('Impact evidence is difficult to measure', 'Results and scale are not clear from the resume text.', 'Where you have reliable evidence, state the result and scale. Never guess or manufacture metrics.');
  if (/\b(i|me|my|we|our)\b/i.test(source)) add('First-person pronouns found', 'Resume bullets are usually more direct without first-person phrasing.', 'Rewrite statements to begin with a clear action verb while keeping the same facts.');
  const duplicates = lines.filter((line, index) => lines.findIndex((other) => other.toLowerCase() === line.toLowerCase()) !== index);
  if (duplicates.length) add('Repeated lines detected', 'Duplicate content wastes space and may look like an editing error.', `Review and remove repeated line(s): ${[...new Set(duplicates)].slice(0, 3).join(' | ')}`);
  if (/\[[^\]]*(?:add|insert|your name|email|phone|company)[^\]]*\]|lorem ipsum|replace me/i.test(source)) add('Unfilled template placeholders found', 'Template text can make a resume look unfinished.', 'Replace every placeholder with accurate personal details or remove the placeholder.');
  if (lines.length > 1 && lines.filter((line) => line.length > 230).length > 2) add('Several lines are difficult to scan', 'Long paragraph-style lines can hide key contributions.', 'Break dense content into concise bullets, one outcome or responsibility per bullet.');
  if (!lower.includes(String(targetRole).toLowerCase()) && targetRole && !/\b(summary|profile|objective)\b/i.test(source)) add('Target role is not clearly stated', 'The role alignment may not be obvious during a quick review.', `Use the target title ${targetRole} in the heading or summary only if it accurately describes your goal.`);
  return issues;
}

function localResumeAnalysis(text, targetRole = 'Software Engineer') {
  const source = String(text || '').trim();
  const skills = SKILLS.filter((skill) => new RegExp(`(^|[^a-z0-9+#])${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9+#]|$)`, 'i').test(source));
  const roleSkills = /data|analyst|scient/i.test(targetRole) ? ['SQL', 'Data analysis', 'Excel', 'Python', 'Power BI'] : /design|ux|ui/i.test(targetRole) ? ['Figma', 'Communication', 'HTML', 'CSS'] : ['JavaScript', 'React', 'Node.js', 'SQL', 'Testing', 'Git'];
  const missingSkills = roleSkills.filter((skill) => !skills.includes(skill));
  const issues = auditResume(source, targetRole);
  const firstLine = source.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || '[Your name]';
  const email = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '[Add email]';
  const phone = source.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0] || '[Add phone]';
  const profile = source.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|github\.com)\/[^\s)]+/i)?.[0] || '[Add LinkedIn / portfolio if available]';
  // A local audit has no reliable way to rewrite a person's history. Keep the
  // supplied facts intact instead of fabricating a generic resume template.
  const correctedResume = source;
  const score = Math.max(20, Math.min(90, 88 - issues.length * 6 + Math.min(skills.length, 5) * 2));
  return {
    atsScore: score,
    summary: 'Local structured review: checks common ATS and recruiter issues. This is a practical checklist, not a hiring prediction.',
    skills,
    missingSkills,
    issues,
    strengths: [source.length > 400 ? 'The resume includes enough content for a useful review.' : 'Resume text was extracted and is ready for tailoring.', ...(skills.length ? [`Relevant skills detected: ${skills.slice(0, 6).join(', ')}.`] : [])],
    skillGaps: missingSkills.map((skill) => ({ skill, whyItMatters: `${skill} may be useful for ${targetRole}; confirm this against the specific job description.`, nextStep: `If this skill is relevant and you have experience with it, add evidence. Otherwise, consider a small practice project.` })),
    experienceInsights: ['Tailor the order of experience and projects to the requirements of each job.', 'Use concise bullets that explain your action, method, and outcome.'],
    improvements: ['Review contact details, section headings, dates, and links before exporting.', 'Add measurable outcomes only when you can verify the numbers.', 'Compare this draft with the specific job description and use its accurate terminology.'],
    suggestedProjects: [],
    correctedResume
  };
}

module.exports = { auditResume, localResumeAnalysis };

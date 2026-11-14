export function localMentorReply(message = '') {
  const q = String(message).toLowerCase();
  if (/resume|ats|cv/.test(q)) return 'Resume tip: tailor the top third to your target role, use clear section headings, and write bullets as action + method + result. Use only facts you can support.';
  if (/interview|behavior|star|tell me about yourself/.test(q)) return 'Use STAR for behavioral questions: Situation, Task, Action, Result. Keep the context brief, focus on what you did, and end with a concrete outcome or lesson. Aria can run a five-question practice round.';
  if (/dsa|algorithm|coding|leetcode|array|string/.test(q)) return 'For coding practice, explain a straightforward approach, test a small example, then improve it. State time and space complexity and check empty input, duplicates, and boundary cases.';
  if (/plan|today|first|start|roadmap/.test(q)) return 'Try a focused session: 30 minutes reviewing one target role, 45 minutes on one skill gap, 30 minutes solving a practice problem, then 15 minutes noting what to improve tomorrow.';
  if (/job|apply|career|offer/.test(q)) return 'Compare each role with evidence from your projects, tailor your resume, and track applications and follow-ups. I can also help with interview prep, DSA, or a study plan.';
  return 'I can help with resume and ATS tips, common interview questions, STAR answers, DSA practice, role preparation, or a daily study plan. Include your target role for more relevant guidance.';
}

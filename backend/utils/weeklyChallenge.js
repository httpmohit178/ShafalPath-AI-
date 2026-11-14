function weekKey(date = new Date()) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

function completeWeeklyChallenge(user, id, date = new Date()) {
  const key = weekKey(date);
  if (user.weeklyChallenges?.weekKey !== key) user.weeklyChallenges = { weekKey: key, completed: [] };
  if (user.weeklyChallenges.completed.includes(id)) return false;
  user.weeklyChallenges.completed.push(id);
  user.xp += 60;
  user.activityLog.unshift({ date: date.toISOString().slice(0, 10), title: `Weekly challenge completed: ${id}`, score: 60 });
  return true;
}

module.exports = { completeWeeklyChallenge };

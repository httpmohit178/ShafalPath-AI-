const dayKey = (value = new Date()) => new Date(value).toISOString().slice(0, 10);
const previousDay = (key) => {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return dayKey(date);
};

function recordDailyActivity(user, date = new Date()) {
  const today = dayKey(date);
  if (!user.streak) user.streak = { current: 0, best: 0, lastActiveDate: '' };
  if (user.streak.lastActiveDate === today) return false;
  user.streak.current = user.streak.lastActiveDate === previousDay(today) ? (user.streak.current || 0) + 1 : 1;
  user.streak.best = Math.max(user.streak.best || 0, user.streak.current);
  user.streak.lastActiveDate = today;
  return true;
}

module.exports = { recordDailyActivity };

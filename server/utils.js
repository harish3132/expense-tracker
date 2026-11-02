const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const currentMonth = () => new Date().toISOString().slice(0, 7);
const getMonth = (m) => (MONTH_RE.test(m || '') ? m : currentMonth());

// UTC start (inclusive) and end (exclusive) of a "YYYY-MM" month
const monthRange = (month) => {
  const [y, m] = month.split('-').map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
};

// the last n month keys ending at `month`, oldest first
const lastMonths = (month, n) => {
  const [y, m] = month.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - n + i, 1)).toISOString().slice(0, 7));
};

// turns errors in async route handlers into JSON responses
const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => {
    const bad = e.name === 'ValidationError' || e.name === 'CastError';
    res.status(bad ? 400 : 500).json({ message: e.message });
  });

module.exports = { MONTH_RE, getMonth, monthRange, lastMonths, wrap };

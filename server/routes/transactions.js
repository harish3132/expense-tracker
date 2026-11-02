const router = require('express').Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');
const { getMonth, monthRange, lastMonths, wrap } = require('../utils');

router.use(auth);

const r2 = (n) => Math.round(n * 100) / 100;

const clean = (b) => ({
  type: b.type,
  amount: Number(b.amount),
  category: String(b.category || '').trim(),
  description: String(b.description || '').trim(),
  date: b.date ? new Date(b.date) : new Date(),
});

const validate = (d) => {
  if (!['income', 'expense'].includes(d.type)) return 'Type must be income or expense';
  if (!(d.amount > 0)) return 'Amount must be greater than 0';
  if (!d.category) return 'Please choose a category';
  if (Number.isNaN(d.date.getTime())) return 'Please enter a valid date';
  return null;
};

// GET /api/transactions?type=&category=&search=&from=&to=&month=&limit=
router.get('/', wrap(async (req, res) => {
  const { type, category, search, from, to, month, limit } = req.query;
  const q = { user: req.userId };

  if (['income', 'expense'].includes(type)) q.type = type;
  if (category) q.category = category;
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ description: rx }, { category: rx }];
  }
  if (month) {
    const { start, end } = monthRange(getMonth(month));
    q.date = { $gte: start, $lt: end };
  } else if (from || to) {
    q.date = {};
    if (from) q.date.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setUTCDate(end.getUTCDate() + 1); // include the whole "to" day
      q.date.$lt = end;
    }
  }

  const items = await Transaction.find(q)
    .sort({ date: -1, createdAt: -1 })
    .limit(Math.max(0, parseInt(limit, 10) || 0))
    .lean();
  res.json(items);
}));

// GET /api/transactions/summary?month=YYYY-MM  (dashboard + reports)
router.get('/summary', wrap(async (req, res) => {
  const month = getMonth(req.query.month);
  const keys = lastMonths(month, 6);
  const uid = new mongoose.Types.ObjectId(req.userId);

  const [txs, totals, budget] = await Promise.all([
    Transaction.find({
      user: uid,
      date: { $gte: monthRange(keys[0]).start, $lt: monthRange(month).end },
    }).lean(),
    Transaction.aggregate([
      { $match: { user: uid } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Budget.effective(uid, month),
  ]);

  const trend = keys.map((m) => ({ month: m, income: 0, expense: 0 }));
  const cats = {};
  for (const t of txs) {
    const key = t.date.toISOString().slice(0, 7);
    const row = trend.find((r) => r.month === key);
    if (!row) continue;
    row[t.type] += t.amount;
    if (key === month && t.type === 'expense') cats[t.category] = (cats[t.category] || 0) + t.amount;
  }

  const cur = trend[trend.length - 1];
  const all = { income: 0, expense: 0 };
  totals.forEach((x) => { all[x._id] = x.total; });

  res.json({
    month,
    income: r2(cur.income),
    expense: r2(cur.expense),
    balance: r2(cur.income - cur.expense),
    overall: { income: r2(all.income), expense: r2(all.expense), balance: r2(all.income - all.expense) },
    byCategory: Object.entries(cats)
      .map(([category, total]) => ({ category, total: r2(total) }))
      .sort((a, b) => b.total - a.total),
    trend: trend.map((r) => ({ month: r.month, income: r2(r.income), expense: r2(r.expense) })),
    budget,
  });
}));

router.post('/', wrap(async (req, res) => {
  const data = clean(req.body);
  const err = validate(data);
  if (err) return res.status(400).json({ message: err });
  const tx = await Transaction.create({ ...data, user: req.userId });
  res.status(201).json(tx);
}));

router.put('/:id', wrap(async (req, res) => {
  const data = clean(req.body);
  const err = validate(data);
  if (err) return res.status(400).json({ message: err });
  const tx = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.userId }, data, { new: true });
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json(tx);
}));

router.delete('/:id', wrap(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json({ message: 'Deleted' });
}));

module.exports = router;

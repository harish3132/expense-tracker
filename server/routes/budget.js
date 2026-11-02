const router = require('express').Router();
const Budget = require('../models/Budget');
const auth = require('../middleware/auth');
const { MONTH_RE, getMonth, wrap } = require('../utils');

router.use(auth);

// GET /api/budget?month=YYYY-MM  ->  the limit that applies to that month
router.get('/', wrap(async (req, res) => {
  const month = getMonth(req.query.month);
  res.json({ month, amount: await Budget.effective(req.userId, month) });
}));

// PUT /api/budget  { month, amount }  ->  set the limit from that month onwards
router.put('/', wrap(async (req, res) => {
  const { month, amount } = req.body;
  if (!MONTH_RE.test(month || '') || !(Number(amount) >= 0)) {
    return res.status(400).json({ message: 'A valid month and amount are required' });
  }
  await Budget.findOneAndUpdate(
    { user: req.userId, month },
    { amount: Number(amount) },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ month, amount: Number(amount) });
}));

module.exports = router;

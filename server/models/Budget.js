const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // "YYYY-MM"
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, month: 1 }, { unique: true });

// the budget that applies to a month: the latest one set on or before it
budgetSchema.statics.effective = async function (user, month) {
  const b = await this.findOne({ user, month: { $lte: month } }).sort({ month: -1 }).lean();
  return b ? b.amount : 0;
};

module.exports = mongoose.model('Budget', budgetSchema);

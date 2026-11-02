import { useState } from 'react';
import api, { errMsg } from '../api.js';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, dateOnly, todayStr } from '../utils.js';

// add a new transaction, or edit one when `initial` is passed
export default function TransactionModal({ initial, defaultType = 'expense', onClose, onSaved }) {
  const editing = Boolean(initial?._id);
  const [form, setForm] = useState({
    type: initial?.type || defaultType,
    amount: initial?.amount ?? '',
    category: initial?.category || '',
    date: initial ? dateOnly(initial.date) : todayStr(),
    description: initial?.description || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await api.put(`/transactions/${initial._id}`, payload);
      else await api.post('/transactions', payload);
      onSaved();
    } catch (err) {
      setError(errMsg(err));
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="panel modal" onSubmit={submit}>
        <h3 style={{ marginBottom: 0 }}>{editing ? 'Edit transaction' : 'Add transaction'}</h3>

        <div className="toggle">
          {['expense', 'income'].map((t) => (
            <button
              type="button"
              key={t}
              className={form.type === t ? `on-${t}` : ''}
              onClick={() => setForm((f) => ({ ...f, type: t, category: '' }))}
            >
              {t === 'income' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>

        {error && <div className="alert" style={{ marginTop: 14, marginBottom: 0 }}>{error}</div>}

        <label>Amount (₹)</label>
        <input type="number" min="0.01" step="0.01" required autoFocus value={form.amount} onChange={(e) => set('amount', e.target.value)} />

        <label>Category</label>
        <select required value={form.category} onChange={(e) => set('category', e.target.value)}>
          <option value="">Choose a category</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <label>Date</label>
        <input type="date" required value={form.date} onChange={(e) => set('date', e.target.value)} />

        <label>Description (optional)</label>
        <input type="text" maxLength={120} value={form.description} onChange={(e) => set('description', e.target.value)} />

        <div className="row between" style={{ marginTop: 22 }}>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Save changes' : 'Save transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}

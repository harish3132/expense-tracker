import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import BudgetBar from '../components/BudgetBar.jsx';
import Ledger from '../components/Ledger.jsx';
import { currentMonth, money, monthLabel } from '../utils.js';

export default function Budget() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [amount, setAmount] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/transactions/summary', { params: { month } });
      setSummary(data);
      setAmount(data.budget || '');
      setError('');
    } catch (e) {
      setError(errMsg(e));
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaved('');
    setError('');
    try {
      await api.put('/budget', { month, amount: Number(amount) });
      setSaved(`Budget saved: ${money(amount)} a month, starting ${monthLabel(month)}.`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Budget</h2>
          <div className="muted">Set a monthly spending limit and watch it fill up</div>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <div className="panel">
        <h3>Monthly limit</h3>
        <p className="muted small">The limit you save applies to the chosen month and every month after it, until you change it.</p>
        <form onSubmit={save}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div style={{ width: 170 }}>
              <label style={{ marginTop: 0 }}>Starting month</label>
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  if (e.target.value) {
                    setMonth(e.target.value);
                    setSaved('');
                  }
                }}
              />
            </div>
            <div style={{ width: 200 }}>
              <label style={{ marginTop: 0 }}>Limit (₹)</label>
              <input type="number" min="0" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <button className="btn">Save budget</button>
          </div>
        </form>
        {saved && <div className="alert ok" style={{ margin: '16px 0 0' }}>{saved}</div>}
      </div>

      {summary && (
        <div className="panel">
          <h3>Spending in {monthLabel(month)}</h3>
          <Ledger
            small
            items={[
              { label: 'Budget', value: summary.budget ? money(summary.budget) : 'Not set' },
              { label: 'Spent', value: money(summary.expense), tone: 'expense' },
              {
                label: 'Left',
                value: summary.budget ? money(summary.budget - summary.expense) : '-',
                tone: summary.budget && summary.expense > summary.budget ? 'expense' : '',
              },
            ]}
          />
          <div style={{ marginTop: 18 }}>
            <BudgetBar spent={summary.expense} budget={summary.budget} />
          </div>
        </div>
      )}
    </>
  );
}

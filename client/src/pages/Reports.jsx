import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import BudgetBar from '../components/BudgetBar.jsx';
import Ledger from '../components/Ledger.jsx';
import { currentMonth, downloadCSV, fmtDate, money, monthLabel } from '../utils.js';

export default function Reports() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get('/transactions/summary', { params: { month } }),
      api.get('/transactions', { params: { month } }),
    ])
      .then(([s, t]) => {
        if (!active) return;
        setSummary(s.data);
        setItems(t.data);
        setError('');
      })
      .catch((e) => active && setError(errMsg(e)));
    return () => {
      active = false;
    };
  }, [month]);

  const top = items.filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount).slice(0, 5);
  const rate = summary && summary.income > 0 ? `${((summary.balance / summary.income) * 100).toFixed(1)}%` : '-';

  return (
    <>
      <div className="page-head no-print">
        <div>
          <h2>Reports</h2>
          <div className="muted">A summary of any month, ready to print or save</div>
        </div>
        <div className="row">
          <input
            type="month"
            aria-label="Month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            style={{ width: 160 }}
          />
          <button className="btn ghost" disabled={!items.length} onClick={() => downloadCSV(items, `report-${month}.csv`)}>
            Export CSV
          </button>
          <button className="btn" onClick={() => window.print()}>Print or save as PDF</button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      {!summary && !error && <p className="muted">Building your report...</p>}

      {summary && (
        <div className="panel">
          <h2>{monthLabel(summary.month)}</h2>
          <p className="muted small" style={{ marginBottom: 20 }}>
            Monthly report with {items.length} transactions, generated on {new Date().toLocaleDateString('en-IN')}.
          </p>

          <Ledger
            items={[
              { label: 'Total income', value: money(summary.income), tone: 'income' },
              { label: 'Total expenses', value: money(summary.expense), tone: 'expense' },
              { label: 'Net savings', value: money(summary.balance), tone: summary.balance < 0 ? 'expense' : '' },
              { label: 'Savings rate', value: rate },
            ]}
          />

          <h3 style={{ marginTop: 28 }}>Budget</h3>
          <BudgetBar spent={summary.expense} budget={summary.budget} />

          <h3 style={{ marginTop: 28 }}>Where the money went</h3>
          {summary.byCategory.length === 0 ? (
            <p className="muted">No expenses recorded this month.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="right">Spent</th>
                    <th style={{ width: '40%' }}>Share of expenses</th>
                    <th className="right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byCategory.map((c) => {
                    const pct = summary.expense ? (c.total / summary.expense) * 100 : 0;
                    return (
                      <tr key={c.category}>
                        <td>{c.category}</td>
                        <td className="right amount">{money(c.total)}</td>
                        <td>
                          <div className="meter" style={{ margin: 0 }}>
                            <div style={{ width: `${pct}%`, background: 'var(--moss)' }} />
                          </div>
                        </td>
                        <td className="right">{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h3 style={{ marginTop: 28 }}>Largest expenses</h3>
          {top.length === 0 ? (
            <p className="muted">No expenses recorded this month.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((t) => (
                    <tr key={t._id}>
                      <td>{fmtDate(t.date)}</td>
                      <td className="wrap">{t.description || '-'}</td>
                      <td><span className="chip">{t.category}</span></td>
                      <td className="right amount expense">{money(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

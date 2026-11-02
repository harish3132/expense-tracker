import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../api.js';
import BudgetBar from '../components/BudgetBar.jsx';
import Ledger from '../components/Ledger.jsx';
import TransactionModal from '../components/TransactionModal.jsx';
import { COLORS, currentMonth, fmtDate, money, monthLabel, monthShort } from '../utils.js';

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [modalType, setModalType] = useState(null); // 'income' | 'expense' | null
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        api.get('/transactions/summary', { params: { month } }),
        api.get('/transactions', { params: { limit: 5 } }),
      ]);
      setSummary(s.data);
      setRecent(r.data);
      setError('');
    } catch (e) {
      setError(errMsg(e));
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const trend = (summary?.trend || []).map((r) => ({ ...r, label: monthShort(r.month) }));

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <div className="muted">{monthLabel(month)}</div>
        </div>
        <div className="row">
          <input
            type="month"
            aria-label="Month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            style={{ width: 160 }}
          />
          <button className="btn" onClick={() => setModalType('income')}>Add income</button>
          <button className="btn danger" onClick={() => setModalType('expense')}>Add expense</button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}
      {!summary && !error && <p className="muted">Loading your data...</p>}

      {summary && (
        <>
          <div className="panel">
            <Ledger
              items={[
                { label: 'Income this month', value: money(summary.income), tone: 'income' },
                { label: 'Expenses this month', value: money(summary.expense), tone: 'expense' },
                { label: 'Balance this month', value: money(summary.balance), tone: summary.balance < 0 ? 'expense' : '' },
                { label: 'Overall balance', value: money(summary.overall.balance), tone: summary.overall.balance < 0 ? 'expense' : '' },
              ]}
            />
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Monthly budget</h3>
              <Link to="/budget">Set or change budget</Link>
            </div>
            <BudgetBar spent={summary.expense} budget={summary.budget} />
          </div>

          <div className="two">
            <div className="panel">
              <h3>Where the money went</h3>
              {summary.byCategory.length === 0 ? (
                <p className="muted">No expenses in {monthLabel(month)} yet. Use Add expense to log one.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={summary.byCategory} dataKey="total" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={2}>
                      {summary.byCategory.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => money(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="panel">
              <h3>Income and expenses, last 6 months</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#0b6e5f" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#c0392b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Recent transactions</h3>
              <Link to="/transactions">See all transactions</Link>
            </div>
            {recent.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>Nothing logged yet. Use Add income or Add expense to record your first transaction.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <tbody>
                    {recent.map((t) => (
                      <tr key={t._id}>
                        <td>{fmtDate(t.date)}</td>
                        <td className="wrap">{t.description || '-'}</td>
                        <td><span className="chip">{t.category}</span></td>
                        <td className={`right amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}{money(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {modalType && (
        <TransactionModal
          defaultType={modalType}
          onClose={() => setModalType(null)}
          onSaved={() => {
            setModalType(null);
            load();
          }}
        />
      )}
    </>
  );
}

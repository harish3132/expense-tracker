import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import Ledger from '../components/Ledger.jsx';
import TransactionModal from '../components/TransactionModal.jsx';
import { ALL_CATEGORIES, downloadCSV, fmtDate, money } from '../utils.js';

const EMPTY = { search: '', type: '', category: '', from: '', to: '' };

export default function Transactions() {
  const [filters, setFilters] = useState(EMPTY);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null = closed, {} = add, transaction = edit

  const load = useCallback(async () => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await api.get('/transactions', { params });
      setItems(data);
      setError('');
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(load, 300); // short delay while typing in search
    return () => clearTimeout(timer);
  }, [load]);

  const setF = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));
  const hasFilters = Object.values(filters).some(Boolean);
  const sum = (type) => items.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  const remove = async (id) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    try {
      await api.delete(`/transactions/${id}`);
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Transactions</h2>
          <div className="muted">Search, filter, edit and export your history</div>
        </div>
        <div className="row">
          <button className="btn ghost" disabled={!items.length} onClick={() => downloadCSV(items)}>Export CSV</button>
          <button className="btn" onClick={() => setModal({})}>Add transaction</button>
        </div>
      </div>

      <div className="panel">
        <div className="filters">
          <div>
            <label>Search</label>
            <input placeholder="Description or category" value={filters.search} onChange={setF('search')} />
          </div>
          <div>
            <label>Type</label>
            <select value={filters.type} onChange={setF('type')}>
              <option value="">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label>Category</label>
            <select value={filters.category} onChange={setF('category')}>
              <option value="">All</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label>From</label>
            <input type="date" value={filters.from} onChange={setF('from')} />
          </div>
          <div>
            <label>To</label>
            <input type="date" value={filters.to} onChange={setF('to')} />
          </div>
        </div>

        <div className="row between" style={{ marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Ledger
              small
              items={[
                { label: 'Showing', value: `${items.length} transactions` },
                { label: 'Income', value: money(sum('income')), tone: 'income' },
                { label: 'Expenses', value: money(sum('expense')), tone: 'expense' },
              ]}
            />
          </div>
          {hasFilters && <button className="btn ghost sm" onClick={() => setFilters(EMPTY)}>Clear filters</button>}
        </div>

        {error && <div className="alert">{error}</div>}

        {loading ? (
          <p className="muted">Loading your transactions...</p>
        ) : items.length === 0 ? (
          <p className="muted">{hasFilters ? 'No transactions match these filters. Try clearing them.' : 'No transactions yet. Use Add transaction to record your first one.'}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="right">Amount</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t._id}>
                    <td>{fmtDate(t.date)}</td>
                    <td className="wrap">{t.description || '-'}</td>
                    <td><span className="chip">{t.category}</span></td>
                    <td className={`right amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}{money(t.amount)}</td>
                    <td className="right">
                      <button className="btn ghost sm" onClick={() => setModal(t)}>Edit</button>{' '}
                      <button className="btn ghost sm danger-text" onClick={() => remove(t._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <TransactionModal
          initial={modal._id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </>
  );
}

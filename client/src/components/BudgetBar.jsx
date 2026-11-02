import { money } from '../utils.js';

export default function BudgetBar({ spent, budget }) {
  if (!budget) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        No budget set for this month. Set a monthly limit on the Budget page to track your spending.
      </p>
    );
  }

  const pct = (spent / budget) * 100;
  const color = pct >= 100 ? 'var(--brick)' : pct >= 80 ? 'var(--straw)' : 'var(--moss)';

  return (
    <div>
      <div className="meter">
        <div style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <div className="row between small">
        <span>{money(spent)} spent of {money(budget)} ({Math.round(pct)}%)</span>
        <b style={{ color }}>
          {spent > budget ? `${money(spent - budget)} over budget` : `${money(budget - spent)} left`}
        </b>
      </div>
    </div>
  );
}

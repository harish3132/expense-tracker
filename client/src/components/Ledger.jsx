// a row of labelled figures, used on the dashboard, history and reports
export default function Ledger({ items, small = false }) {
  return (
    <div className={small ? 'ledger small' : 'ledger'}>
      {items.map((it) => (
        <div className="cell" key={it.label}>
          <div className="cell-label">{it.label}</div>
          <div className={`figure ${it.tone || ''}`}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

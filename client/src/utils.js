export const INCOME_CATEGORIES = ['Salary', 'Business', 'Freelance', 'Investment', 'Gift', 'Other'];
export const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Health', 'Entertainment', 'Rent', 'Other'];
export const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];
export const COLORS = ['#0b6e5f', '#c0392b', '#d99a2b', '#3b6ea5', '#7b4fa0', '#d0668a', '#6a994e', '#8d6e63', '#607d8b'];

const pad = (n) => String(n).padStart(2, '0');

// today (local time) as YYYY-MM-DD, the format <input type="date"> expects
export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const currentMonth = () => todayStr().slice(0, 7);

// dates are stored at UTC midnight, so they are always read back in UTC
export const dateOnly = (d) => new Date(d).toISOString().slice(0, 10);
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const monthLabel = (m) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const monthShort = (m) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });

export const money = (n) => {
  const v = Number(n) || 0;
  return `${v < 0 ? '-' : ''}₹${Math.abs(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

// download a list of transactions as a CSV file (opens fine in Excel)
export function downloadCSV(rows, filename = 'transactions.csv') {
  const esc = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // stops spreadsheet formula injection
    return `"${s.replace(/"/g, '""')}"`;
  };
  const head = ['Date', 'Type', 'Category', 'Amount', 'Description'].map(esc).join(',');
  const lines = rows.map((t) => [dateOnly(t.date), t.type, t.category, t.amount, t.description].map(esc).join(','));
  const csv = '\uFEFF' + [head, ...lines].join('\r\n');

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

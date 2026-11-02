import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  ['/', 'Dashboard'],
  ['/transactions', 'Transactions'],
  ['/budget', 'Budget'],
  ['/reports', 'Reports'],
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="nav">
        <div className="brand">Expense Tracker</div>
        <nav>
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="user">
          <span className="muted small">{user.name}</span>
          <button className="btn ghost sm" onClick={handleLogout}>Log out</button>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}

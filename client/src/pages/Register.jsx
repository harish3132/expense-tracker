import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('The two passwords do not match');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="panel auth-card" onSubmit={submit}>
        <h2>Create account</h2>
        <p className="muted">It takes a minute. Your data stays private to your account.</p>
        {error && <div className="alert">{error}</div>}

        <label>Name</label>
        <input required value={form.name} onChange={set('name')} />

        <label>Email</label>
        <input type="email" required value={form.email} onChange={set('email')} />

        <label>Password (at least 6 characters)</label>
        <input type="password" required minLength={6} value={form.password} onChange={set('password')} />

        <label>Confirm password</label>
        <input type="password" required value={form.confirm} onChange={set('confirm')} />

        <button className="btn" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        <p className="muted small center" style={{ margin: '16px 0 0' }}>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}

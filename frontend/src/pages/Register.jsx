import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { register }            = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>SentimentIQ</h1>
        <p style={styles.subtitle}>Create your account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Name</label>
            <input style={styles.input} type="text" value={name}
              onChange={e => setName(e.target.value)}
              required placeholder="Your name" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required placeholder="you@example.com" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required placeholder="Min 8 characters" />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#0f172a'
  },
  card: {
    background: '#1e293b', borderRadius: 16, padding: 40,
    width: '100%', maxWidth: 400, boxShadow: '0 25px 50px rgba(0,0,0,0.4)'
  },
  title: { color: '#38bdf8', fontSize: 28, fontWeight: 700, margin: '0 0 4px' },
  subtitle: { color: '#94a3b8', margin: '0 0 28px' },
  error: {
    background: '#450a0a', color: '#fca5a5', padding: '10px 14px',
    borderRadius: 8, marginBottom: 16, fontSize: 14
  },
  field: { marginBottom: 16 },
  label: { display: 'block', color: '#cbd5e1', fontSize: 14, marginBottom: 6 },
  input: {
    width: '100%', background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, padding: '10px 12px', color: '#f1f5f9',
    fontSize: 15, outline: 'none', boxSizing: 'border-box'
  },
  btn: {
    width: '100%', background: '#38bdf8', color: '#0f172a',
    border: 'none', borderRadius: 8, padding: '12px 0',
    fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8
  },
  footer: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 20 },
  link: { color: '#38bdf8', textDecoration: 'none' }
};
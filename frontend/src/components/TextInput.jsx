import { useState } from 'react';
import api from '../api/axios';

export default function TextInput({ onResult }) {
  const [text, setText]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/analyse', { text });
      onResult(res.data);
      setText('');
    } catch {
      setError('Analysis failed. Is the ML service running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Analyse text</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          style={styles.textarea}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter any text to analyse its emotions and sentiment..."
          rows={4}
        />
        {error && <div style={styles.error}>{error}</div>}
        <div style={styles.footer}>
          <span style={styles.count}>{text.length} chars</span>
          <button style={styles.btn} type="submit" disabled={loading || !text.trim()}>
            {loading ? 'Analysing...' : 'Analyse'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  card: {
    background: '#1e293b', borderRadius: 12,
    padding: 24, marginBottom: 24
  },
  heading: { color: '#f1f5f9', fontSize: 18, fontWeight: 600, margin: '0 0 16px' },
  textarea: {
    width: '100%', background: '#0f172a', border: '1px solid #334155',
    borderRadius: 8, padding: 12, color: '#f1f5f9', fontSize: 15,
    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  error: {
    color: '#fca5a5', fontSize: 13, marginTop: 8
  },
  footer: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12
  },
  count: { color: '#475569', fontSize: 13 },
  btn: {
    background: '#38bdf8', color: '#0f172a', border: 'none',
    borderRadius: 8, padding: '10px 28px', fontSize: 14,
    fontWeight: 600, cursor: 'pointer'
  }
};
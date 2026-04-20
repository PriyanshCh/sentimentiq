import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>SentimentIQ</span>
      <div style={styles.right}>
        <span style={styles.name}>{user?.name}</span>
        <button style={styles.btn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px', height: 56, background: '#1e293b',
    borderBottom: '1px solid #334155'
  },
  brand: { color: '#38bdf8', fontWeight: 700, fontSize: 20 },
  right:  { display: 'flex', alignItems: 'center', gap: 16 },
  name:   { color: '#94a3b8', fontSize: 14 },
  btn: {
    background: 'transparent', border: '1px solid #475569',
    color: '#94a3b8', borderRadius: 6, padding: '6px 14px',
    fontSize: 13, cursor: 'pointer'
  }
};
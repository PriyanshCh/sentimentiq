import { useState } from 'react';
import { useSSE } from '../hooks/useSSE';
import Navbar from '../components/Navbar';
import TextInput from '../components/TextInput';
import EmotionChart from '../components/EmotionChart';
import SentimentTrend from '../components/SentimentTrend';
import AnalysisFeed from '../components/AnalysisFeed';

export default function Dashboard() {
  const { events, connected } = useSSE();
  const [latest, setLatest]   = useState(null);

  const handleResult = result => {
    setLatest(result);
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.body}>
        <div style={styles.header}>
          <h2 style={styles.title}>Dashboard</h2>
          <div style={styles.status}>
            <span style={{
              ...styles.dot,
              background: connected ? '#4ade80' : '#f87171'
            }}/>
            <span style={styles.statusText}>
              {connected ? 'Live' : 'Connecting...'}
            </span>
          </div>
        </div>

        <TextInput onResult={handleResult} />

        {latest && (
          <div style={styles.result}>
            <span style={styles.resultLabel}>Last result:</span>
            <span style={{
              fontWeight: 600,
              color: latest.sentiment === 'POSITIVE' ? '#4ade80' :
                     latest.sentiment === 'NEGATIVE' ? '#f87171' : '#94a3b8'
            }}>
              {latest.sentiment}
            </span>
            <span style={styles.resultConf}>
              {(latest.confidence * 100).toFixed(1)}% confidence
            </span>
          </div>
        )}

        <div style={styles.grid}>
          <div>
            <EmotionChart emotions={latest?.emotions} />
            <SentimentTrend events={events} />
          </div>
          <div>
            <AnalysisFeed events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a' },
  body: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24
  },
  title: { color: '#f1f5f9', fontSize: 24, fontWeight: 700, margin: 0 },
  status: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  statusText: { color: '#64748b', fontSize: 13 },
  result: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#1e293b', borderRadius: 8, padding: '10px 16px',
    marginBottom: 24, fontSize: 14
  },
  resultLabel: { color: '#64748b' },
  resultConf: { color: '#475569', fontSize: 13 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 24
  }
};
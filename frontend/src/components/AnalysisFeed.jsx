export default function AnalysisFeed({ events }) {
  if (!events || events.length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={styles.heading}>Live feed</h3>
        <p style={styles.empty}>No analyses yet. Submit some text above.</p>
      </div>
    );
  }

  const sentimentColor = s =>
    s === 'POSITIVE' ? '#4ade80' :
    s === 'NEGATIVE' ? '#f87171' : '#94a3b8';

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Live feed
        <span style={styles.badge}>{events.length}</span>
      </h3>
      <div style={styles.list}>
        {events.map((e, i) => (
          <div key={i} style={styles.item}>
            <div style={styles.itemTop}>
              <span style={{
                ...styles.sentiment,
                color: sentimentColor(e.sentiment)
              }}>
                {e.sentiment}
              </span>
              <span style={styles.confidence}>
                {(e.confidence * 100).toFixed(1)}% confidence
              </span>
            </div>
            <p style={styles.text}>{e.text}</p>
            {e.emotions && (
              <div style={styles.tags}>
                {[...e.emotions]
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3)
                  .map((em, j) => (
                    <span key={j} style={styles.tag}>
                      {em.emotion} {(em.score * 100).toFixed(0)}%
                    </span>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#1e293b', borderRadius: 12, padding: 24 },
  heading: {
    color: '#f1f5f9', fontSize: 16, fontWeight: 600,
    margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10
  },
  badge: {
    background: '#0f172a', color: '#38bdf8', borderRadius: 20,
    padding: '2px 10px', fontSize: 12
  },
  empty: { color: '#475569', fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  item: {
    background: '#0f172a', borderRadius: 8,
    padding: 14, border: '1px solid #1e293b'
  },
  itemTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6
  },
  sentiment: { fontSize: 13, fontWeight: 600 },
  confidence: { fontSize: 12, color: '#475569' },
  text: { color: '#cbd5e1', fontSize: 14, margin: '0 0 10px', lineHeight: 1.5 },
  tags: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  tag: {
    background: '#1e293b', color: '#818cf8', border: '1px solid #334155',
    borderRadius: 20, padding: '2px 10px', fontSize: 11
  }
};

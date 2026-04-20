import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

export default function EmotionChart({ emotions }) {
  if (!emotions || emotions.length === 0) return null;

  const top10 = [...emotions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(e => ({ name: e.emotion, score: parseFloat(e.score.toFixed(3)) }));

  const getColor = score => {
    if (score > 0.6) return '#38bdf8';
    if (score > 0.3) return '#818cf8';
    return '#475569';
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Top emotions</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top10} layout="vertical"
          margin={{ left: 16, right: 24, top: 8, bottom: 8 }}>
          <XAxis type="number" domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }}/>
          <YAxis type="category" dataKey="name" width={100}
            tick={{ fill: '#94a3b8', fontSize: 12 }}/>
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155',
              borderRadius: 8, color: '#f1f5f9' }}
            formatter={v => [v.toFixed(3), 'Score']}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]}>
            {top10.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  card: { background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 24 },
  heading: { color: '#f1f5f9', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }
};
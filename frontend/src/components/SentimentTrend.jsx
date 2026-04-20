import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function SentimentTrend({ events }) {
  if (!events || events.length === 0) return null;

  const data = [...events].reverse().map((e, i) => ({
    index: i + 1,
    score: e.sentiment === 'POSITIVE' ?  e.confidence :
           e.sentiment === 'NEGATIVE' ? -e.confidence : 0,
    sentiment: e.sentiment
  }));

  return (
    <div style={styles.card}>
      <h3 style={styles.heading}>Sentiment trend</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <XAxis dataKey="index" tick={{ fill: '#64748b', fontSize: 11 }}/>
          <YAxis domain={[-1, 1]} tick={{ fill: '#64748b', fontSize: 11 }}/>
          <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4"/>
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155',
              borderRadius: 8, color: '#f1f5f9' }}
            formatter={(v, _, props) => [
              props.payload.sentiment, 'Sentiment'
            ]}
          />
          <Line type="monotone" dataKey="score" stroke="#38bdf8"
            strokeWidth={2} dot={{ fill: '#38bdf8', r: 3 }}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  card: { background: '#1e293b', borderRadius: 12, padding: 24, marginBottom: 24 },
  heading: { color: '#f1f5f9', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }
};
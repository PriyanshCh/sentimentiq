import { useState, useEffect, useRef } from 'react';

export function useSSE() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = `/api/stream?token=${token}`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => setConnected(true);

    source.addEventListener('analysis', e => {
      const data = JSON.parse(e.data);
      setEvents(prev => [data, ...prev].slice(0, 50));
    });

    source.onerror = () => {
      setConnected(false);
      source.close();
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, []);

  const clearEvents = () => setEvents([]);

  return { events, connected, clearEvents };
}
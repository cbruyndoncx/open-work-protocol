import { useState, useEffect, useCallback } from 'react';
import WorkerStatus from './components/WorkerStatus';
import TaskMonitor from './components/TaskMonitor';
import AdminControls from './components/AdminControls';

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'dev-admin-token';

export default function App() {
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/v1/admin/state', {
        headers: { 'X-Admin-Token': ADMIN_TOKEN },
      });
      const data = await res.json();
      setState(data);
    } catch (error) {
      console.error('Failed to fetch state:', error);
      setError('Failed to fetch state');
    }
  }, []);

  useEffect(() => {
    // Try SSE first, fallback to polling if it fails
    const eventSource = new EventSource(`/v1/admin/state/stream?token=${encodeURIComponent(ADMIN_TOKEN)}`);
    
    eventSource.onopen = () => {
      console.log('SSE connection established');
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setState(data);
        setError(null);
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      eventSource.close();
      setError('Real-time connection lost, using polling fallback');
      
      // Fallback to polling
      fetchState();
      const interval = setInterval(fetchState, 5000);
      return () => clearInterval(interval);
    };

    return () => {
      eventSource.close();
    };
  }, [fetchState]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>OWP Pool Dashboard</h1>
      {error && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffc107',
          borderRadius: '4px'
        }}>
          ⚠️ {error}
        </div>
      )}
      {state && (
        <>
          <WorkerStatus workers={state.workers_online} />
          <TaskMonitor queued={state.tasks_queued} inProgress={state.tasks_in_progress} />
          <AdminControls repos={state.repositories} adminToken={ADMIN_TOKEN} onUpdate={fetchState} />
        </>
      )}
    </div>
  );
}

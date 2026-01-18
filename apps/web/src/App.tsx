import { useState, useEffect, useCallback } from 'react';
import WorkerStatus from './components/WorkerStatus';
import TaskMonitor from './components/TaskMonitor';
import AdminControls from './components/AdminControls';

const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || 'dev-admin-token';

export default function App() {
  const [state, setState] = useState<any>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/v1/admin/state', {
        headers: { 'X-Admin-Token': ADMIN_TOKEN },
      });
      const data = await res.json();
      setState(data);
    } catch (error) {
      console.error('Failed to fetch state:', error);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [fetchState]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>OWP Pool Dashboard</h1>
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

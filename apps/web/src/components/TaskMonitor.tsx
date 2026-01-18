export default function TaskMonitor({ queued, inProgress }: { queued: number; inProgress: number }) {
  return (
    <div className="card">
      <h2>Task Monitor</h2>
      <p>Queued: <strong>{queued}</strong></p>
      <p>In Progress: <strong>{inProgress}</strong></p>
    </div>
  );
}

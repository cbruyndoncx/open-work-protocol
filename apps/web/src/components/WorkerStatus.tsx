export default function WorkerStatus({ workers }: { workers: number }) {
  return (
    <div className="card">
      <h2>Worker Status</h2>
      <p>Online Workers: <strong>{workers}</strong></p>
    </div>
  );
}

import { useState } from 'react';

interface AdminControlsProps {
  repos: any[];
  adminToken: string;
  onUpdate: () => Promise<void>;
}

export default function AdminControls({ repos, adminToken, onUpdate }: AdminControlsProps) {
  const [repoName, setRepoName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskRepo, setTaskRepo] = useState('');

  const handleCreateRepo = async () => {
    if (!repoName) return;
    try {
      await fetch('/v1/admin/repos', {
        method: 'POST',
        headers: {
          'X-Admin-Token': adminToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repo: repoName, max_open_prs: 3 }),
      });
      setRepoName('');
      await onUpdate();
    } catch (error) {
      console.error('Failed to create repo:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle || !taskRepo) return;
    try {
      await fetch('/v1/admin/tasks', {
        method: 'POST',
        headers: {
          'X-Admin-Token': adminToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo: taskRepo,
          title: taskTitle,
          required_skills: ['python'],
          estimate_points: 2,
        }),
      });
      setTaskTitle('');
      setTaskRepo('');
      await onUpdate();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div className="card">
      <h2>Admin Controls</h2>
      
      <div>
        <h3>Create Repository</h3>
        <input
          type="text"
          placeholder="Repository name"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
        />
        <button onClick={handleCreateRepo}>Create Repo</button>
      </div>

      <div>
        <h3>Create Task</h3>
        <select value={taskRepo} onChange={(e) => setTaskRepo(e.target.value)}>
          <option value="">Select Repository</option>
          {repos?.map((r) => (
            <option key={r.repo} value={r.repo}>
              {r.repo}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Task title"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <button onClick={handleCreateTask}>Create Task</button>
      </div>

      <div>
        <h3>Repositories</h3>
        {repos?.map((r) => (
          <div key={r.repo}>
            <strong>{r.repo}</strong>: {r.current_open_prs}/{r.max_open_prs} PRs
          </div>
        ))}
      </div>
    </div>
  );
}

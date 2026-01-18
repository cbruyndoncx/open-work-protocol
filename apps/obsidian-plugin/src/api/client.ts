export class OWPClient {
  constructor(private serverUrl: string, private token?: string, private adminToken?: string) {}

  async registerWorker(name: string, skills: string[], capacityPoints: number) {
    const res = await fetch(`${this.serverUrl}/v1/workers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, skills, capacity_points: capacityPoints }),
    });
    return res.json();
  }

  async fetchWork() {
    const res = await fetch(`${this.serverUrl}/v1/work`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    return res.json();
  }

  async updateTaskStatus(taskId: string, status: string, message?: string, prUrl?: string) {
    const res = await fetch(`${this.serverUrl}/v1/tasks/${taskId}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, message, pr_url: prUrl }),
    });
    return res.json();
  }

  async createRepo(repo: string, maxOpenPrs: number) {
    const res = await fetch(`${this.serverUrl}/v1/admin/repos`, {
      method: 'POST',
      headers: {
        'X-Admin-Token': this.adminToken || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ repo, max_open_prs: maxOpenPrs }),
    });
    return res.json();
  }

  async createTask(repo: string, title: string, requiredSkills: string[], estimatePoints: number) {
    const res = await fetch(`${this.serverUrl}/v1/admin/tasks`, {
      method: 'POST',
      headers: {
        'X-Admin-Token': this.adminToken || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repo,
        title,
        required_skills: requiredSkills,
        estimate_points: estimatePoints,
      }),
    });
    return res.json();
  }

  async getSystemState() {
    const res = await fetch(`${this.serverUrl}/v1/admin/state`, {
      headers: { 'X-Admin-Token': this.adminToken || '' },
    });
    return res.json();
  }
}

export class AdminView {
  async createRepo(client: any, repo: string, maxOpenPrs: number) {
    try {
      const result = await client.createRepo(repo, maxOpenPrs);
      if (result.ok) {
        return { success: true, repo: result.repo };
      }
      return { success: false, error: result.message };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async createTask(client: any, repo: string, title: string, skills: string[], points: number) {
    try {
      const result = await client.createTask(repo, title, skills, points);
      if (result.ok) {
        return { success: true, taskId: result.task_id };
      }
      return { success: false, error: result.message };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getState(client: any) {
    try {
      const result = await client.getSystemState();
      return { success: true, state: result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export class TaskView {
  async updateStatus(client: any, taskId: string, status: string, message?: string, prUrl?: string) {
    try {
      const result = await client.updateTaskStatus(taskId, status, message, prUrl);
      if (result.ok) {
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export class WorkerView {
  async registerWorker(client: any, name: string, skills: string[], capacity: number) {
    try {
      const result = await client.registerWorker(name, skills, capacity);
      if (result.worker_id) {
        return { success: true, workerId: result.worker_id, token: result.token };
      }
      return { success: false, error: result.message };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async fetchWork(client: any) {
    try {
      const result = await client.fetchWork();
      if (result.leases) {
        return { success: true, leases: result.leases };
      }
      return { success: false, error: result.message };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

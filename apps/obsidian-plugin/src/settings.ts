export interface OWPSettings {
  serverUrl: string;
  workerToken: string;
  adminToken: string;
  workerId: string;
  workerName: string;
  skills: string[];
}

export const DEFAULT_SETTINGS: OWPSettings = {
  serverUrl: 'http://localhost:8787',
  workerToken: '',
  adminToken: '',
  workerId: '',
  workerName: '',
  skills: [],
};

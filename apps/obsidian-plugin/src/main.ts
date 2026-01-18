import { Plugin, PluginSettingTab, App, Setting, Notice } from 'obsidian';
import { OWPSettings, DEFAULT_SETTINGS } from './settings';

export default class OWPPoolPlugin extends Plugin {
  settings: OWPSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'owp-register-worker',
      name: 'Register as Worker',
      callback: () => this.registerWorker(),
    });

    this.addCommand({
      id: 'owp-fetch-work',
      name: 'Fetch Available Work',
      callback: () => this.fetchWork(),
    });

    this.addCommand({
      id: 'owp-update-task',
      name: 'Update Task Status',
      callback: () => this.updateTaskStatus(),
    });

    this.addCommand({
      id: 'owp-create-repo',
      name: 'Create Repository (Admin)',
      callback: () => this.createRepo(),
    });

    this.addCommand({
      id: 'owp-create-task',
      name: 'Create Task (Admin)',
      callback: () => this.createTask(),
    });

    this.addSettingTab(new OWPSettingTab(this.app, this));
  }

  async registerWorker() {
    new Notice('Worker registration - open settings to configure');
  }

  async fetchWork() {
    new Notice('Fetching work...');
  }

  async updateTaskStatus() {
    new Notice('Update task status - open settings to configure');
  }

  async createRepo() {
    new Notice('Create repository - admin only');
  }

  async createTask() {
    new Notice('Create task - admin only');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class OWPSettingTab extends PluginSettingTab {
  plugin: OWPPoolPlugin;

  constructor(app: App, plugin: OWPPoolPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Server URL')
      .setDesc('OWP Pool server URL')
      .addText((text: any) => text
        .setPlaceholder('http://localhost:8787')
        .setValue(this.plugin.settings.serverUrl)
        .onChange(async (value: string) => {
          this.plugin.settings.serverUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Worker Token')
      .setDesc('Your worker authentication token')
      .addText((text: any) => text
        .setPlaceholder('paste token here')
        .setValue(this.plugin.settings.workerToken)
        .onChange(async (value: string) => {
          this.plugin.settings.workerToken = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Admin Token')
      .setDesc('Admin authentication token (for admin operations)')
      .addText((text: any) => text
        .setPlaceholder('paste admin token here')
        .setValue(this.plugin.settings.adminToken)
        .onChange(async (value: string) => {
          this.plugin.settings.adminToken = value;
          await this.plugin.saveSettings();
        }));
  }
}

// main.js

import dotenv from 'dotenv';
dotenv.config();

import { GitHubService } from './services/gitServices/GitHubService.js';
import { NotionService } from './services/noteServices/NotionService.js';
import { QwenService } from './services/aiModelServices/QwenService.js';
import { SyncController } from './controllers/SyncController.js';
import { loadConfig } from './config/config.js';

async function main() {
  try {
    const config = loadConfig();

    const gitService = new GitHubService(config);
    await gitService.connect();

    const notionService = new NotionService(config);
    await notionService.connect();

    const aiModelService = new QwenService(config);
    await aiModelService.connect();

    const services = {
      gitService,
      noteService: notionService,
      aiModelService,
      config,
    };

    const syncController = new SyncController(services);
    await syncController.syncRepository();

    console.log('同步完成！');
  } catch (error) {
    console.error('同步过程中发生未捕获的错误：', error);
    process.exit(1);
  }
}

main();

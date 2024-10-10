
// main.js

import { GitHubService } from './services/gitServices/GitHubService.js';
import { NotionService } from './services/noteServices/NotionService.js';
import { QwenService } from './services/aiModelServices/QwenService.js';
import { SyncController } from './controllers/SyncController.js';
import { loadConfig } from './config/config.js';

async function main() {
  const config = loadConfig();

  const gitService = new GitHubService(config);
  await gitService.connect();

  const noteService = new NotionService(config);
  await noteService.connect();

  const aiModelService = new QwenService(config);
  await aiModelService.connect();

  const services = {
    gitService,
    noteService,
    aiModelService,
    config,
  };

  const syncController = new SyncController(services);
  await syncController.syncRepository();
}

main();



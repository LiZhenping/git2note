/**
 * @file main.js
 * @description 主程序入口，负责初始化各个服务并启动同步过程
 * @author lizhenping
 * @date 2024-10-11
 */

import dotenv from 'dotenv';
import { GitHubService } from './services/gitServices/GitHubService.js';
import { NotionService } from './services/noteServices/NotionService.js';
import { QwenService } from './services/aiModelServices/QwenService.js';
import { SyncController } from './controllers/SyncController.js';
import { loadConfig } from './config/config.js';

/**
 * main 模块是程序的入口点。它负责：
 * 1. 加载环境变量
 * 2. 初始化 GitHub、Notion 和 AI 模型服务
 * 3. 创建同步控制器并执行同步过程
 * 4. 处理任何可能发生的错误
 */

dotenv.config();

/**
 * 主函数，用于初始化服务并启动同步过程
 */
async function main() {
  try {
    // 加载配置
    const config = loadConfig();

    // 初始化 GitHub 服务
    const gitService = new GitHubService(config);
    await gitService.connect();

    // 初始化 Notion 服务
    const notionService = new NotionService(config);
    await notionService.connect();

    // 初始化 AI 模型服务
    const aiModelService = new QwenService(config);
    await aiModelService.connect();

    // 整合所有服务
    const services = {
      gitService,
      noteService: notionService,
      aiModelService,
      config,
    };

    // 创建并执行同步控制器
    const syncController = new SyncController(services);
    await syncController.syncRepository();

    console.log('同步完成！');
  } catch (error) {
    console.error('同步过程中发生未捕获的错误：', error);
    process.exit(1);
  }
}

// 执行主函数
main();
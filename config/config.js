/**
 * @file config.js
 * @description 配置加载模块，负责从环境变量中读取并返回应用配置
 * @author lizhenping
 * @date 2024-10-11
 */

import dotenv from 'dotenv';

/**
 * config 模块负责加载和管理应用的配置。
 * 它从 .env 文件和环境变量中读取配置，并提供一个统一的配置对象。
 * 这个模块集中了所有的配置管理，使得配置的修改和维护更加容易。
 */

/**
 * 加载配置
 * @returns {Object} 包含所有配置项的对象
 */
export function loadConfig() {
  // 加载 .env 文件中的环境变量
  dotenv.config();

  return {
    // GitHub 相关配置
    githubToken: process.env.GITHUB_TOKEN,
    githubRepo: {
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
    },

    // Notion 相关配置
    notionToken: process.env.NOTION_TOKEN,
    notionRootPageId: process.env.NOTION_ROOT_PAGE_ID,

    // AI 模型相关配置
    aiModelApiKey: process.env.DASHSCOPE_API_KEY,
    prompt: process.env.PROMPT,

    // 允许同步的文件扩展名
    allowedExtensions: ['js', 'ts', 'py', 'sh'], // 根据需要添加其他扩展名
  };
}
// src/config/config.js

import dotenv from 'dotenv';

export function loadConfig() {
  dotenv.config();

  return {
    githubToken: process.env.GITHUB_TOKEN,
    notionToken: process.env.NOTION_TOKEN,
    notionRootPageId: process.env.NOTION_ROOT_PAGE_ID,
    aiModelApiKey: process.env.DASHSCOPE_API_KEY,
    githubRepo: {
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
    },
    allowedExtensions: ['js', 'ts', 'py', 'sh'], // 根据需要添加其他扩展名
  };
}
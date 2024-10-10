
// src/services/gitServices/GitHubService.js

import { IGitService } from '../../interfaces/IGitService.js';
import { Octokit } from '@octokit/rest';

export class GitHubService extends IGitService {
  constructor(config) {
    super();
    this.config = config;
    this.octokit = null;
    this.owner = config.githubRepo.owner;
    this.repo = config.githubRepo.repo;
  }

  async connect() {
    if (!this.config.githubToken) {
      console.error('错误：GITHUB_TOKEN 未加载。请检查环境变量设置。');
      process.exit(1);
    }

    this.octokit = new Octokit({ auth: this.config.githubToken });
  }

  async getRepositoryContents(path = '') {
    const response = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
    });

    // 如果路径是文件，返回数组以保持一致性
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return [response.data];
    }
  }

  async getFileContent(filePath) {
    const response = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path: filePath,
    });

    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    return content;
  }

  // 检查目录中是否包含指定类型的文件
  async hasAllowedFiles(dirPath, allowedExtensions) {
    const contents = await this.getRepositoryContents(dirPath);

    for (const item of contents) {
      if (item.type === 'file') {
        const fileName = item.name;
        const extension = fileName.split('.').pop().toLowerCase();
        if (allowedExtensions.includes(extension)) {
          return true; // 找到指定类型的文件
        }
      } else if (item.type === 'dir') {
        const hasFiles = await this.hasAllowedFiles(item.path, allowedExtensions);
        if (hasFiles) {
          return true; // 子文件夹中找到指定类型的文件
        }
      }
    }
    return false; // 未找到指定类型的文件
  }
}

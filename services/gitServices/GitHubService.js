/**
 * @file GitHubServiceOptimized.js
 * @description 定义了一个用于与 GitHub API 交互的服务类 GitHubService，继承自 IGitService 接口
 * @author lizhenping
 * @date 2024-10-11
 */

import { IGitService } from '../../interfaces/IGitService.js';
import { Octokit } from '@octokit/rest';

/**
 * GitHubService 这个文件定义了一个用于与 GitHub API 交互的服务类 GitHubService，
 * 继承自 IGitService 接口。它提供了连接到 GitHub、获取仓库内容、
 * 读取文件内容，以及检查目录中是否包含指定类型文件的方法。
 * @extends IGitService
 */
export class GitHubService extends IGitService {
  /**
   * 构造函数，初始化 GitHubService 实例
   * @param {Object} config - 配置信息，包括 GitHub Token 和仓库信息
   */
  constructor(config) {
    super();
    this.config = config;
    this.octokit = null;
    this.owner = this.config.githubRepo.owner;
    this.repo = this.config.githubRepo.repo;
  }

  /**
   * 连接到 GitHub API，初始化 Octokit 实例
   */
  async connect() {
    if (!this.config.githubToken) {
      console.error('错误：未提供 GITHUB_TOKEN。请检查环境变量设置。');
      process.exit(1);
    }

    this.octokit = new Octokit({ auth: this.config.githubToken });
    console.log('已成功连接到 GitHub API');
  }

  /**
   * 获取指定路径下的仓库内容
   * @param {string} [path=''] - 仓库中的路径，默认为根目录
   * @returns {Promise<Array>} 返回路径下的内容数组
   */
  async getRepositoryContents(path = '') {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });

      // 始终返回数组，以便于一致性处理
      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      console.error(`获取仓库内容时出错（路径：${path}）：${error.message}`);
      return [];
    }
  }

  /**
   * 获取指定文件的内容
   * @param {string} filePath - 文件在仓库中的路径
   * @returns {Promise<string>} 返回文件内容的字符串形式
   */
  async getFileContent(filePath) {
    try {
      const response = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
      });

      if (response.data && response.data.content) {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return content;
      } else {
        console.warn(`文件内容为空或无法解码（路径：${filePath}）`);
        return '';
      }
    } catch (error) {
      console.error(`获取文件内容时出错（路径：${filePath}）：${error.message}`);
      return '';
    }
  }

  /**
   * 检查指定目录中是否包含允许的文件类型
   * @param {string} dirPath - 目录在仓库中的路径
   * @param {Array<string>} allowedExtensions - 允许的文件扩展名数组
   * @returns {Promise<boolean>} 如果找到匹配的文件类型，返回 true；否则返回 false
   */
  async hasAllowedFiles(dirPath, allowedExtensions) {
    try {
      const contents = await this.getRepositoryContents(dirPath);

      for (const item of contents) {
        if (item.type === 'file') {
          const extension = item.name.split('.').pop().toLowerCase();
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
    } catch (error) {
      console.error(`检查目录中是否包含指定类型的文件时出错（路径：${dirPath}）：${error.message}`);
      return false;
    }
  }
}
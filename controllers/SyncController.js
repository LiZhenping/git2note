/**
 * @file SyncController.js
 * @description 定义 SyncController 类，用于同步 Git 仓库内容到 Notion
 * @author lizhenping
 * @date 2024-10-11
 */
/**
 * 同步控制器类同步操作整个流程是：
 * 1. 获取仓库根目录内容
 * 2. 获取 Notion 的根页面 ID
 * 3. 遍历仓库内容并创建或更新 Notion 页面
 */
import { mapExtensionToLanguage } from '../utils/utils.js';


export class SyncController {
  /**
   * 构造函数
   * @param {Object} services - 包含各种服务的对象
   */
  constructor(services) {
    this.services = services;
    this.allowedExtensions = services.config.allowedExtensions;
    this.logger = services.logger || console; // 使用提供的 logger 或默认使用 console
  }

  /**
   * 同步 Git 仓库内容到 Notion
   * @returns {Promise<void>}
   */
  async syncRepository() {
    const { gitService, noteService } = this.services;

    try {
      // 获取仓库根目录内容
      const repositoryContents = await gitService.getRepositoryContents();
      this.logger.info('获取到仓库根目录内容');

      // 获取 Notion 的根页面 ID
      const notionRootPageId = noteService.config.notionRootPageId;

      // 遍历仓库内容并创建或更新 Notion 页面
      for (const item of repositoryContents) {
        await this.processRepositoryItem(item, notionRootPageId);
      }

      this.logger.info('仓库同步完成');
    } catch (error) {
      this.logger.error(`同步仓库时发生错误: ${error.message}`);
      throw error;
    }
  }

  /**
   * 处理仓库中的每一项（文件或文件夹）
   * @param {Object} item - 仓库项
   * @param {string} parentPageId - 父页面 ID
   * @returns {Promise<void>}
   */
  async processRepositoryItem(item, parentPageId) {
    const { gitService, noteService, aiModelService } = this.services;
    const itemName = item.name;

    try {
      if (item.type === 'dir') {
        await this.processDirectory(item, parentPageId);
      } else if (item.type === 'file') {
        await this.processFile(item, parentPageId);
      }
    } catch (error) {
      this.logger.error(`处理 ${item.type} "${itemName}" 时发生错误: ${error.message}`);
    }
  }

  /**
   * 处理目录
   * @param {Object} item - 目录项
   * @param {string} parentPageId - 父页面 ID
   * @returns {Promise<void>}
   */
  async processDirectory(item, parentPageId) {
    const { gitService, noteService } = this.services;
    const itemName = item.name;

    // 检查是否包含允许的文件类型
    const hasAllowedFiles = await gitService.hasAllowedFiles(item.path, this.allowedExtensions);
    if (!hasAllowedFiles) {
      this.logger.info(`跳过文件夹 ${itemName}，因为其中不包含指定类型的文件`);
      return;
    }

    // 创建或更新文件夹对应的 Notion 页面
    const folderPage = await noteService.createOrUpdatePage(itemName, parentPageId);
    this.logger.info(`已创建或更新 Notion 页面：${itemName} (ID: ${folderPage.id})`);

    // 获取并处理文件夹中的子项
    const children = await gitService.getRepositoryContents(item.path);
    for (const child of children) {
      await this.processRepositoryItem(child, folderPage.id);
    }
  }

  /**
   * 处理文件
   * @param {Object} item - 文件项
   * @param {string} parentPageId - 父页面 ID
   * @returns {Promise<void>}
   */
  async processFile(item, parentPageId) {
    const { gitService, noteService, aiModelService } = this.services;
    const fileName = item.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

    // 仅处理允许的文件类型
    if (!this.allowedExtensions.includes(fileExtension)) {
      this.logger.info(`跳过非指定类型文件：${fileName}`);
      return;
    }

    this.logger.info(`处理指定类型文件：${fileName}`);

    // 获取文件内容
    const fileContent = await gitService.getFileContent(item.path);
    this.logger.info(`获取文件内容：${item.path} (长度: ${fileContent.length} 字符)`);

    // 使用 AI 模型服务生成 Wiki 注释
    const wikiComments = await aiModelService.generateWikiComment(fileContent);
    this.logger.info(`生成 Wiki 注释：${wikiComments.length} 块`);

    // 根据文件扩展名生成语言映射
    const programmingLanguage = mapExtensionToLanguage(fileExtension);

    // 创建或更新文件对应的 Notion 页面
    const filePage = await noteService.createOrUpdatePage(fileName, parentPageId);
    this.logger.info(`已创建或更新 Notion 页面：${fileName} (ID: ${filePage.id})`);

    // 更新 Notion 页面内容
    await noteService.updatePageContent(filePage.id, wikiComments, fileContent, programmingLanguage);
    this.logger.info(`已更新页面内容：${filePage.id}`);
  }
}
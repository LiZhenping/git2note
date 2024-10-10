// controllers/SyncController.js

import { mapExtensionToLanguage } from '../utils/utils.js';

export class SyncController {
  constructor(services) {
    this.services = services;
    this.allowedExtensions = services.config.allowedExtensions;
  }

  async syncRepository() {
    const { gitService, noteService } = this.services;

    // 获取仓库的根目录内容
    const repoContents = await gitService.getRepositoryContents();

    // 获取配置的 Notion 父页面 ID
    const rootPageId = noteService.config.notionRootPageId;

    for (const item of repoContents) {
      await this.createOrUpdatePage(item, rootPageId);
    }
  }

  async createOrUpdatePage(item, parentPageId) {
    const { gitService, noteService, aiModelService } = this.services;
    const itemName = item.name;

    if (item.type === 'dir') {
      // 检查文件夹中是否包含指定类型的文件
      const containsAllowedFiles = await gitService.hasAllowedFiles(item.path, this.allowedExtensions);
      if (!containsAllowedFiles) {
        console.log(`跳过文件夹 ${itemName}，因为其中不包含指定类型的文件`);
        return;
      }

      // 创建或更新对应的页面
      const page = await noteService.createOrUpdatePage(itemName, parentPageId);
      console.log(`已创建或更新 Notion 页面：${itemName} (ID: ${page.id})`);

      const children = await gitService.getRepositoryContents(item.path);

      for (const child of children) {
        await this.createOrUpdatePage(child, page.id);
      }
    } else if (item.type === 'file') {
      const fileName = itemName;
      const extension = fileName.split('.').pop().toLowerCase();

      // 仅处理指定类型的文件
      if (!this.allowedExtensions.includes(extension)) {
        console.log(`跳过非指定类型文件：${fileName}`);
        return;
      } else {
        console.log(`处理指定类型文件：${fileName}`);
      }

      // 获取文件内容
      const fileContent = await gitService.getFileContent(item.path);
      console.log(`获取文件内容：${item.path} (长度: ${fileContent.length} 字符)`);

      // 使用 AI 模型服务生成 Wiki 注释
      const wikiCommentBlocks = await aiModelService.generateWikiComment(fileContent);
      console.log(`生成 Wiki 注释：${wikiCommentBlocks.length} 块`);

      // 生成语言映射
      const language = mapExtensionToLanguage(extension); // 修正参数

      // 创建或更新页面
      const page = await noteService.createOrUpdatePage(fileName, parentPageId);
      console.log(`已创建或更新 Notion 页面：${fileName} (ID: ${page.id})`);

      // 更新页面内容
      await noteService.updatePageContent(page.id, wikiCommentBlocks, fileContent, language);
      console.log(`已更新页面内容：${page.id}`);
    }
  }
}

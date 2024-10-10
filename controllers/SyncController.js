
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

      // 使用 AI 模型服务生成 Wiki 注释
      const wikiCommentBlocks = await aiModelService.generateWikiComment(fileContent);

      // 创建用于 Notion 的内容块
      const contentBlocks = [
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'Wiki 注释',
                },
              },
            ],
          },
        },
        {
          type: 'code',
          code: {
            language: 'markdown',
            rich_text: wikiCommentBlocks,
          },
        },
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: '源代码',
                },
              },
            ],
          },
        },
        {
          type: 'code',
          code: {
            language: mapExtensionToLanguage(fileName),
            rich_text: [
              {
                type: 'text',
                text: {
                  content: fileContent,
                },
              },
            ],
          },
        },
      ];

      // 创建或更新页面
      const page = await noteService.createOrUpdatePage(fileName, parentPageId);

      // 更新页面内容
      await noteService.clearPageBlocks(page.id);
      await noteService.appendPageBlocks(page.id, contentBlocks);
    }
  }
}

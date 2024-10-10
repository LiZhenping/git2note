import { Client } from '@notionhq/client';
import { INoteService } from '../../interfaces/INoteService.js';

export class NotionService extends INoteService {
  constructor(config) {
    super();
    this.config = config;
    this.notion = null;
  }

  async connect() {
    if (!this.config.notionToken) {
      console.error('错误：NOTION_TOKEN 未加载。请检查环境变量设置。');
      process.exit(1);
    }

    this.notion = new Client({ auth: this.config.notionToken });
  }

  async createOrUpdatePage(title, parentPageId) {
    // 检查是否存在同名的页面
    let page = await this.searchNotionPage(title, parentPageId);
    if (!page) {
      // 创建新页面
      const response = await this.notion.pages.create({
        parent: { page_id: parentPageId },
        properties: {
          title: {
            title: [{ type: 'text', text: { content: title } }],
          },
        },
      });
      return response;
    } else {
      // 已存在页面，返回页面信息
      return page;
    }
  }

  async updatePageContent(pageId, contentBlocks) {
    // 清空页面内容，然后添加新的内容块
    await this.clearPageBlocks(pageId);

    // 分批添加新的内容块，避免超过 Notion API 的限制
    const maxBlocksPerRequest = 50;
    for (let i = 0; i < contentBlocks.length; i += maxBlocksPerRequest) {
      const blockChunk = contentBlocks.slice(i, i + maxBlocksPerRequest);
      await this.notion.blocks.children.append({
        block_id: pageId,
        children: blockChunk,
      });
    }
  }

  async getPageContent(pageId) {
    const response = await this.notion.blocks.children.list({
      block_id: pageId,
    });

    return response.results;
  }

  async appendPageBlocks(pageId, blocks) {
    const maxBlocksPerRequest = 50;
    for (let i = 0; i < blocks.length; i += maxBlocksPerRequest) {
      const blockChunk = blocks.slice(i, i + maxBlocksPerRequest);
      await this.notion.blocks.children.append({
        block_id: pageId,
        children: blockChunk,
      });
    }
  }

  async clearPageBlocks(pageId) {
    const children = await this.getPageContent(pageId);
    for (const block of children) {
      if (block.type !== 'child_page') {
        await this.notion.blocks.delete({ block_id: block.id });
      }
    }
  }

  async searchNotionPage(pageName, parentPageId) {
    const response = await this.notion.blocks.children.list({
      block_id: parentPageId,
      page_size: 100,
    });

    for (const child of response.results) {
      if (child.type === 'child_page' && child.child_page.title === pageName) {
        return child;
      }
    }
    return null;
  }
}
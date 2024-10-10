// src/services/noteServices/NotionService.js

import { Client } from '@notionhq/client';
import { INoteService } from '../../interfaces/INoteService.js';
import Bottleneck from 'bottleneck';

const languageMap = {
  'js': 'javascript',
  'py': 'python',
  // 添加其他语言的映射
};

export class NotionService extends INoteService {
  constructor(config) {
    super();
    this.config = config;
    this.notion = null;

    // 初始化 Bottleneck 限制器
    this.limiter = new Bottleneck({
      minTime: 200, // 最小间隔 200ms
      maxConcurrent: 5, // 最多同时 5 个请求
    });
  }

  async connect() {
    if (!this.config.notionToken) {
      console.error('错误：NOTION_TOKEN 未加载。请检查环境变量设置。');
      process.exit(1);
    }

    this.notion = new Client({ auth: this.config.notionToken });
    console.log('已成功连接到 Notion API');
  }

  async createOrUpdatePage(title, parentPageId) {
    try {
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
        console.log(`已创建 Notion 页面：${title} (ID: ${response.id})`);
        return response;
      } else {
        console.log(`找到已存在的 Notion 页面：${title} (ID: ${page.id})`);
        return page;
      }
    } catch (error) {
      console.error(`创建或更新页面时出错（标题：${title}）：`, error.message);
      throw error;
    }
  }

  async updatePageContent(pageId, wikiCommentBlocks, fileContent, language) {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // 清空页面内容
        await this.clearPageBlocks(pageId);
        console.log(`已清空页面内容块：${pageId}`);

        // 创建内容块数组，添加"Wiki 注释"标题
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
        ];

        // 拼接所有Wiki注释文本
        let wikiCommentContent = '';
        wikiCommentBlocks.forEach(block => {
          if (block.type === 'text') {
            wikiCommentContent += block.text.content + '\n';
          }
          // 如果有其他类型的 rich_text，可以在这里处理
        });

        // 添加"Wiki 注释"代码块（单个块）
        await this.addContentBlocks(contentBlocks, 'markdown', wikiCommentContent, 2000);

        // 添加"源代码"标题
        contentBlocks.push({
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
        );

        // 添加"源代码"代码块（单个块），使用映射后的语言标识符
        await this.addContentBlocks(contentBlocks, languageMap[language] || 'python', fileContent, 2000);

        // 批量添加内容块到 Notion，避免超过 API 限制
        const maxBlocksPerRequest = 50;
        for (let i = 0; i < contentBlocks.length; i += maxBlocksPerRequest) {
          const blockChunk = contentBlocks.slice(i, i + maxBlocksPerRequest);
          console.log(`添加内容块 ${i + 1} 到 ${i + blockChunk.length}`);
          await this.limiter.schedule(() =>
            this.notion.blocks.children.append({
              block_id: pageId,
              children: blockChunk,
            })
          );
        }

        console.log(`已更新页面内容块：${pageId}`);
        break; // 成功后跳出循环
      } catch (error) {
        attempt++;
        console.error(`更新页面内容时出错 (页面ID: ${pageId})，尝试第 ${attempt} 次：`, error.message);

        if (attempt >= maxRetries) {
          console.error(`无法更新页面内容块：${pageId}，已达到最大重试次数。`);
          throw error; // 重新抛出错误以便上层捕获
        } else {
          // 等待一段时间后重试（指数退避）
          const delayTime = 1000 * Math.pow(2, attempt); // 2, 4, 8 秒
          console.log(`等待 ${delayTime} 毫秒后重试...`);
          await this.delay(delayTime);
        }
      }
    }
  }

  // 修改后的方法：添加多个内容块（合并为一个代码块）
  async addContentBlocks(contentBlocks, language, content, maxLength) {
    // 将内容拆分为不超过 maxLength 的多个块
    const chunks = this.splitTextIntoChunks(content, maxLength);

    // 创建 rich_text 数组，将所有的文本块添加进去
    const richTextItems = chunks.map(chunk => ({
      type: 'text',
      text: {
        content: chunk,
      },
    }));

    // 将所有 rich_text 项合并到一个代码块中，使用正确的语言标识符
    contentBlocks.push({
      type: 'code',
      code: {
        language: language,
        rich_text: richTextItems,
      },
    });
  }

  async getPageContent(pageId) {
    try {
      const response = await this.notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });

      return response.results;
    } catch (error) {
      console.error(`获取页面内容时出错（页面ID：${pageId}）：`, error.message);
      return [];
    }
  }

  async appendPageBlocks(pageId, blocks) {
    const maxBlocksPerRequest = 50;
    for (let i = 0; i < blocks.length; i += maxBlocksPerRequest) {
      const blockChunk = blocks.slice(i, i + maxBlocksPerRequest);
      console.log(`添加内容块 ${i + 1} 到 ${i + blockChunk.length}`);
      await this.limiter.schedule(() =>
        this.notion.blocks.children.append({
          block_id: pageId,
          children: blockChunk,
        })
      );
    }
  }

  async clearPageBlocks(pageId) {
    try {
      const children = await this.getPageContent(pageId);
      for (const block of children) {
        if (block.type !== 'child_page') {
          try {
            await this.limiter.schedule(() =>
              this.notion.blocks.delete({ block_id: block.id })
            );
            console.log(`已删除页面块：${block.id}`);
          } catch (error) {
            console.error(`删除页面块 ${block.id} 时出错：`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(`清空页面内容块时出错（页面ID：${pageId}）：`, error.message);
    }
  }

  async searchNotionPage(pageName, parentPageId) {
    try {
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
    } catch (error) {
      console.error(
        `搜索 Notion 页面时出错（页面名称：${pageName}，父页面ID：${parentPageId}）：`,
        error.message
      );
      return null;
    }
  }

  // 拆分文本为多个块
  splitTextIntoChunks(text, maxLength = 2000) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxLength;

      if (end >= text.length) {
        end = text.length;
      } else {
        // 尝试在maxLength之前的最后一个换行符处分割
        const lastNewLine = text.lastIndexOf('\n', end);
        if (lastNewLine > start) {
          end = lastNewLine + 1; // 包含换行符
        }
      }

      // 确保块的长度不超过maxLength
      if (end - start > maxLength) {
        end = start + maxLength;
      }

      const chunk = text.slice(start, end);
      chunks.push(chunk);
      start = end;
    }

    return chunks;
  }

  // 添加一个辅助函数用于延迟
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
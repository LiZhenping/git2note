/**
 * @file NotionServiceOptimized.js
 * @description 定义了一个用于与 Notion API 交互的服务类 NotionService，继承自 INoteService 接口
 * @author lizhenping
 * @date 2024-10-11
 */

import { Client } from '@notionhq/client';
import { INoteService } from '../../interfaces/INoteService.js';
import Bottleneck from 'bottleneck';
import winston from 'winston';

// 定义语言映射
const LANGUAGE_MAP = {
  'js': 'javascript',
  'py': 'python',
  // 可通过配置文件或环境变量扩展更多语言
};

/**
 * NotionService 类用于与 Notion API 交互，提供页面的创建、更新、搜索和管理功能。
 * 它支持页面内容的分块添加和删除，使用 Bottleneck 进行请求限流，通过 Winston 记录日志。
 * @extends INoteService
 */
export class NotionService extends INoteService {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config) {
    super();
    this.config = config;
    this.notion = null;
    this.limiter = this.initLimiter();
    this.logger = this.initLogger();
  }

  /**
   * 初始化请求限流器
   * @returns {Bottleneck} 请求限流器实例
   */
  initLimiter() {
    return new Bottleneck({
      minTime: 200, // 最小请求间隔 200ms  
      maxConcurrent: 5, // 最多同时 5 个并发请求
    });
  }

  /**
   * 初始化日志记录器
   * @returns {Winston.Logger} 日志记录器实例
   */ 
  initLogger() {
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        }),
      ),
      transports: [
        new winston.transports.Console(),
        // 可添加文件传输等
      ],
    });
  }

  /**
   * 连接到 Notion API
   * @throws {Error} 如果连接失败
   */
  async connect() {
    const notionToken = this.config.notionToken;
    if (!notionToken) {
      this.logger.error('NOTION_TOKEN 未加载。请检查环境变量设置。');
      process.exit(1);
    }

    try {
      this.notion = new Client({ auth: notionToken });
      this.logger.info('已成功连接到 Notion API');
    } catch (error) {
      this.logger.error(`连接 Notion API 失败：${error.message}`);
      throw error; 
    }
  }

  /**
   * 创建或更新 Notion 页面
   * @param {string} title - 页面标题  
   * @param {string} parentPageId - 父页面 ID
   * @returns {Promise<Object>} Notion 页面对象
   */
  async createOrUpdatePage(title, parentPageId) {
    try {
      const existingPage = await this.limiter.schedule(() =>
        this.searchNotionPage(title, parentPageId)
      );

      if (existingPage) {
        this.logger.info(`找到已存在的 Notion 页面：${title} (ID: ${existingPage.id})`);
        return existingPage;
      }

      const newPage = await this.limiter.schedule(() =>
        this.notion.pages.create({
          parent: { page_id: parentPageId },
          properties: {
            title: {
              title: [{ type: 'text', text: { content: title } }],
            },
          },
        })
      );

      this.logger.info(`已创建 Notion 页面：${title} (ID: ${newPage.id})`);
      return newPage;
    } catch (error) {
      this.logger.error(`创建或更新页面时出错（标题：${title}）：${error.message}`);
      throw error;
    }
  }

  /**
   * 更新 Notion 页面内容  
   * @param {string} pageId - 页面 ID
   * @param {Array} wikiCommentBlocks - Wiki 注释块
   * @param {string} fileContent - 文件内容  
   * @param {string} language - 语言
   */
  async updatePageContent(pageId, wikiCommentBlocks, fileContent, language) {
    const MAX_RETRIES = 3;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        await this.clearPageContent(pageId);

        // 添加 Wiki 注释部分
        const wikiCommentContent = this.formatWikiCommentContent(wikiCommentBlocks);
        await this.appendPageContent(pageId, 'Wiki 注释', 'markdown', wikiCommentContent);

        // 添加源代码部分
        const languageKey = language.toLowerCase();
        const sourceLang = LANGUAGE_MAP[languageKey] || 'python';
        await this.appendPageContent(pageId, '源代码', sourceLang, fileContent);

        this.logger.info(`已更新页面内容：${pageId}`);
        break; // 成功后跳出循环
      } catch (error) {
        attempt++;
        this.logger.error(
          `更新页面内容时出错（页面 ID：${pageId}），尝试第 ${attempt} 次：${error.message}`
        );

        if (attempt >= MAX_RETRIES) {
          this.logger.error(`无法更新页面内容：${pageId}，已达到最大重试次数。`);
          throw error;
        } else {
          const delayTime = 1000 * Math.pow(2, attempt); // 2, 4, 8 秒
          this.logger.info(`等待 ${delayTime} 毫秒后重试...`);
          await this.delay(delayTime);
        }
      }
    }
  }

  /**
   * 格式化 Wiki 注释内容
   * @param {Array} wikiCommentBlocks - Wiki 注释块
   * @returns {string} 格式化后的 Wiki 注释内容
   */
  formatWikiCommentContent(wikiCommentBlocks) {
    let content = '';
    for (const block of wikiCommentBlocks) {
      if (block.type === 'text') {
        content += block.text.content + '\n';
      }
    }
    return content.trim();
  }

  /**
   * 添加页面内容
   * @param {string} pageId - 页面 ID  
   * @param {string} heading - 标题
   * @param {string} language - 语言
   * @param {string} content - 内容
   */
  async appendPageContent(pageId, heading, language, content) {
    const MAX_LENGTH = 1990;
    const contentBlocks = [
      {
        type: 'heading_2',
        heading_2: {
          rich_text: [
            {
              type: 'text', 
              text: { content: heading },
            },
          ],
        },
      },
    ];

    // 分块添加内容
    const chunks = this.splitTextIntoChunks(content, MAX_LENGTH);
    for (const chunk of chunks) {
      contentBlocks.push({
        type: 'code',
        code: {  
          language: language,
          rich_text: [
            {
              type: 'text',
              text: { content: chunk },  
            },
          ],
        },
      });
    }

    await this.appendPageBlocks(pageId, contentBlocks);
  }

  /**
   * 分块添加内容到页面
   * @param {string} pageId - 页面 ID
   * @param {Array} blocks - 内容块
   */  
  async appendPageBlocks(pageId, blocks) {
    const MAX_BLOCKS_PER_REQUEST = 50;
    for (let i = 0; i < blocks.length; i += MAX_BLOCKS_PER_REQUEST) {
      const blockChunk = blocks.slice(i, i + MAX_BLOCKS_PER_REQUEST);
      this.logger.info(`添加内容块 ${i + 1} 到 ${i + blockChunk.length}`);
      await this.limiter.schedule(() =>
        this.notion.blocks.children.append({
          block_id: pageId,
          children: blockChunk,
        })  
      );
    }
  }

  /**
   * 清空页面内容  
   * @param {string} pageId - 页面 ID
   */
  async clearPageContent(pageId) {
    const blocks = await this.getPageContent(pageId);
    for (const block of blocks) {
      if (block.type !== 'child_page') {
        await this.limiter.schedule(() => 
          this.notion.blocks.delete({ block_id: block.id })
        );
        this.logger.info(`已删除页面块：${block.id}`);  
      }
    }
    this.logger.info(`已清空页面内容：${pageId}`);
  }

  /**
   * 获取页面内容块
   * @param {string} pageId - 页面 ID
   * @returns {Promise<Array>} 页面内容块
   */
  async getPageContent(pageId) {
    try {
      const response = await this.limiter.schedule(() =>
        this.notion.blocks.children.list({
          block_id: pageId,
          page_size: 100,
        })  
      );
      return response.results;
    } catch (error) {
      this.logger.error(`获取页面内容时出错（页面 ID：${pageId}）：${error.message}`);
      return [];
    }
  }

  /**
   * 在父页面下搜索指定标题的子页面
   * @param {string} title - 页面标题
   * @param {string} parentPageId - 父页面 ID  
   * @returns {Promise<Object|null>} 找到的页面对象或 null
   */
  async searchNotionPage(title, parentPageId) {
    try {
      const response = await this.limiter.schedule(() =>
        this.notion.blocks.children.list({
          block_id: parentPageId,
          page_size: 100,
        })
      );

      for (const child of response.results) {
        if (child.type === 'child_page' && child.child_page.title === title) {
          return child;
        }
      }
      return null;
    } catch (error) {
      this.logger.error(
        `搜索 Notion 页面时出错（页面标题：${title}，父页面 ID：${parentPageId}）：${error.message}`  
      );
      return null;
    }
  }

  /**
   * 将文本分块
   * @param {string} text - 要分块的文本
   * @param {number} [maxLength=1990] - 每块最大长度
   * @returns {Array<string>} 分块后的文本数组
   */
  splitTextIntoChunks(text, maxLength = 1990) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxLength;

      if (end >= text.length) {
        end = text.length;
      } else {
        const lastNewLine = text.lastIndexOf('\n', end);
        if (lastNewLine > start) {
          end = lastNewLine + 1;
        }
      }

      const chunk = text.slice(start, end);
      chunks.push(chunk);
      start = end;
    }

    return chunks;
  }

  /**
   * 延迟指定毫秒数
   * @param {number} ms - 要延迟的毫秒数
   * @returns {Promise<void>} 延迟 Promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
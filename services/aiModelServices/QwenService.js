/**
* @Author       : lizhenping
* @Project_Name : github2notion
* @FileName     : QwenServiceOptimized.js
* @SoftWare     : Cursor 
* @Time         : 2024-10-11 22:00:00
* @description  : 实现 Qwen AI 模型服务，用于生成代码注释
*/

import { OpenAI } from 'openai';
import { IAIModelService } from '../../interfaces/IAIModelService.js';

/**
 * Qwen AI 模型服务类
 * @extends IAIModelService
 */
export class QwenService extends IAIModelService {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   */
  constructor(config) {
    super();
    this.config = config;
    this.openai = null;
  }

  /**
   * 连接到 AI 模型服务
   * @returns {Promise<void>}
   */
  async connect() {
    // 初始化 OpenAI
    this.openai = new OpenAI({
      apiKey: this.config.aiModelApiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
    console.log('已成功连接到 AI 模型服务');
  }

  /**
   * 生成 Wiki 注释
   * @param {string} fileContent - 文件内容
   * @returns {Promise<Array>} 生成的注释数组
   */
  async generateWikiComment(fileContent) {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const prompt = this.config.prompt;
        const code = `\n${fileContent}\n`;
        
        if (code.length > 50000) {
          return this.createErrorResponse("抱歉，无法生成注释。因为这段字符串len(code)超过了5W。");
        }

        const completion = await this.openai.chat.completions.create({
          model: "qwen-max-latest",
          messages: [
            { role: "system", content: "你是一个代码注释助手." },
            { role: "user", content: prompt + code },
          ],
        });

        let generatedComment = this.cleanGeneratedComment(completion.choices[0].message.content);
        return this.createSuccessResponse(generatedComment);
      } catch (error) {
        retries++;
        console.error(`生成 Wiki 注释时发生错误（重试 ${retries}/${maxRetries}）：`, error.message);

        if (retries === maxRetries) {
          return this.createErrorResponse("抱歉，无法生成注释。请检查代码或稍后重试。");
        } else {
          const delayTime = 1000 * Math.pow(2, retries); // 2, 4, 8 秒
          console.log(`等待 ${delayTime} 毫秒后重试...`);
          await this.delay(delayTime);
        }
      }
    }
  }

  /**
   * 清理生成的注释内容
   * @param {string} comment - 原始注释
   * @returns {string} 清理后的注释
   */
  cleanGeneratedComment(comment) {
    return comment
      .replace(/```markdown\s*/g, '')
      .replace(/```/g, '')
      .replace(/^"{3,}|'{3,}/g, '')
      .replace(/"{3,}$|'{3,}$/g, '')
      .trim();
  }

  /**
   * 创建成功响应
   * @param {string} generatedComment - 生成的注释
   * @returns {Array} 包含注释的响应数组
   */
  createSuccessResponse(generatedComment) {
    return [
      {
        type: "text",
        text: {
          content: generatedComment,
        },
      },
    ];
  }

  /**
   * 创建错误响应
   * @param {string} message - 错误消息
   * @returns {Array} 包含错误消息的响应数组
   */
  createErrorResponse(message) {
    return [
      {
        type: "text",
        text: {
          content: message,
        },
      },
    ];
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟的毫秒数
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
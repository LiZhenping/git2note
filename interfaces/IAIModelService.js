/**
 * @file IAIModelService.js
 * @description 定义 AI 模型服务的接口
 * @author lizhenping
 * @date 2024-10-11
 */

/**
 * AI 模型服务接口
 * @interface
 */
export class IAIModelService {
  /**
   * 连接到 AI 服务
   * @abstract
   * @throws {Error} 如果方法未实现
   */
  connect() {
    throw new Error('Method not implemented: connect');
  }

  /**
   * 为给定的文件内容生成 Wiki 注释
   * @abstract
   * @param {string} fileContent - 文件内容
   * @returns {Promise<Array>} 生成的 Wiki 注释数组
   * @throws {Error} 如果方法未实现
   */
  generateWikiComment(fileContent) {
    throw new Error('Method not implemented: generateWikiComment');
  }
}
/**
 * @file IGitService.js
 * @description 定义 Git 服务的接口
 * @author lizhenping
 * @date 2024-10-11
 */

/**
 * Git 服务接口
 * @interface
 */
export class IGitService {
  /**
   * 连接到 Git 仓库
   * @abstract
   * @returns {Promise<void>}
   * @throws {Error} 如果连接失败
   */
  async connect() {
    throw new Error('Method not implemented: connect');
  }

  /**
   * 获取仓库内容
   * @abstract
   * @param {string} [path=''] - 仓库中的路径，默认为根目录
   * @returns {Promise<Array>} 指定路径下的仓库内容列表
   * @throws {Error} 如果获取失败
   */
  async getRepositoryContents(path = '') {
    throw new Error('Method not implemented: getRepositoryContents');
  }

  /**
   * 获取文件内容
   * @abstract
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} 文件内容
   * @throws {Error} 如果获取失败
   */
  async getFileContent(filePath) {
    throw new Error('Method not implemented: getFileContent');
  }

  /**
   * 检查指定目录是否包含允许的文件类型
   * @abstract
   * @param {string} dirPath - 目录路径
   * @param {string[]} allowedExtensions - 允许的文件扩展名数组
   * @returns {Promise<boolean>} 是否包含允许的文件类型
   * @throws {Error} 如果检查失败
   */
  async hasAllowedFiles(dirPath, allowedExtensions) {
    throw new Error('Method not implemented: hasAllowedFiles');
  }
}
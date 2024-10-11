/**
 * @file INoteService.js
 * @description 定义笔记服务的接口，主要用于与 Notion 等笔记平台交互
 * @author lizhenping
 * @date 2024-10-11
 */

/**
 * 笔记服务接口
 * @interface
 */
export class INoteService {
  /**
   * 连接到笔记服务
   * @abstract
   * @returns {Promise<void>}
   * @throws {Error} 如果连接失败
   */
  async connect() {
    throw new Error('Method not implemented: connect');
  }

  /**
   * 创建或更新页面
   * @abstract
   * @param {string} title - 页面标题
   * @param {string} parentPageId - 父页面 ID
   * @returns {Promise<Object>} 创建或更新的页面对象
   * @throws {Error} 如果创建或更新失败
   */
  async createOrUpdatePage(title, parentPageId) {
    throw new Error('Method not implemented: createOrUpdatePage');
  }

  /**
   * 更新页面内容
   * @abstract
   * @param {string} pageId - 页面 ID
   * @param {Array} contentBlocks - 内容块数组
   * @returns {Promise<void>}
   * @throws {Error} 如果更新失败
   */
  async updatePageContent(pageId, contentBlocks) {
    throw new Error('Method not implemented: updatePageContent');
  }

  /**
   * 获取页面内容
   * @abstract
   * @param {string} pageId - 页面 ID
   * @returns {Promise<Array>} 页面内容块数组
   * @throws {Error} 如果获取失败
   */
  async getPageContent(pageId) {
    throw new Error('Method not implemented: getPageContent');
  }

  /**
   * 追加页面块
   * @abstract
   * @param {string} pageId - 页面 ID
   * @param {Array} blocks - 要追加的内容块数组
   * @returns {Promise<void>}
   * @throws {Error} 如果追加失败
   */
  async appendPageBlocks(pageId, blocks) {
    throw new Error('Method not implemented: appendPageBlocks');
  }

  /**
   * 清除页面块
   * @abstract
   * @param {string} pageId - 页面 ID
   * @returns {Promise<void>}
   * @throws {Error} 如果清除失败
   */
  async clearPageBlocks(pageId) {
    throw new Error('Method not implemented: clearPageBlocks');
  }

  /**
   * 搜索笔记页面
   * @abstract
   * @param {string} pageName - 页面名称
   * @param {string} parentPageId - 父页面 ID
   * @returns {Promise<Object|null>} 找到的页面对象，如果未找到则返回 null
   * @throws {Error} 如果搜索失败
   */
  async searchNotionPage(pageName, parentPageId) {
    throw new Error('Method not implemented: searchNotionPage');
  }
}
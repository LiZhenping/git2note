/**
* @Author       : lizhenping
# @Project_Name : NotionContentManager
# @FileName     : notionContentUtils.js
# @SoftWare     : Cursor 
# @Time         : 2023-06-26 10:00:00

这
*/ 
/**
 * 服务NotionService 类用于与 Notion API 交互，提供页面的创建、更新、搜索和管理功能。
 * 个文件包含用于处理和格式化Notion内容的实用函数。主要功能包括创建内容块、将文件扩展名映射到编程语言，以及将文本分割成适合Notion API的小块。
 * @extends INoteService
 */
/**
 * 创建Notion内容块
 * @param {string} fileContent - 文件内容
 * @param {string} language - 编程语言
 * @returns {Array} 包含Notion内容块的数组
 */
function createContentBlocks(fileContent, language) {  
  // 清理文件内容，移除无效的Unicode字符，保留换行符、回车符和制表符
  const cleanedContent = fileContent.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');  
  
  // 将内容拆分成不超过1990个字符的片段，为Notion API预留缓冲空间
  const MAX_CONTENT_LENGTH = 1990;  
  const chunks = splitTextIntoChunks(cleanedContent, MAX_CONTENT_LENGTH);  
  
  // 为每个片段创建一个代码块
  return chunks.map(chunk => ({
    object: 'block',
    type: 'code',
    code: {  
      rich_text: [{ type: 'text', text: { content: chunk } }],  
      language: language,  
    },  
  }));
}  

/**
 * 将文件扩展名映射到Notion支持的编程语言
 * @param {string} extension - 文件扩展名
 * @returns {string} Notion支持的编程语言名称
 */
export function mapExtensionToLanguage(extension) {
  const EXTENSION_MAPPING = {
    js: "javascript",
    ts: "typescript",
    css: "css",
    py: "python",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
    md: "markdown",
    html: "html",
    json: "json",
    java: "java",
    cpp: "cpp",
    c: "c",
    rb: "ruby",
    php: "php",
    go: "go",
    rs: "rust",
    swift: "swift",
    // 可根据需要添加更多映射
  };
  return EXTENSION_MAPPING[extension.toLowerCase()] || "plain text";
}

/**
 * 将文本分割成指定最大长度的块
 * @param {string} text - 需要分割的文本
 * @param {number} maxLength - 每个块的最大长度
 * @returns {Array} 分割后的文本块数组
 */
function splitTextIntoChunks(text, maxLength) {  
  const chunks = [];  
  let startIndex = 0;

  while (startIndex < text.length) {  
    let endIndex = Math.min(startIndex + maxLength, text.length);
    
    // 尝试在最后一个换行符或空白字符处截断，避免拆分代码结构
    const lastBreakIndex = Math.max(
      text.lastIndexOf('\n', endIndex),
      text.lastIndexOf(' ', endIndex)
    );  
    
    if (lastBreakIndex > startIndex && lastBreakIndex < endIndex) {  
      endIndex = lastBreakIndex + 1;  
    }  
    
    chunks.push(text.substring(startIndex, endIndex).trim());  
    startIndex = endIndex;  
  }  
  
  return chunks;  
}
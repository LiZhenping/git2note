// src/utils/utils.js

function createContentBlocks(fileContent, language) {  
  // 清理文件内容，移除无效的 Unicode 字符，但保留换行符 (\n)、回车符 (\r) 和制表符 (\t)  
  const cleanedContent = fileContent.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');  

  // 将内容拆分成不超过 1990 个字符的片段，给 Notion API 留出一些缓冲空间  
  const maxContentLength = 1990;  
  const chunks = splitTextIntoChunks(cleanedContent, maxContentLength);  

  let blocks = [];  

  // 为每个片段创建一个代码块  
  for (const chunk of chunks) {  
    blocks.push({  
      object: 'block',  
      type: 'code',  
      code: {  
        rich_text: [  
          {  
            type: 'text',  
            text: {  
              content: chunk,  
            },  
          },  
        ],  
        language: language,  
      },  
    });  
  }  

  return blocks;  
}  


export function mapExtensionToLanguage(extension) {
  const extensionMapping = {
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
    // 根据需要添加更多映射
  };
  return extensionMapping[extension.toLowerCase()] || "plain text";
}

function splitTextIntoChunks(text, maxLength) {  
  const chunks = [];  
  let startIndex = 0;  

  while (startIndex < text.length) {  
    let endIndex = startIndex + maxLength;  

    // 防止超过文本长度  
    if (endIndex > text.length) {  
      endIndex = text.length;  
    }  

    // 尝试在最后一个换行符或空白字符处截断，避免拆分代码结构  
    const lastBreakIndex = Math.max(  
      text.lastIndexOf('\n', endIndex),  
      text.lastIndexOf(' ', endIndex)  
    );  
    if (lastBreakIndex > startIndex && lastBreakIndex < endIndex) {  
      endIndex = lastBreakIndex + 1;  
    }  

    const chunk = text.substring(startIndex, endIndex);  
    chunks.push(chunk.trim());  
    startIndex = endIndex;  
  }  

  return chunks;  
}  
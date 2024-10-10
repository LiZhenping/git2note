// src/utils/utils.js

export function createContentBlocks(content, language = 'plain text') {
  // 清理文件内容，移除无效的 Unicode 字符，但保留换行符 (\n)、回车符 (\r) 和制表符 (\t)
  const cleanedContent = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // 将内容拆分成不超过 2000 个字符的片段
  const chunks = splitTextIntoChunks(cleanedContent, 2000);

  // Notion 对每个代码块的 rich_text 数组有最大 100 个元素的限制
  const maxRichTextPerBlock = 100;

  let blocks = [];

  // 根据限制创建代码块
  for (let i = 0; i < chunks.length; i += maxRichTextPerBlock) {
    const chunkBatch = chunks.slice(i, i + maxRichTextPerBlock);

    const richTextArray = chunkBatch.map(chunk => ({
      type: 'text',
      text: { content: chunk }
    }));

    blocks.push({
      object: 'block',
      type: 'code',
      code: {
        rich_text: richTextArray,
        language: language,
      },
    });
  }

  return blocks;
}

export function mapExtensionToLanguage(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  const mapping = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    html: 'html',
    css: 'css',
    json: 'json',
    sh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    md: 'markdown',
    txt: 'plain text',
    // 添加更多映射
  };

  return mapping[extension] || 'plain text';
}

export function splitTextIntoChunks(text, maxLength = 2000) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxLength;

    if (end >= text.length) {
      end = text.length;
    } else {
      // 在最后一个换行符处截断，避免拆分代码结构
      const lastNewLine = text.lastIndexOf('\n', end);
      if (lastNewLine > start) {
        if (lastNewLine - start <= maxLength) {
          end = lastNewLine + 1; // 包含换行符
        } else {
          // 如果调整后的长度仍然超过 maxLength，不调整 end
          end = start + maxLength;
        }
      }
    }

    // 确保 chunk 的长度不超过 maxLength
    if (end - start > maxLength) {
      end = start + maxLength;
    }

    chunks.push(text.slice(start, end));
    start = end;
  }

  return chunks;
}
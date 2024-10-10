import dotenv from 'dotenv';
dotenv.config(); // 加载环境变量

import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import { Client } from "@notionhq/client";
import path from "path";
// 以下为代码的快速实现 demo，但是在工程中，这是错误的代码撰写方式，如果在一线大厂 BAT 等，这种写法是会被开除的。GOOGLE 中这种代码的写作方式是严重不被允许的。
// ========== 配置部分 ==========

// GitHub 配置
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = "LiZhenping/langchain-notion"; // 替换为您的仓库名称

// 检查 GITHUB_TOKEN 是否已加载
if (!GITHUB_TOKEN) {
  console.error("错误：GITHUB_TOKEN 未加载。请检查环境变量设置。");
  process.exit(1);
}

// 提取 owner 和 repo
const [owner, repo] = GITHUB_REPO.split("/");

// Notion 配置
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_ROOT_PAGE_ID = "118a05ef-c2de-807a-8665-fc06b591be52"; // 替换为您的 Notion 页面 ID

// 检查 NOTION_TOKEN 是否已加载
if (!NOTION_TOKEN) {
  console.error("错误：NOTION_TOKEN 未加载。请检查环境变量设置。");
  process.exit(1);
}

// Qwen Max API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

// 检查 DASHSCOPE_API_KEY 是否已加载
if (!DASHSCOPE_API_KEY) {
  console.error("错误：DASHSCOPE_API_KEY 未加载。请检查环境变量设置。");
  process.exit(1);
}

// ========== 脚本部分 ==========

// 初始化 GitHub 和 Notion 客户端
const octokit = new Octokit({ auth: GITHUB_TOKEN });
const notion = new Client({ auth: NOTION_TOKEN });

// 初始化 OpenAI 客户端，指向 Qwen API
const openai = new OpenAI({
  apiKey: DASHSCOPE_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

// 映射文件扩展名到编程语言的函数
function mapExtensionToLanguage(extension) {
  const extensionMapping = {
    js: "javascript",
    ts: "typescript",
    css: "css",
    py: "python",
    sh: "bash",
    yml: "yaml",
    yaml: "yaml",
    md: "markdown",
    // 根据需要添加更多映射
  };
  return extensionMapping[extension.toLowerCase()] || "plain text";
}

// 定义要同步的代码文件扩展名列表
const allowedExtensions = [
  'js', 'ts', 'css', 'py', 'sh', 'yml', 'yaml'
];

// 同步 GitHub 仓库内容到 Notion 的函数
async function syncRepoToNotion() {
  console.log("开始同步 GitHub 项目到 Notion...");

  try {
    // 获取仓库内容
    const contents = await octokit.repos.getContent({
      owner,
      repo,
      path: "",
    });

    for (const item of contents.data) {
      await createOrUpdatePage(item, NOTION_ROOT_PAGE_ID);
    }

    console.log("同步完成！");
  } catch (error) {
    console.error("同步时发生错误：", error);
  }
}

// 创建或更新 Notion 页面的函数
async function createOrUpdatePage(item, parentPageId) {
  try {
    const itemName = item.name;

    // 跳过以 '.' 开头的隐藏文件或文件夹
    if (itemName.startsWith('.')) {
      console.log(`跳过隐藏文件或文件夹：${itemName}`);
      return;
    }

    if (item.type === "dir") {
      // 添加检查：如果文件夹中不包含指定类型的文件，跳过创建页面
      const containsAllowedFiles = await hasAllowedFiles(item.path);
      if (!containsAllowedFiles) {
        console.log(`跳过文件夹 ${itemName}，因为其中不包含指定类型的文件`);
        return;
      }

      // 检查是否存在同名的页面（文件夹）
      let page = await searchNotionPage(itemName, parentPageId);
      if (!page) {
        // 创建新的文件夹页面
        page = await notion.pages.create({
          parent: { page_id: parentPageId },
          properties: {
            title: {
              title: [{ type: "text", text: { content: itemName } }],
            },
          },
        });
      } else {
        // 如果找到已存在的页面，获取其页面 ID
        page = await notion.pages.retrieve({ page_id: page.id });
      }

      // 递归处理子内容
      const contents = await octokit.repos.getContent({
        owner: owner,
        repo: repo,
        path: item.path,
      });

      for (const content of contents.data) {
        await createOrUpdatePage(content, page.id);
      }
    } else if (item.type === "file") {
      const fileName = itemName;
      const extension = path.extname(fileName).slice(1).toLowerCase();

      // 添加过滤：仅处理指定类型的文件
      if (!allowedExtensions.includes(extension)) {
        console.log(`跳过非指定类型文件：${fileName}`);
        return; // 不处理该文件
      } else {
        console.log(`处理指定类型文件：${fileName}`);
      }

      // 获取文件内容
      const fileContentResponse = await octokit.repos.getContent({
        owner: owner,
        repo: repo,
        path: item.path,
      });

      const fileContent = Buffer.from(
        fileContentResponse.data.content,
        "base64"
      ).toString("utf8");

      const language = mapExtensionToLanguage(extension);

      // 创建内容块，确保符合 Notion API 的限制
      const contentBlocks = createContentBlocks(fileContent, language, extension);

      // 检查是否存在同名的页面（文件）
      let page = await searchNotionPage(fileName, parentPageId);
      if (!page) {
        // 创建新的代码页面
        page = await notion.pages.create({
          parent: { page_id: parentPageId },
          properties: {
            title: {
              title: [{ type: "text", text: { content: fileName } }],
            },
          },
        });
      }

      // 删除页面中已有的内容块
      await clearPageBlocks(page.id);

      // 分批添加新的内容块，避免超过 Notion API 的限制
      const maxBlocksPerRequest = 50;
      for (let i = 0; i < contentBlocks.length; i += maxBlocksPerRequest) {
        const blockChunk = contentBlocks.slice(i, i + maxBlocksPerRequest);
        await notion.blocks.children.append({
          block_id: page.id,
          children: blockChunk,
        });
      }

      // 检查并添加 "Wiki 注释" 部分
      await ensureWikiSection(page.id, fileContent);
    }
  } catch (error) {
    console.error(`处理文件 ${item.path} 时发生错误：`, error);
    // 继续处理下一个文件
  }
}

// 添加检查文件夹是否包含指定类型文件的函数
async function hasAllowedFiles(dirPath) {
  try {
    const contents = await octokit.repos.getContent({
      owner: owner,
      repo: repo,
      path: dirPath,
    });

    for (const item of contents.data) {
      if (item.type === 'file') {
        const fileName = item.name;
        const extension = path.extname(fileName).slice(1).toLowerCase();
        if (allowedExtensions.includes(extension)) {
          return true; // 找到指定类型的文件
        }
      } else if (item.type === 'dir') {
        const hasFiles = await hasAllowedFiles(item.path);
        if (hasFiles) {
          return true; // 子文件夹中找到指定类型的文件
        }
      }
    }

    return false; // 未找到指定类型的文件
  } catch (error) {
    console.error(`检查目录 ${dirPath} 时发生错误：`, error);
    return false;
  }
}

// 清空页面中已有的内容块
async function clearPageBlocks(pageId) {
  const children = await notion.blocks.children.list({ block_id: pageId });
  for (const block of children.results) {
    if (block.type !== "child_page") {
      await notion.blocks.delete({ block_id: block.id });
    }
  }
}

// 创建内容块，返回块数组
function createContentBlocks(fileContent, language, extension) {
  // 清理文件内容，移除无效的 Unicode 字符，但保留换行符 (\n)、回车符 (\r) 和制表符 (\t)
  const cleanedContent = fileContent.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");

  // 将内容拆分成不超过 2000 个字符的片段
  const chunks = splitTextIntoChunks(cleanedContent, 2000);

  // Notion 对每个代码块的 rich_text 数组有最大 100 个元素的限制
  const maxRichTextPerBlock = 100;

  let blocks = [];

  // 根据限制创建代码块
  for (let i = 0; i < chunks.length; i += maxRichTextPerBlock) {
    const chunkBatch = chunks.slice(i, i + maxRichTextPerBlock);

    const richTextArray = chunkBatch.map(chunk => ({
      type: "text",
      text: { content: chunk }
    }));

    blocks.push({
      object: "block",
      type: "code",
      code: {
        rich_text: richTextArray,
        language: language,
      },
    });
  }

  return blocks;
}

// 确保页面中有 "Wiki 注释" 部分
async function ensureWikiSection(pageId, fileContent) {
  try {
    // 检查页面中是否已有 "Wiki 注释" 部分
    const children = await notion.blocks.children.list({ block_id: pageId });
    const hasWikiSection = children.results.some(
      (block) =>
        block.type === "heading_2" &&
        block.heading_2.rich_text[0]?.plain_text === "Wiki 注释"
    );

    if (!hasWikiSection) {
      // 添加 "Wiki 注释" 部分
      await notion.blocks.children.append({
        block_id: pageId,
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ type: "text", text: { content: "Wiki 注释" } }],
            },
          },
          {
            object: "block",
            type: "code",
            code: {
              rich_text: await generateWikiComment(fileContent),
              language: "markdown",
            },
          },
        ],
      });
    }
  } catch (error) {
    console.error(`添加 "Wiki 注释" 部分时发生错误：`, error);
    // 继续处理其他文件
  }
}

// 生成 Wiki 注释的函数，使用 OpenAI 库调用 Qwen Max 模型
async function generateWikiComment(fileContent) {  
  const maxRetries = 3;  
  let retries = 0;  

  while (retries < maxRetries) {  
    try {  
      const prompt = "请为这段代码生成一个简要的Wiki注释，用markdown格式返回:";  
      const code = "\n" + fileContent + "\n";  
      const openai = new OpenAI({  
        apiKey: process.env.DASHSCOPE_API_KEY,  
        baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",  
      });  

      const completion = await openai.chat.completions.create({  
        model: "qwen-max-latest",  
        messages: [  
          { role: "system", content: "You are a helpful assistant." },  
          { role: "user", content: prompt + code },  
        ],  
      });  

      let generatedComment = completion.choices[0].message.content;  

      // 移除生成的注释内容中的 ```markdown 和 ```  
      generatedComment = generatedComment.replace(/```markdown\s*/g, '').replace(/```/g, '').trim();  
      // 移除多余的三引号  
      generatedComment = generatedComment.replace(/^"{3,}|'{3,}/g, '').replace(/"{3,}$|'{3,}$/g, '').trim();  

      return [  
        {  
          type: "text",  
          text: {  
            content: generatedComment,  
          },  
        },  
      ];  
    } catch (error) {  
      console.error(`生成 Wiki 注释时发生错误（重试 ${retries + 1}/${maxRetries}）：`, error);  
      retries++;  

      if (retries === maxRetries) {  
        return [  
          {  
            type: "text",  
            text: {  
              content: "抱歉，无法生成注释。请检查代码或稍后重试。",  
            },  
          },  
        ];  
      }  
    }  
  }  
}  



// 搜索 Notion 页面的函数
async function searchNotionPage(pageName, parentPageId) {
  const response = await notion.blocks.children.list({
    block_id: parentPageId,
    page_size: 100,
  });

  for (const child of response.results) {
    if (
      child.type === "child_page" &&
      child.child_page.title === pageName
    ) {
      return child;
    }
  }
  return null;
}

// 修改后的辅助函数：splitTextIntoChunks
function splitTextIntoChunks(text, maxLength = 2000) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxLength;

    // 如果超过文本长度，直接截取到末尾
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

// 执行同步
syncRepoToNotion();
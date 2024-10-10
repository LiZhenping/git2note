// src/services/aiModelServices/QwenService.js

import { OpenAI } from 'openai';
import { IAIModelService } from '../../interfaces/IAIModelService.js';

export class QwenService extends IAIModelService {
  constructor(config) {
    super();
    this.config = config;
    this.openai = null;
  }

  async connect() {
    // 初始化 OpenAI
    this.openai = new OpenAI({
      apiKey: this.config.aiModelApiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    });
    console.log('已成功连接到 AI 模型服务');
  }

  // 生成 Wiki 注释的函数
  async generateWikiComment(fileContent) {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const prompt = "请为这段代码生成一个简要的Wiki注释，用markdown格式返回:";
        const code = "\n" + fileContent + "\n";

        const completion = await this.openai.chat.completions.create({
          model: "qwen-plus",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: prompt + code },
          ],
        });

        let generatedComment = completion.choices[0].message.content;

        // 移除生成的注释内容中的 ```markdown 和 ```
        generatedComment = generatedComment.replace(/```markdown\s*/g, '').replace(/```/g, '').trim();
        // 移除多余的引号
        generatedComment = generatedComment.replace(/^"{3,}|'{3,}/g, '').replace(/"{3,}$|'{3,}$/g, '').trim();

        // 确保生成的注释不超过2000字符
        const maxCommentLength = 2000;
        if (generatedComment.length > maxCommentLength) {
          generatedComment = generatedComment.slice(0, maxCommentLength) + '...';
          console.warn(`生成的 Wiki 注释超过 ${maxCommentLength} 个字符，已截断。`);
        }

        return [
          {
            type: "text",
            text: {
              content: generatedComment,
            },
          },
        ];
      } catch (error) {
        retries++;
        console.error(`生成 Wiki 注释时发生错误（重试 ${retries}/${maxRetries}）：`, error.message);

        if (retries === maxRetries) {
          return [
            {
              type: "text",
              text: {
                content: "抱歉，无法生成注释。请检查代码或稍后重试。",
              },
            },
          ];
        } else {
          // 等待一段时间后重试（指数退避）
          const delayTime = 1000 * Math.pow(2, retries); // 2, 4, 8 秒
          console.log(`等待 ${delayTime} 毫秒后重试...`);
          await this.delay(delayTime);
        }
      }
    }
  }

  // 添加一个辅助函数用于延迟
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

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
}
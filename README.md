# github2notion

#### 介绍
用于将 GitHub 中的代码下载到 Notion 中，并使用 Qwen AI 模型 API 对代码进行注释。

#### 软件架构
本项目采用模块化设计，主要包含以下模块：
- **控制器 (controllers)**: 负责协调各个服务的调用，处理 Git 仓库与 Notion 之间的同步。
- **接口 (interfaces)**: 定义各个服务的接口，确保服务之间的解耦。
- **工具 (utils)**: 提供一些实用函数，用于处理和格式化 Notion 内容。
- **配置 (config)**: 负责加载和管理应用的配置。
- **服务 (services)**: 包含与 GitHub 和 Notion API 交互的具体实现。
- **笔记服务 (noteServices)**: 处理与 Notion API 的交互，提供页面的创建、更新和管理功能。
- **AI 模型服务 (aiModelServices)**: 负责与 Qwen AI 模型的交互，生成代码注释。

#### 安装教程

1. 克隆本仓库到本地：
   ```bash
   git clone https://github.com/yourusername/github2notion.git
   ```
2. 进入项目目录：
   ```bash
   cd github2notion
   ```
3. 安装依赖：
   ```bash
   cnpm install
   ```

#### 使用说明

1. 运行代码请使用 `node index.js` 或者 `npm start`。
2. 确保在 `.env` 文件中配置了必要的环境变量，例如 GitHub Token 和 Notion Token。
3. 根据需要修改配置文件以适应你的项目需求。

#### 参与贡献

1. lizhenping
2. claude,cursor,chatgpt-o1-mini,sider


#### 特技

1. 使用 `Readme_XXX.md` 来支持不同的语言，例如 `Readme_en.md`, `Readme_zh.md`。
2. Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)。
3. 你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目。
4. [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目。
5. Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)。
6. Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)。
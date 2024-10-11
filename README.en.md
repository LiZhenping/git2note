Here’s the translation of your README into English:

# github2notion

#### Introduction
This project is designed to download code from GitHub into Notion and annotate the code using the Qwen AI model API.

#### Software Architecture
This project follows a modular design and mainly consists of the following modules:
- **Controllers**: Responsible for coordinating calls between services and handling synchronization between the Git repository and Notion.
- **Interfaces**: Defines the interfaces for each service to ensure decoupling between services.
- **Utils**: Provides utility functions for processing and formatting Notion content.
- **Config**: Manages the loading and configuration of application settings.
- **Services**: Contains the specific implementations for interacting with the GitHub and Notion APIs.
- **Note Services**: Handles interactions with the Notion API, providing functionalities for creating, updating, and managing pages.
- **AI Model Services**: Responsible for interacting with the Qwen AI model to generate code annotations.

#### Installation Guide

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/yourusername/github2notion.git
   ```
2. Navigate to the project directory:
   ```bash
   cd github2notion
   ```
3. Install dependencies:
   ```bash
   cnpm install
   ```

#### Usage Instructions

1. To run the code, use `node index.js` or `npm start`.
2. Ensure that the necessary environment variables, such as GitHub Token and Notion Token, are configured in the `.env` file.
3. Modify the configuration file as needed to suit your project requirements.

#### Contributing

1. lizhenping
2. claude, cursor, chatgpt-o1-mini, sider

#### Features

1. Use `Readme_XXX.md` to support different languages, such as `Readme_en.md`, `Readme_zh.md`.
2. Gitee Official Blog [blog.gitee.com](https://blog.gitee.com).
3. You can explore outstanding open-source projects on Gitee at [https://gitee.com/explore](https://gitee.com/explore).
4. [GVP](https://gitee.com/gvp) stands for Gitee's Most Valuable Open Source Project, which is an evaluation of outstanding open-source projects.
5. The user manual provided by Gitee can be found at [https://gitee.com/help](https://gitee.com/help).
6. Gitee's Cover Star is a column showcasing Gitee members' profiles [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/).
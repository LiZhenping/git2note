import os
import requests
from dotenv import load_dotenv

# 加载 .env 文件中的环境变量
load_dotenv()

# 从环境变量中获取 Gitee API 令牌
token = os.getenv('GITEE_TOKEN')
if not token:
    raise ValueError("GITEE_TOKEN 环境变量未设置")

headers = {
    'Authorization': f'token {token}',
    'Content-Type': 'application/json'
}

# 获取所有仓库列表
response = requests.get('https://gitee.com/api/v5/user/repos', headers=headers)
if response.status_code != 200:
    raise Exception(f"Failed to fetch repositories: {response.status_code} {response.text}")

repos = response.json()
print(repos)

# 遍历所有仓库并删除
# for repo in repos:
#     repo_name = repo.get('name')
#     if not repo_name:
#         print("Repository name not found, skipping...")
#         continue

#     delete_url = f'https://gitee.com/api/v5/repos/lizhenping/{repo_name}'
#     delete_response = requests.delete(delete_url, headers=headers)
    
#     if delete_response.status_code == 204:
#         print(f'Successfully deleted repository: {repo_name}')
#     else:
#         print(f'Failed to delete repository: {repo_name}. Status Code: {delete_response.status_code}, Response: {delete_response.text}')

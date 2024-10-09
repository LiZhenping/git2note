import requests # type: ignore

# 替换为你的Gitee API令牌
token = 'af77489efe3a6ca0afc5dccdc4d4e657'
headers = {
    'Authorization': f'token {token}',
    'Content-Type': 'application/json'
}

# 获取所有仓库列表
response = requests.get('https://gitee.com/api/v5/user/repos', headers=headers)
repos = response.json()

# 遍历所有仓库并删除
for repo in repos:
    repo_name = repo['name']
    delete_url = f'https://gitee.com/api/v5/repos/lizhenping/{repo_name}'
    delete_response = requests.delete(delete_url, headers=headers)
    if delete_response.status_code == 204:
        print(f'Successfully deleted repository: {repo_name}')
    else:
        print(f'Failed to delete repository: {repo_name}')

import pandas as pd
import yaml
import os
from collections import defaultdict

# 定义所有技术领域
domains = [
    '人工智能',
    '云基础设施',
    '大数据与数据工程',
    '数据库',
    '操作系统',
    '编程语言与开发',
    '前端',
    '区块链与 Web3',
    '物联网与边缘计算',
    'RISC-V 与硬件',
    '应用与解决方案',
    '工业软件',
    '其他'
]

# 读取CSV文件
df = pd.read_csv('output_with_domain_v3.csv')

# 创建领域到仓库的映射
domain_repos = defaultdict(list)

# 遍历每一行数据
for _, row in df.iterrows():
    # 跳过没有领域信息的行
    if pd.isna(row['domain']) or row['domain'] == '':
        continue

    # 处理可能的多个领域
    row_domains = row['domain'].split(',')
    for domain in row_domains:
        # 检查领域是否在我们定义的列表中
        if domain in domains:
            # 添加仓库信息到对应领域
            repo_info = {
                'id': row['repo_id'],
                'name': row['repo_name']
            }
            domain_repos[domain].append(repo_info)

# 创建输出目录
output_dir = 'domain_yamls'
os.makedirs(output_dir, exist_ok=True)

# 为每个领域生成YAML文件
for i, domain in enumerate(domains, 1):
    # 准备YAML数据结构
    yaml_data = {
        'name': domain,
        'type': f'Tech-{i + 9}',  # 从Tech-0开始编号
        'data': {
            'platforms': [
                {
                    'name': 'GitHub',  # 假设所有仓库都来自GitHub
                    'type': 'Code Hosting',
                    'repos': domain_repos.get(domain, [])
                }
            ]
        }
    }

    # 生成文件名（将中文转换为拼音或使用英文名称）
    filename_map = {
        '人工智能': 'ai',
        '云基础设施': 'cloud-infrastructure',
        '大数据与数据工程': 'big-data',
        '数据库': 'database',
        '操作系统': 'operating-system',
        '编程语言与开发': 'programming',
        '前端': 'frontend',
        '区块链与 Web3': 'blockchain',
        '物联网与边缘计算': 'iot',
        'RISC-V 与硬件': 'riscv',
        '应用与解决方案': 'app',
        '工业软件': 'industrial',
        '其他': 'other'
    }
    filename = f"{filename_map[domain]}.yml"
    filepath = os.path.join(output_dir, filename)

    # 写入YAML文件
    with open(filepath, 'w', encoding='utf-8') as f:
        yaml.dump(yaml_data, f, allow_unicode=True, sort_keys=False, default_flow_style=False)

print(f"已生成{len(domains)}个YAML文件，保存在{output_dir}目录下")

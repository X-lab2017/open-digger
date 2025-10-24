import pandas as pd

# 读取 CSV
df = pd.read_csv('output.csv')

# 统计 description 和 topics 都为空的行
empty_count = df[df['description'].isnull() & df['topics'].isnull()].shape[0]

print("description 和 topics 都为空的项目数量:", empty_count)
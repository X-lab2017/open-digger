import pandas as pd

# 读取 CSV
df = pd.read_csv('output_with_domain_v3.csv')

# 筛选条件：domain == '其他' 且 description 或 topics 不为空
filtered_df = df[
    (df['domain'] == '其他') &
    (df['description'].notnull() | df['topics'].notnull())
]

# 保存为新的 CSV 文件
filtered_df.to_csv('other_nonempty.csv', index=False)

print("已保存符合条件的数据，数量:", filtered_df.shape[0])
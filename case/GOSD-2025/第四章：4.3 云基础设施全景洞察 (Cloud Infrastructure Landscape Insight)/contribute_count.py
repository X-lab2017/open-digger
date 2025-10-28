import pandas as pd
import numpy as np

# 定义文件路径
excel_file = 'item_with_openrank.xlsx'  # 请替换为你的Excel文件名
sheet_name = 'Sheet3' # 请替换为包含数据的实际工作表名称

# 尝试读取 Excel 文件中的 R 列
try:
    df = pd.read_excel(excel_file, sheet_name=sheet_name)
except FileNotFoundError:
    print(f"错误：未找到文件 {excel_file}。请确保文件和脚本在同一目录下。")
    exit()
except ValueError:
    print(f"错误：未找到名为 '{sheet_name}' 的工作表。请检查工作表名称是否正确。")
    exit()

# 获取 R 列的数据，列头为 'github_contributors_count'
if 'github_contributors_count' in df.columns:
    contributor_counts = df['github_contributors_count']
else:
    # 如果没有找到指定列名，使用列索引 R (第18列，索引为17)
    print("警告：未找到 'github_contributors_count' 列，将使用第18列 (索引17)。")
    contributor_counts = df.iloc[:, 17]

# 定义你指定的五个区间
bins = [50, 200, 500, 1000, 5000, np.inf]
labels = ['50-200', '200-500', '500-1000', '1000-5000', '>5000']

# 使用 cut 函数将贡献者数量分桶
# right=False 表示左闭右开区间，例如 [50, 200)
binned_counts = pd.cut(contributor_counts, bins=bins, labels=labels, right=False)

# 统计每个区间中的项目数量
interval_counts = binned_counts.value_counts().sort_index()

# 计算每个区间的项目占比
total_projects = len(contributor_counts)
interval_percentages = (interval_counts / total_projects) * 100

# 将结果合并到一个 DataFrame
summary_df = pd.DataFrame({
    '项目数量': interval_counts,
    '占比 (%)': interval_percentages
})

# 打印结果
print("\n项目贡献者数量分段统计结果：")
print(summary_df)

# 将结果保存到新的 Excel 文件
output_file = 'contributors_summary.xlsx'
summary_df.to_excel(output_file)
print(f"\n结果已保存到 {output_file} 文件中。")
import pandas as pd
import numpy as np

# 定义文件路径
excel_file = 'item_with_openrank.xlsx'  # 请替换为你的Excel文件名
sheet_name = 'Sheet3' # 包含数据的实际工作表名称

# 尝试读取 Excel 文件中的 Sheet3
try:
    df = pd.read_excel(excel_file, sheet_name=sheet_name)
except FileNotFoundError:
    print(f"错误：未找到文件 {excel_file}。请确保文件和脚本在同一目录下。")
    exit()
except ValueError:
    print(f"错误：未找到名为 '{sheet_name}' 的工作表。请检查工作表名称是否正确。")
    exit()

# 获取 K 列的数据，列头为 'subcategory'
if 'subcategory' in df.columns:
    subcategory_series = df['subcategory']
else:
    # 如果没有找到指定列名，使用列索引 K (第11列，索引为10)
    print("警告：未找到 'subcategory' 列，将使用第11列 (索引10)。")
    subcategory_series = df.iloc[:, 10]

# 统计每个技术子领域的数量
# 注意：假设一个单元格只包含一个 subcategory
subcategory_counts = subcategory_series.value_counts()

# 计算总数量
total_subcategories = subcategory_counts.sum()

# 计算每个子领域的占比
subcategory_percentages = (subcategory_counts / total_subcategories) * 100

# 将结果合并到一个 DataFrame
summary_df = pd.DataFrame({
    '数量': subcategory_counts,
    '占比 (%)': subcategory_percentages
})

# 打印结果
print("\n技术子领域数量统计结果：")
print(summary_df)

# 将结果保存到新的 Excel 文件
output_file = 'subcategory_summary.xlsx'
summary_df.to_excel(output_file)
print(f"\n结果已保存到 {output_file} 文件中。")
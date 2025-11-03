import pandas as pd
import clickhouse_connect
import math

# 数据库连接配置
client = clickhouse_connect.get_client(
    host='',
    port='',
    user='',
    password='',
    database=''
)

# 定义要查询的仓库列表
# 将您的地址转换为 owner/repo 格式
repos_to_query = [
    'kubernetes/kubernetes',
    'ceph/ceph',
    'cilium/cilium',
    'keycloak/keycloak',
    'gravitational/teleport'
]

print("开始查询以下仓库的 OpenRank 数据：")
for repo in repos_to_query:
    print(f"- {repo}")

# 构建 SQL 查询，使用 IN 子句一次性查询所有仓库
repo_names_str = ', '.join([f"'{r}'" for r in repos_to_query])

sql_query = f"""
SELECT
  repo_name,
  DATE_TRUNC('month', created_at) AS month,
  TRUNCATE(AVG(openrank), 4) AS monthly_avg_openrank
FROM
  opensource.global_openrank
WHERE
  repo_name IN ({repo_names_str})
  AND created_at >= toStartOfMonth(subtractMonths(now(), 13))
GROUP BY
  repo_name,
  month
ORDER BY
  repo_name,
  month DESC
"""

try:
    print("\n正在执行数据库查询...")
    result = client.query(sql_query)

    # 将查询结果转换为 Pandas DataFrame
    df_result = pd.DataFrame(result.result_rows, columns=result.column_names)

    if not df_result.empty:
        # 关键步骤：将 'month' 列转换为日期时间类型
        df_result['month'] = pd.to_datetime(df_result['month'])

        # 将日期列格式化为 'YYYY-MM' 格式，作为新列名
        df_result['month'] = df_result['month'].dt.strftime('%Y-%m')

        # 核心步骤：使用 pivot_table 将数据透视成您要的格式
        df_pivot = df_result.pivot_table(
            index='repo_name',
            columns='month',
            values='monthly_avg_openrank'
        )

        # 重新排序列，让月份按时间顺序排列
        df_pivot = df_pivot.reindex(sorted(df_pivot.columns), axis=1)

        # 将结果保存到新的 Excel 文件
        output_file_path = 'multi_repo_openrank_summary.xlsx'
        df_pivot.to_excel(output_file_path)
        print("\n查询成功！")
        print(f"结果已保存到新的 Excel 文件: {output_file_path}")
    else:
        print("\n查询完成，但未找到任何数据。")

except Exception as e:
    print("\n查询失败，请检查数据库连接或 SQL 语句。")
    print(f"错误信息：{e}")
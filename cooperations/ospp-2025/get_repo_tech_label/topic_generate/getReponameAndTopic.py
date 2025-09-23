import json

# 输入输出文件路径
input_path = "top1000.json"
output_path = "filtered_repos.jsonl"

# 读取 JSON 文件
with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# 提取并写入新的 JSONL 文件
with open(output_path, "w", encoding="utf-8") as out_file:
    for item in data["top1000"]:
        repo_id = item.get("r.repo_id")
        repo_name = item.get("b.repo_name", "")

        # 解析 topics 字符串为列表
        raw_topics = item.get("a.topics", "")
        try:
            topics_set = eval(raw_topics) if raw_topics else set()
            topics = sorted(list(topics_set))  # 排序可选
        except Exception:
            topics = []

        output_item = {
            "repo_id": repo_id,
            "repo_name": repo_name,
            "topics": topics
        }
        out_file.write(json.dumps(output_item, ensure_ascii=False) + "\n")

import json

# Step 1: 读取 filtered_repos.jsonl，构建 {repo_id: repo_name_tail}
repo_tail_map = {}
with open("ground-truth-topics.jsonl", "r", encoding="utf-8") as f:
    for line in f:
        obj = json.loads(line)
        repo_id = obj.get("repo_id")
        repo_name = obj.get("repo_name", "")
        parts = repo_name.split("/")
        if len(parts) >= 2:
            repo_tail_map[repo_id] = parts[1]

# Step 2: 修改 predicted_topics.jsonl
with open("predicted_topics.jsonl", "r", encoding="utf-8") as fin, \
     open("updated_predicted_topics.jsonl", "w", encoding="utf-8") as fout:

    for line in fin:
        obj = json.loads(line)
        repo_id = obj.get("repo_id")
        topics = obj.get("topics", [])
        # 移除 "open-source"
        topics = [t for t in topics if t != "open-source"]

        if repo_id in repo_tail_map:
            tail = repo_tail_map[repo_id]
            if tail not in topics:
                topics.insert(0, tail)  # 插到最前
                obj["topics"] = topics

        fout.write(json.dumps(obj, ensure_ascii=False) + "\n")

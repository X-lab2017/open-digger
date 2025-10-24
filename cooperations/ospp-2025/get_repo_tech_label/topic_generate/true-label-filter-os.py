import json
import nltk
from nltk.stem import WordNetLemmatizer

# 初始化词形还原器
lemmatizer = WordNetLemmatizer()

# 确保 WordNet 数据可用
# nltk.download('wordnet', quiet=True)
# nltk.download('omw-1.4', quiet=True)

def normalize_topics(topics):
    seen_lemmas = {}
    result = []
    for topic in topics:
        if topic == "open-source":
            continue  # 去除 open-source
        lemma = lemmatizer.lemmatize(topic.lower())
        if lemma not in seen_lemmas:
            seen_lemmas[lemma] = topic  # 保留第一个原词
            result.append(topic)
    return result

# 处理文件
with open("filtered_repos.jsonl", "r", encoding="utf-8") as fin, \
     open("normalized_repos.jsonl", "w", encoding="utf-8") as fout:
    for line in fin:
        obj = json.loads(line)
        topics = obj.get("topics", [])
        obj["topics"] = normalize_topics(topics)
        fout.write(json.dumps(obj, ensure_ascii=False) + "\n")

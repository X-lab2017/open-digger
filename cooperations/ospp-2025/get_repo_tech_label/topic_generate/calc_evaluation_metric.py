import json
import ast
import re
from typing import Dict, Set, Optional
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet
import nltk

# nltk.download('wordnet', quiet=True)
# nltk.download('omw-1.4', quiet=True)

lemmatizer = WordNetLemmatizer()
def normalize_topic(topic: str) -> str:
    # 小写化、去标点、词形还原
    topic = topic.lower()
    topic = re.sub(r"[-_]", "", topic)  # 去掉 - 和 _
    topic = lemmatizer.lemmatize(topic) # 词形还原
    return topic

def normalize_set(topic_set: Set[str]) -> Set[str]:
    return set(normalize_topic(t) for t in topic_set)

def load_predictions(path: str, top_k: Optional[int] = None) -> Dict[str, Set[str]]:
    predictions = {}
    with open(path, 'r') as f:
        for line in f:
            data = json.loads(line)
            repo_id = data["repo_id"]
            topics = data["topics"]
            if top_k is not None:
                topics = topics[:top_k]
            predictions[repo_id] = normalize_set(set(topics))
    return predictions


def load_ground_truth(path: str) -> Dict[str, Set[str]]:
    ground_truth = {}
    with open(path, 'r') as f:
        for line in f:
            data = json.loads(line)
            repo_id = data["repo_id"]
            topics = data["topics"]
            ground_truth[repo_id] = normalize_set(set(topics))
    return ground_truth


def compute_macro_metrics_fixed_denominator(
        y_true_dict: Dict[str, Set[str]],
        y_pred_dict: Dict[str, Set[str]],
        topk,
        verbose: bool = False
):
    precisions = []
    recalls = []
    f1s = []
    successRates = []

    common_repo_ids = set(y_true_dict.keys()) & set(y_pred_dict.keys())

    for repo_id in common_repo_ids:
        true_set = y_true_dict[repo_id]
        pred_set = y_pred_dict[repo_id]

        tp = len(true_set & pred_set)

        pred_denom = topk
        true_denom = len(true_set)

        precision = tp / pred_denom if pred_denom > 0 else (1.0 if tp == 0 else 0.0)
        recall = tp / true_denom if true_denom > 0 else (1.0 if tp == 0 else 0.0)
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        sr = 1 if any(t in true_set for t in pred_set) else 0.0

        # if precision != 0.0000:
        precisions.append(precision)
        recalls.append(recall)
        f1s.append(f1)
        successRates.append(sr)

        if verbose and precision == 0.0000:
            print(f"[{repo_id}] Precision: {precision:.4f}, Recall: {recall:.4f}, F1: {f1:.4f}")

    macro_precision = sum(precisions) / len(precisions)
    macro_recall = sum(recalls) / len(recalls)
    macro_f1 = sum(f1s) / len(f1s)
    macro_sr = sum(successRates) / len(successRates)

    return macro_precision, macro_recall, macro_f1, macro_sr


# ========== 用法 ==========
topk = 5  # 设置固定 precision 分母

# 只取前 precision_k 个预测标签
y_pred = load_predictions("updated_predicted_topics.jsonl", top_k=topk)
y_true = load_ground_truth("ground-truth-topics.jsonl")

precision, recall, f1, successRate = compute_macro_metrics_fixed_denominator(
    y_true, y_pred,
    topk = topk,
    verbose=True
)

print("\n===== Final Macro Scores =====")
print(f"Fixed Macro Precision (k={topk}): {precision:.4f}")
print(f"Fixed Macro Recall    (k={topk}):    {recall:.4f}")
print(f"Fixed Macro F1-score:                  {f1:.4f}")
print(f"Fixed Success Rate    (k={topk}):    {successRate:.4f}")
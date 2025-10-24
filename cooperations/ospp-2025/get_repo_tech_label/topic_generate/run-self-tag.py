import re
import json
import os
from openai import OpenAI
from typing import List, Dict, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import networkx as nx
import numpy as np

INPUT_JSON = 'ZestXML-baseline/bench-metadata.json'         # 输入文件名
OUTPUT_JSONL = 'ZestXML-baseline/predicted_topics.jsonl'  # 输出文件名

client = OpenAI(
    base_url='',
    # sk-xxx替换为自己的key
    api_key=''
)

# ---------- Readme Distillation (Innovative Point 1) ----------

def extract_paragraphs(readme: str) -> Dict[str, str]:
    # Step 1: 清理 HTML 和 reStructuredText 区域
    readme = re.sub(r'\.\. raw:: html.*?(?=\n\S)', '', readme, flags=re.DOTALL)
    readme = re.sub(r'\.\. _.*?: .*', '', readme)  # 删除链接定义

    # Step 2: 尝试按星号标题结构分段
    headers = re.findall(r"(?<=\n)([A-Z][A-Za-z \-/]+)\n\*{3,}", readme)
    sections = re.split(r"\n[A-Z][A-Za-z \-/]+\n\*{3,}", readme)

    if len(sections) <= 1:
        # 回退策略：按两个换行符段落分割
        sections = re.split(r"\n\s*\n", readme.strip())
        headers = [f"Paragraph {i + 1}" for i in range(len(sections))]
    # 清理空段落并对齐 headers
    mapping = {}
    for i, content in enumerate(sections):
        content = content.strip()
        if not content:
            continue
        title = headers[i] if i < len(headers) else f"Section {i + 1}"
        mapping[title.strip()] = content.strip()

    return mapping


def rank_sections_by_description(paragraphs: Dict[str, str], description: str, top_n: int = 5) -> List[str]:
    # TF-IDF on description + paragraphs
    docs = [description] + list(paragraphs.values())
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf = vectorizer.fit_transform(docs)
    desc_vec = tfidf[0]
    sims = cosine_similarity(desc_vec, tfidf[1:]).flatten()
    scored = sorted(zip(paragraphs.keys(), sims), key=lambda x: x[1], reverse=True)
    return [key for key, _ in scored[:top_n]]


def extractive_summary(text: str, num_sentences: int = 2) -> str:
    # Simple TextRank extractive
    sentences = re.split(r'(?<=[.!?]) +', text)
    n = len(sentences)
    if n <= num_sentences:
        return text
    # vectorize sentences
    vec = TfidfVectorizer(stop_words='english').fit_transform(sentences)
    sim_mat = cosine_similarity(vec)
    nx_graph = nx.from_numpy_array(sim_mat)
    scores = nx.pagerank(nx_graph)
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    selected = sorted([idx for idx, _ in ranked[:num_sentences]])
    return ' '.join([sentences[i] for i in selected])


def distill_readme(readme: str, description: str) -> str:
    paras = extract_paragraphs(readme)
    top_headers = rank_sections_by_description(paras, description)
    summary_sentences = []
    for hdr in top_headers:
        summary_sentences.append(extractive_summary(paras[hdr]))
    return ' '.join(summary_sentences)

# ---------- Multi-View Prompting and Fusion (Innovative Point 2) ----------

def call_llm(prompt: str) -> List[str]:
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    text = resp.choices[0].message.content.strip()
    # expect Python-like list
    try:
        topics = eval(text)
        if isinstance(topics, list):
            return [t.strip() for t in topics]
    except Exception:
        return [t.strip() for t in re.split(r'[\n,]+', text) if t.strip()]


def generate_candidates(name: str, description: str, summary: str) -> Dict[str, List[str]]:
    prompts = {
        'name': f"Based only on the repository name `{name}`, list 2-3 likely GitHub topics (lowercase, hyphen-separated). The output should be a comma-separated list of topics only. Do not include any explanation or numbering.",  # weight 0.2
        'description': f"Based only on the repository description `{description}`, list 5-7 relevant GitHub topics (lowercase, hyphen-separated).The output should be a comma-separated list of topics only. Do not include any explanation or numbering.",  # weight 0.5
        'summary': f"Based on the distilled README summary below, list 5-7 relevant GitHub topics (lowercase, hyphen-separated). The output should be a comma-separated list of topics only. Do not include any explanation or numbering. \n{summary}"
    }
    return {view: call_llm(p) for view, p in prompts.items()}


def fuse_topics(candidates: Dict[str, List[str]], weights: Dict[str, float], top_k: int = 10) -> List[Tuple[str, float]]:
    score_map = {}
    for view, topics in candidates.items():
        w = weights.get(view, 0)
        for t in set(topics):
            score_map[t] = score_map.get(t, 0) + w
    ranked = sorted(score_map.items(), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]

def compute_confidence(
    candidates: Dict[str, List[str]]
) -> Dict[str, float]:
    """
    Compute adaptive confidence weights for each view based on embedding consistency.
    Uses OpenAI embeddings to measure intra-view similarity.
    """
    gammas = {}
    for view, tags in candidates.items():
        if len(tags) < 2:
            gammas[view] = 1.0
            continue

        # Fetch embeddings for tags
        resp = client.embeddings.create(
            input=tags,
            model="text-embedding-ada-002"
        )
        embs = np.array([item.embedding for item in resp.data])

        # Cosine similarity matrix
        sim_mat = cosine_similarity(embs)
        # Average similarity excluding diagonal
        n = len(tags)
        sum_sims = sim_mat.sum() - n
        avg_sim = sum_sims / (n * (n - 1))
        gammas[view] = avg_sim

    # Normalize to sum to 1
    total = sum(gammas.values())
    return {view: g / total for view, g in gammas.items()}


# ---------- Main Pipeline ----------

def self_tag_pipeline(name: str, description: str, readme: str) -> List[str]:
    summary = distill_readme(readme, description)
    candidates = generate_candidates(name, description, summary)
    weights = compute_confidence(candidates)
    fused = fuse_topics(candidates, weights)
    return [topic for topic, score in fused]


if __name__ == "__main__":
    # 示例用法
    # candidates = {
    #     "apple": ["fruit", "company", "red"],
    #     "python": ["language", "snake", "script"],
    #     "java": ["coffee", "language", "island"]
    # }
    # result = compute_confidence(candidates)
    # print(result)
    with open(INPUT_JSON, 'r') as f:
        data = json.load(f)

    for repo in data["top1000"][200:500]:
        if repo.get("a.readme_text", "") == '':
            continue
        tags = self_tag_pipeline(repo.get("b.repo_name", ""), repo.get("a.description", ""), repo.get("a.readme_text", ""))
        result = {
            "repo_id": repo.get("r.repo_id"),
            "topics": tags
        }
        # 逐条写入输出文件
        with open(OUTPUT_JSONL, 'a') as out_f:
            out_f.write(json.dumps(result, ensure_ascii=False) + '\n')
    # print("Generated topics:", tags)

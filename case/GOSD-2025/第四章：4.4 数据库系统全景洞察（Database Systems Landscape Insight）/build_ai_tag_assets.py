import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

IN_METRICS   = "repo_metrics.csv"
IN_SERIES    = "aligned_series.csv"
IN_TAG_XLSX  = "ai_tagged_projectsv3.xlsx"
IN_LEADERS   = "leaders.csv"  # optional

OUT_DIR          = "out_ai"
OUT_JOINED       = os.path.join(OUT_DIR, "metrics_with_ai_tag.csv")
OUT_SUMMARY      = os.path.join(OUT_DIR, "ai_tag_summary.csv")
OUT_QUAD_SUMMARY = os.path.join(OUT_DIR, "ai_tag_quadrant_summary.csv")
OUT_MISSING_TAGS = os.path.join(OUT_DIR, "missing_ai_tags.csv")

FIG_OR_BOX   = os.path.join(OUT_DIR, "ai_or_momentum_box.png")
FIG_POP_BOX  = os.path.join(OUT_DIR, "ai_pop_momentum_box.png")
FIG_TAG_BAR  = os.path.join(OUT_DIR, "ai_tag_counts_bar.png")
FIG_QUAD_BAR = os.path.join(OUT_DIR, "ai_tag_quadrant_share.png")
FIG_BOX_2x2  = os.path.join(OUT_DIR, "ai_tag_box_2x2.png")

AI_TAG_COL_CANON = "ai_tag_canon" 
AI_TAG_ORDER_PREF = ["AI-centric", "AI-augmented", "General", "Unknown"]

def _norm_name(s: str) -> str:
    if pd.isna(s):
        return ""
    return str(s).strip().lower()

def _canon_tag(x):
    if pd.isna(x):
        return "Unknown"
    v = str(x).strip().lower()
    mapping = {
        "ai-centric": "AI-centric", "ai centric": "AI-centric", "ai_centric": "AI-centric",
        "ai-augmented": "AI-augmented", "ai augmented": "AI-augmented", "ai_augmented": "AI-augmented",
        "general": "General", "none": "General", "non-ai": "General",
        "unknown": "Unknown", "": "Unknown"
    }
    if v in mapping: return mapping[v]
    if "centric" in v:  return "AI-centric"
    if "augment" in v:  return "AI-augmented"
    if v in ("gen", "normal", "default"): return "General"
    return "Unknown"

def compute_r3_p9_momentum(series_df: pd.DataFrame) -> pd.DataFrame:
    df = series_df.copy()
    if df["month"].dtype != "datetime64[ns]":
        df["month"] = pd.to_datetime(df["month"], errors="coerce")
    df = df.dropna(subset=["full_name_lc"]).copy()
    df["full_name_lc"] = df["full_name_lc"].map(_norm_name)

    def _one_repo(g: pd.DataFrame) -> pd.Series:
        g = g.sort_values("month")
        if len(g) >= 12:
            g = g.iloc[-12:].copy()
        if len(g) < 12:
            prev9_or = np.nan; recent3_or = np.nan
            prev9_pop = np.nan; recent3_pop = np.nan
        else:
            prev9_or    = g.iloc[:9]["openrank"].astype(float).mean()
            recent3_or  = g.iloc[9:]["openrank"].astype(float).mean()
            prev9_pop   = g.iloc[:9]["popularity"].astype(float).mean()
            recent3_pop = g.iloc[9:]["popularity"].astype(float).mean()

        def _mom(prev9, recent3):
            if prev9 is None or (isinstance(prev9, float) and (np.isnan(prev9) or prev9 == 0)):
                return np.nan
            return (recent3 - prev9) / prev9

        return pd.Series({
            "full_name_lc": g["full_name_lc"].iloc[-1],
            "full_name":    g["full_name"].iloc[-1] if "full_name" in g.columns and pd.notna(g["full_name"].iloc[-1]) else np.nan,
            "dbms_name":    g["dbms_name"].iloc[-1] if "dbms_name" in g.columns and pd.notna(g["dbms_name"].iloc[-1]) else np.nan,
            "or_prev9_avg": prev9_or,
            "or_recent3_avg": recent3_or,
            "openrank_momentum": _mom(prev9_or, recent3_or),
            "pop_prev9_avg": prev9_pop,
            "pop_recent3_avg": recent3_pop,
            "popularity_momentum": _mom(prev9_pop, recent3_pop),
            "months_used": len(g)
        })

    rows = []
    for _, g in df.groupby("full_name_lc"):
        rows.append(_one_repo(g))
    out = pd.DataFrame(rows)
    return out

def safe_read_ai_tags(xlsx_path: str) -> pd.DataFrame:
    xdf = pd.read_excel(xlsx_path, engine="openpyxl")
    cols = {c.strip().lower(): c for c in xdf.columns}
    name_col = None
    for k in ["github_full_name", "full_name", "repo", "project", "repository"]:
        if k in cols: name_col = cols[k]; break
    if not name_col:
        raise ValueError(" AI 标签表中未找到项目名列（需要 github_full_name/full_name/repo/project/repository）。")
    tag_col = None
    for k in ["ai-tag", "ai_tag", "tag", "label"]:
        if k in cols: tag_col = cols[k]; break
    if not tag_col:
        raise ValueError(" AI 标签表中未找到标签列（需要 AI-tag/ai_tag/tag/label）。")
    out = xdf[[name_col, tag_col]].copy()
    out["full_name_lc"] = out[name_col].map(_norm_name)
    out[AI_TAG_COL_CANON] = out[tag_col].map(_canon_tag)
    out = out[["full_name_lc", AI_TAG_COL_CANON]]
    out = out.dropna(subset=["full_name_lc"]).drop_duplicates("full_name_lc")
    return out

def _robust_ylim(values, symmetric=False, ql=0.02, qh=0.98, pad=0.08):
    v = pd.Series(values).astype(float)
    v = v.replace([np.inf, -np.inf], np.nan).dropna()
    if v.empty:
        return None
    lo = float(v.quantile(ql))
    hi = float(v.quantile(qh))
    if symmetric:
        m = max(abs(lo), abs(hi))
        if m == 0: m = 1.0
        return (-m*(1+pad), m*(1+pad))
    else:
        span = hi - lo
        if span == 0: span = max(abs(hi), 1.0)
        return (lo - span*pad, hi + span*pad)

def _levels_present(df: pd.DataFrame):
    counts = df[AI_TAG_COL_CANON].value_counts()
    levels = [t for t in AI_TAG_ORDER_PREF if t in counts.index and counts[t] > 0]
    return levels

def draw_box_by_tag(df: pd.DataFrame, value_col: str, title: str, out_png: str, levels=None):
    sub = df[[AI_TAG_COL_CANON, value_col]].dropna()
    if levels is None:
        levels = _levels_present(df)
    data = [sub[sub[AI_TAG_COL_CANON] == t][value_col].values for t in levels]
    plt.figure(figsize=(8, 5))
    bp = plt.boxplot(data, tick_labels=levels, showfliers=True)
    symmetric = ("momentum" in value_col.lower())
    all_vals = np.concatenate([d for d in data if len(d) > 0]) if any(len(d)>0 for d in data) else np.array([])
    yl = _robust_ylim(all_vals, symmetric=symmetric)
    if yl: plt.ylim(*yl)
    plt.title(title)
    plt.ylabel(value_col)
    plt.tight_layout()
    plt.savefig(out_png, dpi=300)
    plt.close()

def draw_counts_bar(df: pd.DataFrame, out_png: str, levels=None):
    if levels is None:
        levels = _levels_present(df)
    ct = df[AI_TAG_COL_CANON].value_counts().reindex(levels, fill_value=0)
    plt.figure(figsize=(7, 4))
    plt.bar(ct.index.tolist(), ct.values.tolist())
    plt.title("Project count by AI tag")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(out_png, dpi=300)
    plt.close()

def draw_quadrant_share_bar(quad_df: pd.DataFrame, out_png: str, levels=None):
    qmap = {
        "leaders": "Leaders", "leaders（双高）": "Leaders", "leaders (double high)": "Leaders",
        "market_strong_community_weak_市场强社区弱": "Market-strong / Community-weak",
        "community_strong_market_weak_社区强市场弱": "Community-strong / Market-weak",
        "laggards_市场弱且社区弱": "Laggards",
    }
    q = quad_df.copy()
    q["quadrant_norm"] = q["quadrant"].astype(str).map(lambda x: qmap.get(x, x))
    if levels is None:
        levels = _levels_present(q.rename(columns={"ai_tag_canon": AI_TAG_COL_CANON}))
    piv = (q.groupby([AI_TAG_COL_CANON, "quadrant_norm"])
             .size().unstack(fill_value=0)
             .reindex(levels, fill_value=0))
    shares = piv.div(piv.sum(axis=1).replace(0, np.nan), axis=0)

    plt.figure(figsize=(9, 5))
    bottom = np.zeros(len(shares))
    x = np.arange(len(shares.index))
    for col in shares.columns:
        plt.bar(x, shares[col].values, bottom=bottom, label=col)
        bottom = bottom + shares[col].values
    plt.xticks(x, shares.index.tolist())
    plt.ylabel("Share")
    plt.title("Quadrant share by AI tag")
    plt.legend(fontsize=8, loc="upper right")
    plt.tight_layout()
    plt.savefig(out_png, dpi=300)
    plt.close()

def draw_box_2x2(df: pd.DataFrame, out_png: str, levels=None):
    if levels is None:
        levels = _levels_present(df)

    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    def _box(ax, col, title, symmetric=False):
        sub = df[[AI_TAG_COL_CANON, col]].dropna()
        data = [sub[sub[AI_TAG_COL_CANON] == t][col].values for t in levels]
        ax.boxplot(data, tick_labels=levels, showfliers=True)
        yl = _robust_ylim(
            np.concatenate([d for d in data if len(d) > 0]) if any(len(d)>0 for d in data) else np.array([]),
            symmetric=symmetric
        )
        if yl: ax.set_ylim(*yl)
        ax.set_title(title, fontsize=10)
        ax.set_ylabel(col)

    _box(axes[0,0], "openrank_momentum",   "OpenRank momentum (R3 vs P9)", symmetric=True)
    _box(axes[0,1], "popularity_momentum","DB-Engines momentum (R3 vs P9)", symmetric=True)
    if "or_avg" in df.columns:
        _box(axes[1,0], "or_avg", "OpenRank average (window)", symmetric=False)
    else:
        axes[1,0].text(0.5, 0.5, "or_avg not found", ha="center", va="center"); axes[1,0].axis('off')
    if "pop_avg" in df.columns:
        _box(axes[1,1], "pop_avg", "DB-Engines average (window)", symmetric=False)
    else:
        axes[1,1].text(0.5, 0.5, "pop_avg not found", ha="center", va="center"); axes[1,1].axis('off')

    plt.tight_layout()
    plt.savefig(out_png, dpi=300)
    plt.close()


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # 1) metrics
    if not os.path.exists(IN_METRICS):
        raise FileNotFoundError(f"Missing {IN_METRICS}")
    m = pd.read_csv(IN_METRICS)
    if "full_name_lc" not in m.columns:
        m["full_name_lc"] = m["full_name"].map(_norm_name) if "full_name" in m.columns else ""
    else:
        m["full_name_lc"] = m["full_name_lc"].map(_norm_name)

    # 2) AI tags
    if not os.path.exists(IN_TAG_XLSX):
        raise FileNotFoundError(f"Missing {IN_TAG_XLSX}")
    tags = safe_read_ai_tags(IN_TAG_XLSX)

    # 3) momentum (R3/P9)
    if not os.path.exists(IN_SERIES):
        raise FileNotFoundError(f"Missing {IN_SERIES} (needed to compute R3/P9 momentum)")
    s = pd.read_csv(IN_SERIES)
    mom = compute_r3_p9_momentum(s)

    # 4) join
    base = (m.merge(mom[["full_name_lc","openrank_momentum","popularity_momentum"]],
                    on="full_name_lc", how="left")
              .merge(tags, on="full_name_lc", how="left"))

    # 缺失标签提示
    missing = base[base[AI_TAG_COL_CANON].isna()][["full_name_lc","full_name"]].copy()
    if len(missing) > 0:
        missing.to_csv(OUT_MISSING_TAGS, index=False, encoding="utf-8")
        print(f" Found {len(missing)} repos without AI tag. Saved: {OUT_MISSING_TAGS}")

    # 标准化 + 动态类别集合
    base[AI_TAG_COL_CANON] = base[AI_TAG_COL_CANON].fillna("Unknown").map(_canon_tag)
    levels = _levels_present(base) 

    # 5) save joined
    base.to_csv(OUT_JOINED, index=False, encoding="utf-8")
    print(f" Saved: {OUT_JOINED} ({len(base)} rows)")

    # 6) summary (只按存在的 levels 输出，不含 Unknown 时自动剔除)
    def _pos_share(x):
        x = x.dropna()
        return (x > 0).mean() if len(x) else np.nan

    grp = base.groupby(AI_TAG_COL_CANON, dropna=False)
    summary = pd.DataFrame({
        "count": grp.size(),
        "or_avg_median": grp["or_avg"].median(numeric_only=True),
        "pop_avg_median": grp["pop_avg"].median(numeric_only=True),
        "openrank_momentum_median": grp["openrank_momentum"].median(numeric_only=True),
        "popularity_momentum_median": grp["popularity_momentum"].median(numeric_only=True),
        "openrank_momentum_pos_share": grp["openrank_momentum"].apply(_pos_share),
        "popularity_momentum_pos_share": grp["popularity_momentum"].apply(_pos_share),
    }).reindex(levels)
    summary.to_csv(OUT_SUMMARY, index=True, encoding="utf-8")
    print(f" Saved: {OUT_SUMMARY}")

    # 7) figures
    draw_box_by_tag(base, "openrank_momentum",
                    "OpenRank momentum (Recent-3 vs Prev-9) by AI tag",
                    FIG_OR_BOX, levels=levels)
    print(f" Saved: {FIG_OR_BOX}")

    draw_box_by_tag(base, "popularity_momentum",
                    "DB-Engines popularity momentum (Recent-3 vs Prev-9) by AI tag",
                    FIG_POP_BOX, levels=levels)
    print(f" Saved: {FIG_POP_BOX}")

    draw_counts_bar(base, FIG_TAG_BAR, levels=levels)
    print(f" Saved: {FIG_TAG_BAR}")

    draw_box_2x2(base, FIG_BOX_2x2, levels=levels)
    print(f" Saved: {FIG_BOX_2x2}")

    # 8) quadrant share
    if os.path.exists(IN_LEADERS):
        q = pd.read_csv(IN_LEADERS)
        if "full_name_lc" not in q.columns:
            if "full_name" in q.columns:
                q["full_name_lc"] = q["full_name"].map(_norm_name)
            else:
                raise ValueError("leaders.csv needs full_name or full_name_lc")
        else:
            q["full_name_lc"] = q["full_name_lc"].map(_norm_name)

        q = q.merge(tags, on="full_name_lc", how="left")
        q[AI_TAG_COL_CANON] = q[AI_TAG_COL_CANON].fillna("Unknown").map(_canon_tag)
        q[["full_name_lc","quadrant",AI_TAG_COL_CANON]].to_csv(OUT_QUAD_SUMMARY, index=False, encoding="utf-8")
        print(f" Saved: {OUT_QUAD_SUMMARY}")

        draw_quadrant_share_bar(q[[AI_TAG_COL_CANON,"quadrant"]], FIG_QUAD_BAR, levels=levels)
        print(f" Saved: {FIG_QUAD_BAR}")
    else:
        print(" leaders.csv not found: skip quadrant-by-AI-tag outputs.")

    # 9) preview
    print("\nSummary (preview):")
    print(summary.fillna("").to_string())


if __name__ == "__main__":
    main()


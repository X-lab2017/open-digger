import argparse
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
from matplotlib.patches import Rectangle

FIGSIZE = (13, 8)          # inches
POINT_SIZE = 100
POINT_ALPHA = 0.90
POINT_EDGE = 0.7
TEXT_SIZE = 8
ARROW_LW = 0.5
USE_GRID = True

SHADE_QUADS = True         # subtle quadrant background
SHADE_ALPHA = 0.06
QUAD_LABELS = True         # corner captions
QUAD_LABEL_SIZE = 10
QUAD_LABEL_ALPHA = 0.85
QUAD_LABEL_WEIGHT = "bold"
LABEL_NW = "Community-strong / Market-weak"
LABEL_NE = "Leaders (Market- & Community-strong)"
LABEL_SW = "Laggards (Market- & Community-weak)"
LABEL_SE = "Market-strong / Community-weak"

# adjustText parameters — EXACTLY as baseline
ADJ_LIM = 300
ADJ_EXPAND_PT = 1.05
ADJ_EXPAND_TXT = 1.15
ADJ_FORCE_TEXT = (0.05, 0.05)
ADJ_FORCE_POINTS = (0.10, 0.10)

AI_TAG_COL = "ai_tag_canon"
AI_TAG_LEVELS = ["AI-centric", "AI-augmented", "General", "Unknown"]
AI_TAG_PALETTE = {
    "AI-centric":   "#1b9e77",  
    "AI-augmented": "#7570b3",  
    "General":      "#d95f02",  
    "Unknown":      "#7f7f7f",  
}

def _norm_name(s: str) -> str:
    if pd.isna(s): return ""
    return str(s).strip().lower()

def _canon_tag(x):
    if pd.isna(x): return "Unknown"
    v = str(x).strip().lower()
    mapping = {
        "ai-centric":"AI-centric","ai centric":"AI-centric","ai_centric":"AI-centric",
        "ai-augmented":"AI-augmented","ai augmented":"AI-augmented","ai_augmented":"AI-augmented",
        "general":"General","none":"General","non-ai":"General",
        "unknown":"Unknown","":"Unknown"
    }
    if v in mapping: return mapping[v]
    if "centric" in v:  return "AI-centric"
    if "augment" in v:  return "AI-augmented"
    if v in ("gen","normal","default"): return "General"
    return "Unknown"

def _load_ai_tags(xlsx_path: Path) -> pd.DataFrame:
    xdf = pd.read_excel(xlsx_path, engine="openpyxl")
    cols = {c.strip().lower(): c for c in xdf.columns}
    name_col = None
    for k in ["github_full_name","full_name","repo","project","repository"]:
        if k in cols: name_col = cols[k]; break
    if not name_col:
        raise ValueError("AI 标签表缺少项目名列（github_full_name/full_name/repo/project/repository）")
    tag_col = None
    for k in ["ai-tag","ai_tag","tag","label"]:
        if k in cols: tag_col = cols[k]; break
    if not tag_col:
        raise ValueError("AI 标签表缺少标签列（AI-tag/ai_tag/tag/label）")

    out = xdf[[name_col, tag_col]].copy()
    out["full_name_lc"] = out[name_col].map(_norm_name)
    out[AI_TAG_COL] = out[tag_col].map(_canon_tag)
    return out[["full_name_lc", AI_TAG_COL]].dropna().drop_duplicates("full_name_lc")


def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument("--or-csv", default="out_openrank/included_monthly_series.csv")
    ap.add_argument("--db-csv", default="included_monthly_series_db.csv")
    ap.add_argument("--start", default="2024-10-01")
    ap.add_argument("--end",   default="2025-09-01")
    ap.add_argument("--agg", choices=["mean","median"], default="mean")
    ap.add_argument("--x-th", default="median", help="threshold on X (original scale; numeric or 'median')")
    ap.add_argument("--y-th", default="median", help="threshold on Y (original scale; numeric or 'median')")
    ap.add_argument("--log-base", choices=["10","e"], default="10")
    ap.add_argument("--eps", type=float, default=1e-6)
    ap.add_argument("--out", default="out_2d/points_scatter_log3.png")
    ap.add_argument("--dpi", type=int, default=300)
    ap.add_argument("--ai-tags-xlsx", default="ai_tagged_projectsv3.xlsx",
                help="Excel file with AI tags to color points")
    return ap.parse_args()


def _ensure(p: Path):
    if not p.exists():
        raise FileNotFoundError(f"Missing file: {p.as_posix()}")


def _agg(s: pd.Series, how: str):
    return s.mean() if how == "mean" else s.median()


def load_or(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    need = {"created_at","full_name","openrank_monthly"}
    if not need.issubset(df.columns):
        raise ValueError("included_monthly_series.csv must contain: created_at, full_name, openrank_monthly")
    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
    df["full_name_lc"] = df["full_name"].astype(str).str.lower().str.strip()
    return df


def load_db(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    need = {"full_name","dbms_name","slug","date","score"}
    if not need.issubset(df.columns):
        raise ValueError("included_monthly_series_db.csv must contain: full_name, dbms_name, slug, date, score")
    df["date"] = pd.to_datetime(df["date"], format="%Y-%m", errors="coerce")
    df["full_name_lc"] = df["full_name"].astype(str).str.lower().str.strip()
    return df


def resolve_th(val, series: pd.Series):
    if isinstance(val, str) and val.strip().lower() == "median":
        return float(series.median())
    try:
        return float(val)
    except Exception:
        return float(series.median())


def main():
    args = parse_args()
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    or_path = Path(args.or_csv)
    db_path = Path(args.db_csv)
    _ensure(or_path); _ensure(db_path)

    or_df = load_or(or_path)
    db_df = load_db(db_path)

    start_ts = pd.to_datetime(args.start)
    end_ts   = pd.to_datetime(args.end)

    or_win = or_df[(or_df["created_at"] >= start_ts) & (or_df["created_at"] <= end_ts)].copy()
    db_win = db_df[(db_df["date"]       >= start_ts) & (db_df["date"]       <= end_ts)].copy()

    # aggregate (repo-level)
    or_g = (or_win.groupby("full_name_lc", as_index=False)
                 .agg(or_avg=("openrank_monthly", lambda s: _agg(s, args.agg)),
                      or_months=("openrank_monthly","count")))
    db_g = (db_win.groupby("full_name_lc", as_index=False)
                 .agg(pop_avg=("score", lambda s: _agg(s, args.agg)),
                      pop_months=("score","count")))

    base = (or_g.merge(db_g, on="full_name_lc", how="inner")
               .merge(or_df[["full_name_lc","full_name"]].drop_duplicates(), on="full_name_lc", how="left")
               .merge(db_df[["full_name_lc","dbms_name"]].drop_duplicates(), on="full_name_lc", how="left"))
    base["label"] = base["dbms_name"].fillna(base["full_name"])
    # merge AI tags
    tag_path = Path(getattr(args, "ai_tags_xlsx", "ai_tagged_projectsv3.xlsx"))
    if tag_path.exists():
        tags_df = _load_ai_tags(tag_path)
        base = base.merge(tags_df, on="full_name_lc", how="left")
    else:
        base[AI_TAG_COL] = "Unknown"
    base[AI_TAG_COL] = base[AI_TAG_COL].fillna("Unknown")

    x_th_raw = resolve_th(args.x_th, base["pop_avg"])
    y_th_raw = resolve_th(args.y_th, base["or_avg"])

    eps = float(args.eps)
    if args.log_base == "10":
        logf = np.log10
        xlabel = "DB-Engines Popularity (log10, average over window)"
        ylabel = "GitHub OpenRank (log10, average over window)"
    else:
        logf = np.log
        xlabel = "DB-Engines Popularity (ln, average over window)"
        ylabel = "GitHub OpenRank (ln, average over window)"

    base["x"] = logf(base["pop_avg"].astype(float) + eps)
    base["y"] = logf(base["or_avg"].astype(float) + eps)
    x_th = logf(x_th_raw + eps)
    y_th = logf(y_th_raw + eps)

    from matplotlib import rcParams
    rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial Unicode MS", "Noto Sans CJK SC", "SimHei", "Microsoft YaHei"]
    rcParams["axes.unicode_minus"] = False

    fig = plt.figure(figsize=FIGSIZE, dpi=args.dpi, facecolor="white")
    ax = plt.gca()

    handles = []
    present_levels = [t for t in AI_TAG_LEVELS if (AI_TAG_COL in base.columns) and (base[AI_TAG_COL] == t).any()]
    if not present_levels: 
        sc = ax.scatter(base["x"], base["y"], s=POINT_SIZE, alpha=POINT_ALPHA,
                        edgecolors="white", linewidths=POINT_EDGE, color="#1f77b4")
        handles.append(sc)
    else:
        for t in present_levels:
            m = (base[AI_TAG_COL] == t)
            sc = ax.scatter(
                base.loc[m, "x"], base.loc[m, "y"],
                s=POINT_SIZE, alpha=POINT_ALPHA,
                edgecolors="white", linewidths=POINT_EDGE,
                color=AI_TAG_PALETTE.get(t, "#7f7f7f"), label=t
            )
            handles.append(sc)

    if handles:
        ax.legend(handles=handles, title="AI tag",
                  loc="center left", bbox_to_anchor=(1.02, 0.5),
                  frameon=True, fontsize=8, title_fontsize=9)

    if USE_GRID:
        ax.grid(True, linestyle=":", linewidth=0.6, alpha=0.5)
    for spine in ax.spines.values():
        spine.set_linewidth(0.8)
        spine.set_alpha(0.9)

    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.set_title(f"DB-Engines Popularity vs. GitHub OpenRank (log scale, {args.start} to {args.end})",
                 fontsize=12, pad=10)
    ax.margins(x=0.06, y=0.09)

    xmin, xmax = ax.get_xlim()
    ymin, ymax = ax.get_ylim()
    if SHADE_QUADS:
        cNW, cNE, cSW, cSE = ("#e8f1ff", "#eafbea", "#fff3e6", "#f8eaff")
        a = float(SHADE_ALPHA)
        ax.add_patch(Rectangle((xmin, y_th), x_th - xmin, ymax - y_th, facecolor=cNW, alpha=a, zorder=0, lw=0))
        ax.add_patch(Rectangle((x_th,  y_th), xmax - x_th, ymax - y_th, facecolor=cNE, alpha=a, zorder=0, lw=0))
        ax.add_patch(Rectangle((xmin, ymin), x_th - xmin, y_th - ymin, facecolor=cSW, alpha=a, zorder=0, lw=0))
        ax.add_patch(Rectangle((x_th,  ymin), xmax - x_th, y_th - ymin, facecolor=cSE, alpha=a, zorder=0, lw=0))
    ax.axvline(x_th, linestyle="--", linewidth=1.0, color="#4a6fa5")
    ax.axhline(y_th, linestyle="--", linewidth=1.0, color="#4a6fa5")

    if QUAD_LABELS:
        halo_c = [pe.withStroke(linewidth=2.0, foreground="white")]
        kw = dict(fontsize=QUAD_LABEL_SIZE, alpha=QUAD_LABEL_ALPHA,
                  weight=QUAD_LABEL_WEIGHT, color="#2f2f2f",
                  path_effects=halo_c, zorder=2)
        ax.text(0.02, 0.98, LABEL_NW, transform=ax.transAxes, ha="left",  va="top",    **kw)
        ax.text(0.98, 0.98, LABEL_NE, transform=ax.transAxes, ha="right", va="top",    **kw)
        ax.text(0.02, 0.02, LABEL_SW, transform=ax.transAxes, ha="left",  va="bottom", **kw)
        ax.text(0.98, 0.02, LABEL_SE, transform=ax.transAxes, ha="right", va="bottom", **kw)

    texts = []
    halo = [pe.withStroke(linewidth=2.2, foreground="white")]
    use_adjust = False
    try:
        from adjustText import adjust_text 
        use_adjust = True
    except Exception:
        use_adjust = False

    if use_adjust:
        for _, r in base.iterrows():
            t = ax.text(r["x"], r["y"], str(r["label"]),
                        fontsize=TEXT_SIZE, zorder=5, path_effects=halo)
            texts.append(t)

        adjust_text(
            texts, x=base["x"].values, y=base["y"].values, ax=ax,
            arrowprops=dict(arrowstyle="-", lw=ARROW_LW, alpha=0.6),
            lim=ADJ_LIM,
            expand=(ADJ_EXPAND_PT, ADJ_EXPAND_TXT),
            force_text=ADJ_FORCE_TEXT,
            force_points=ADJ_FORCE_POINTS
        )
    else:
        offsets = [(8, 6), (8, -6), (-8, 6), (-8, -6), (10, 0), (0, 10), (-10, 0), (0, -10)]
        for i, (_, r) in enumerate(base.iterrows()):
            dx, dy = offsets[i % len(offsets)]
            t = ax.annotate(
                str(r["label"]),
                xy=(r["x"], r["y"]),
                xytext=(dx, dy),
                textcoords="offset points",
                fontsize=TEXT_SIZE,
                ha="left" if dx >= 0 else "right",
                va="bottom" if dy >= 0 else "top",
                arrowprops=dict(arrowstyle="-", lw=ARROW_LW, alpha=0.6),
                zorder=5
            )
            t.set_path_effects(halo)
            texts.append(t)

        fig.canvas.draw()
        renderer = fig.canvas.get_renderer()
        for _ in range(220): 
            moved = False
            bboxes = [t.get_window_extent(renderer).expanded(1.02, 1.08) for t in texts]
            for i in range(len(texts)):
                for j in range(i + 1, len(texts)):
                    bbi, bbj = bboxes[i], bboxes[j]
                    if bbi.overlaps(bbj):
                        dx = (bbi.x1 + bbi.x0)/2 - (bbj.x1 + bbj.x0)/2
                        dy = (bbi.y1 + bbi.y0)/2 - (bbj.y1 + bbj.y0)/2
                        if dx == 0 and dy == 0:
                            dx = 0.5
                        norm = (dx**2 + dy**2) ** 0.5
                        dx, dy = dx / norm, dy / norm
                        for k, sign in [(i, 1), (j, -1)]:
                            x0, y0 = texts[k].get_position()
                            texts[k].set_position((x0 + sign*dx, y0 + sign*dy))
                        moved = True
            if not moved:
                break
            fig.canvas.draw()
            renderer = fig.canvas.get_renderer()

    plt.tight_layout()
    fig.savefig(out_path, dpi=args.dpi)
    plt.close(fig)

    print("Done")
    print(f"  Points: {len(base)}")
    print(f"  Thresholds (original): X={x_th_raw:.4f}, Y={y_th_raw:.4f}")
    print(f"  Output: {out_path.as_posix()}")


if __name__ == "__main__":
    main()

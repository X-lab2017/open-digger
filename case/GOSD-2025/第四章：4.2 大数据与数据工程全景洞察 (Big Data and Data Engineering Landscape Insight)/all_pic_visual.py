import argparse
from pathlib import Path
from textwrap import shorten
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)

def to_numeric(df, cols):
    for c in cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce")

def find_date_col(df: pd.DataFrame):
    cand = [c for c in df.columns if c.lower() in ("created_at","ds","date","month","record_date")]
    if cand:
        return cand[0]
    for c in df.columns:
        try:
            pd.to_datetime(df[c].head(3), errors="raise")
            return c
        except Exception:
            continue
    return None

def find_or_col(df: pd.DataFrame):
    for name in ["openrank","or","value","score"]:
        if name in df.columns:
            return name
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if num_cols:
        return num_cols[0]
    return None

def safe_lower_series(s: pd.Series):
    try:
        return s.astype(str).str.lower()
    except Exception:
        return s

def short_label(s, width=26):
    return shorten(str(s), width=width, placeholder="…")

def format_num(n, digits=1):
    try:
        return f"{float(n):,.{digits}f}"
    except Exception:
        return str(n)

def pick_org_metric_column(org_df: pd.DataFrame):
    preferred = ["sum_or","or_12m_sum","or_sum","total_or","agg_or","value","total"]
    for c in preferred:
        if c in org_df.columns and pd.api.types.is_numeric_dtype(org_df[c]):
            return c
    numeric_cols = org_df.select_dtypes(include=[np.number]).columns.tolist()
    if numeric_cols:
        return numeric_cols[0]
    return None

def plot_inclusion_pie(included_df, excluded_df, out_path: Path):
    total = (len(included_df) if included_df is not None else 0) + (len(excluded_df) if excluded_df is not None else 0)
    if excluded_df is None or excluded_df.empty:
        sizes = [len(included_df), 0, 0]
        labels = ["Included", "Excluded - below threshold", "Excluded - no data"]
    else:
        reason_col = None
        for c in ["reason","exclude_reason","drop_reason"]:
            if c in excluded_df.columns:
                reason_col = c; break
        if reason_col is None:
            reason_col = "reason"
            excluded_df = excluded_df.copy()
            excluded_df[reason_col] = np.where(excluded_df.filter(like="avg").sum(axis=1) <= 50, "avg_le_50", "no_data_in_window")
        low = (excluded_df[reason_col] == "avg_le_50").sum()
        nodata = (excluded_df[reason_col] == "no_data_in_window").sum()
        sizes = [len(included_df), low, nodata]
        labels = ["Included", "Excluded - below threshold", "Excluded - no data"]

    fig, ax = plt.subplots(figsize=(6, 6), dpi=160)
    ax.pie(sizes, labels=labels, autopct=lambda p: f"{p:.1f}%\n({int(round(p*total/100))})", startangle=90)
    ax.set_title("Inclusion vs Exclusion (share & count)")
    plt.tight_layout()
    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)


def plot_category_counts(included_df, out_path: Path):
    if "category_l1" not in included_df.columns:
        return
    counts = included_df["category_l1"].value_counts().sort_values(ascending=True)
    fig, ax = plt.subplots(figsize=(10, 6), dpi=160)
    ax.barh(counts.index, counts.values)
    ax.set_xlabel("Projects (count)")
    ax.set_title("Included projects by Category (L1)")
    for i, v in enumerate(counts.values):
        ax.text(v + 0.3, i, str(v), va="center")
    plt.tight_layout()
    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)

def plot_momentum_bars(included_df, out_top: Path, out_bottom: Path):
    df = included_df.dropna(subset=["or_momentum"]).copy()
    df = df[np.isfinite(df["or_momentum"])]

    # Top10 Rising
    top10 = df.sort_values("or_momentum", ascending=False).head(10)[["full_name","or_momentum","or_12m_avg"]]
    fig, ax = plt.subplots(figsize=(10, 6), dpi=160)
    y = [short_label(x, 36) for x in top10["full_name"]][::-1]
    v = list(top10["or_momentum"])[::-1]
    ax.barh(y, v)
    ax.set_xlabel("Momentum (last 3m vs prev 9m)")
    ax.set_title("Momentum Top 10 (Rising)")
    for i, val in enumerate(v):
        ax.text(val + (0.01 if val>=0 else -0.01), i, f"{val:+.2f}", va="center",
                ha="left" if val>=0 else "right")
    plt.tight_layout()
    fig.savefig(out_top, bbox_inches="tight")
    plt.close(fig)

    # Bottom10 Falling
    bottom10 = df.sort_values("or_momentum", ascending=True).head(10)[["full_name","or_momentum","or_12m_avg"]]
    fig, ax = plt.subplots(figsize=(10, 6), dpi=160)
    y = [short_label(x, 36) for x in bottom10["full_name"]][::-1]
    v = list(bottom10["or_momentum"])[::-1]
    ax.barh(y, v)
    ax.set_xlabel("Momentum (last 3m vs prev 9m)")
    ax.set_title("Momentum Bottom 10 (Falling)")
    for i, val in enumerate(v):
        ax.text(val + (0.01 if val>=0 else -0.01), i, f"{val:+.2f}", va="center",
                ha="left" if val>=0 else "right")
    plt.tight_layout()
    fig.savefig(out_bottom, bbox_inches="tight")
    plt.close(fig)


def plot_momentum_trends(mseries_df, winners, losers, out_top_trends: Path, out_bottom_trends: Path):
    date_col = find_date_col(mseries_df)
    or_col = find_or_col(mseries_df)
    if date_col is None or or_col is None:
        return
    name_col = "full_name" if "full_name" in mseries_df.columns else ("repo" if "repo" in mseries_df.columns else None)
    if name_col is None:
        return

    ms = mseries_df.copy()
    ms[date_col] = pd.to_datetime(ms[date_col], errors="coerce")
    ms = ms.dropna(subset=[date_col]).sort_values([name_col, date_col])

    import matplotlib.dates as mdates
    locator   = mdates.AutoDateLocator(minticks=3, maxticks=6)
    formatter = mdates.ConciseDateFormatter(locator)

    # ----- Rising group -----
    fig, axes = plt.subplots(2, 5, figsize=(16, 6), dpi=160, sharex=True, sharey=False)
    axes = axes.flatten()

    for i, repo in enumerate(winners):
        if i >= len(axes): break
        sub = ms[ms[name_col] == repo]
        axes[i].plot(sub[date_col], sub[or_col], marker="o", linewidth=1.5)
        axes[i].set_title(short_label(repo, 28), fontsize=9)
        axes[i].grid(True, linewidth=0.3, alpha=0.4)
        axes[i].xaxis.set_major_locator(locator)
        axes[i].xaxis.set_major_formatter(formatter)
        axes[i].tick_params(axis="x", labelrotation=0, labelsize=8)
        axes[i].tick_params(axis="y", labelsize=8)

    for j in range(i + 1, len(axes)):
        axes[j].axis("off")

    fig.suptitle("Momentum Top 10 – Monthly OR (Rising)", fontsize=14)
    fig.supylabel("OpenRank (monthly)")
    fig.supxlabel("Month")
    fig.tight_layout(rect=[0, 0.06, 1, 0.92])
    fig.savefig(out_top_trends, bbox_inches="tight")
    plt.close(fig)

    # ----- Falling group -----
    fig, axes = plt.subplots(2, 5, figsize=(16, 6), dpi=160, sharex=True, sharey=False)
    axes = axes.flatten()

    for i, repo in enumerate(losers):
        if i >= len(axes): break
        sub = ms[ms[name_col] == repo]
        axes[i].plot(sub[date_col], sub[or_col], marker="o", linewidth=1.5)
        axes[i].set_title(short_label(repo, 28), fontsize=9)
        axes[i].grid(True, linewidth=0.3, alpha=0.4)
        axes[i].xaxis.set_major_locator(locator)
        axes[i].xaxis.set_major_formatter(formatter)
        axes[i].tick_params(axis="x", labelrotation=0, labelsize=8)
        axes[i].tick_params(axis="y", labelsize=8)

    for j in range(i + 1, len(axes)):
        axes[j].axis("off")

    fig.suptitle("Momentum Bottom 10 – Monthly OR (Falling)", fontsize=14)
    fig.supylabel("OpenRank (monthly)")
    fig.supxlabel("Month")
    fig.tight_layout(rect=[0, 0.06, 1, 0.92])
    fig.savefig(out_bottom_trends, bbox_inches="tight")
    plt.close(fig)

def plot_org_top_bar(org_df, included_df, out_path: Path):
    df = org_df.copy()
    metric_col = pick_org_metric_column(df)
    name_col = "org_login" if "org_login" in df.columns else ("org" if "org" in df.columns else None)
    if metric_col is None or name_col is None:
        if included_df is None or included_df.empty or "org_login" not in included_df.columns:
            return
        g = included_df.groupby("org_login", dropna=True)["or_12m_avg"].sum().reset_index()
        df = g.rename(columns={"or_12m_avg":"total_or","org_login":"org_login"})
        metric_col = "total_or"; name_col = "org_login"

    df = df.sort_values(metric_col, ascending=False).head(15)
    fig, ax = plt.subplots(figsize=(10, 6), dpi=160)
    ax.barh(df[name_col][::-1], df[metric_col][::-1])
    ax.set_xlabel("Aggregated OR (12-month, included only)")
    ax.set_title("Top 15 Organizations by Aggregated OR")
    for i, v in enumerate(df[metric_col][::-1].values):
        ax.text(v + max(df[metric_col])*0.01, i, format_num(v, 0), va="center")
    plt.tight_layout()
    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)


def plot_top10_or_trends(mseries_df, top10_list, out_path: Path):
    date_col = find_date_col(mseries_df)
    or_col = find_or_col(mseries_df)
    if date_col is None or or_col is None:
        return
    name_col = "full_name" if "full_name" in mseries_df.columns else ("repo" if "repo" in mseries_df.columns else None)
    if name_col is None:
        return
    ms = mseries_df.copy()
    ms[date_col] = pd.to_datetime(ms[date_col], errors="coerce")
    ms = ms.dropna(subset=[date_col]).sort_values([name_col, date_col])

    fig, ax = plt.subplots(figsize=(12, 7), dpi=160)
    for repo in top10_list:
        sub = ms[ms[name_col] == repo]
        if sub.empty: continue
        ax.plot(sub[date_col], sub[or_col], marker="o", linewidth=1.2, label=short_label(repo, 22))
    ax.set_title("Top 10 by 12-mo Avg OR – Monthly OR series")
    ax.set_xlabel("Month")
    ax.set_ylabel("OpenRank (monthly)")
    ax.grid(True, linewidth=0.4, alpha=0.4)
    ax.legend(ncol=2, fontsize=8)
    plt.tight_layout()
    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data-dir", default="./out_de_40")
    ap.add_argument("--out-dir", default=".")
    args = ap.parse_args()

    data_dir = Path(args.data_dir)
    out_dir = Path(args.out_dir)
    fig_dir = out_dir / "figures_de_40"

    def read_csv_safe(name):
        p = data_dir / name
        if p.exists():
            return pd.read_csv(p)
        return None

    included = read_csv_safe("included_projects.csv") # 入选项目的统计信息
    excluded = read_csv_safe("excluded_projects.csv") # 淘汰项目的统计信息
    repo_all = read_csv_safe("repo_12m_metrics.csv") # 全量项目的12个月度量
    monthly = read_csv_safe("included_monthly_series.csv") # 入选项目的月度量时间序列
    orgtop = read_csv_safe("org_top.csv") # 组织榜

    if included is not None:
        to_numeric(included, ["or_12m_avg","or_momentum","or_recent3","or_prev9","months_count"])
        if "full_name" in included.columns:
            included["full_name"] = included["full_name"].astype(str)
    if repo_all is not None:
        to_numeric(repo_all, ["or_12m_avg","or_momentum","or_recent3","or_prev9","months_count"])
    if excluded is not None:
        pass

    if included is not None:
        plot_inclusion_pie(included, excluded, fig_dir / "fig_inclusion_pie.png")
        plot_category_counts(included, fig_dir / "fig_category_counts.png")
        plot_momentum_bars(included, fig_dir / "fig_momentum_top10_bar.png", fig_dir / "fig_momentum_bottom10_bar.png")

        winners = included.dropna(subset=["or_momentum"]).sort_values("or_momentum", ascending=False).head(10)["full_name"].tolist()
        losers  = included.dropna(subset=["or_momentum"]).sort_values("or_momentum", ascending=True).head(10)["full_name"].tolist()

        if monthly is not None:
            plot_momentum_trends(monthly, winners, losers,
                                 fig_dir / "fig_momentum_top10_trends.png",
                                 fig_dir / "fig_momentum_bottom10_trends.png")

        top10 = included.sort_values("or_12m_avg", ascending=False).head(10)["full_name"].tolist()
        if monthly is not None:
            plot_top10_or_trends(monthly, top10, fig_dir / "fig_top10_or_trends.png")

    if orgtop is not None or included is not None:
        plot_org_top_bar(orgtop if orgtop is not None else pd.DataFrame(), included, fig_dir / "fig_org_top15_bar.png")


    print("Done.")

if __name__ == "__main__":
    main()

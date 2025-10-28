import os
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

IN_CSV  = "aligned_series.csv"
OUT_CSV = "repo_momentum_r3_p9.csv"
OUT_DIR = "momentum_figs"

def compute_momentum(group: pd.DataFrame) -> pd.Series:
    g = group.sort_values("month")
    if len(g) >= 12:
        g = g.iloc[-12:].copy()
    prev9_or = g.iloc[:9]["openrank"].mean()
    recent3_or = g.iloc[9:]["openrank"].mean()
    prev9_pop = g.iloc[:9]["popularity"].mean()
    recent3_pop = g.iloc[9:]["popularity"].mean()

    or_mom  = np.nan if (prev9_or is None or prev9_or == 0 or np.isnan(prev9_or)) else (recent3_or - prev9_or) / prev9_or
    pop_mom = np.nan if (prev9_pop is None or prev9_pop == 0 or np.isnan(prev9_pop)) else (recent3_pop - prev9_pop) / prev9_pop

    return pd.Series({
        "full_name_lc": g["full_name_lc"].iloc[-1],
        "full_name":    g["full_name"].iloc[-1],
        "dbms_name":    g["dbms_name"].iloc[-1],
        "months":       len(g),
        "openrank_prev9_avg":     prev9_or,
        "openrank_recent3_avg":   recent3_or,
        "openrank_momentum":      or_mom,
        "popularity_prev9_avg":   prev9_pop,
        "popularity_recent3_avg": recent3_pop,
        "popularity_momentum":    pop_mom,
    })

def plot_top_bars(df: pd.DataFrame, mom_col: str, title: str, out_png: str, top_n: int = 12):
    top = df.dropna(subset=[mom_col]).sort_values(mom_col, ascending=False).head(top_n)
    labels = top["dbms_name"].fillna(top["full_name"]).tolist()
    vals = top[mom_col].tolist()

    y = np.arange(len(labels))
    plt.figure(figsize=(10, 6))
    plt.barh(y, vals)
    plt.yticks(y, labels)
    plt.xlabel(f"{mom_col} (ratio)")
    plt.title(title)
    ax = plt.gca()
    ax.invert_yaxis()
    plt.tight_layout()
    plt.savefig(out_png, dpi=300)
    plt.close()

def plot_momentum_scatter(df: pd.DataFrame, out_png: str):
    from matplotlib import rcParams
    import matplotlib.patheffects as pe
    from matplotlib.patches import Rectangle
    rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial Unicode MS", "Noto Sans CJK SC", "SimHei", "Microsoft YaHei"]
    rcParams["axes.unicode_minus"] = False

    x = pd.to_numeric(df["popularity_momentum"], errors="coerce")
    y = pd.to_numeric(df["openrank_momentum"], errors="coerce")
    labels = df["dbms_name"].fillna(df["full_name"]).astype(str)
    m = np.isfinite(x) & np.isfinite(y)
    x, y, labels = x[m].values, y[m].values, labels[m].values

    fig = plt.figure(figsize=(13, 8), dpi=350, facecolor="white")
    ax = plt.gca()

    ax.scatter(x, y, s=100, alpha=0.9, edgecolors="white", linewidths=0.7)

    ax.grid(True, linestyle=":", linewidth=0.6, alpha=0.5)
    for spine in ax.spines.values():
        spine.set_linewidth(0.8); spine.set_alpha(0.9)
    ax.set_xlabel("DB-Engines Popularity Momentum (recent3 vs prev9, ratio)")
    ax.set_ylabel("GitHub OpenRank Momentum (recent3 vs prev9, ratio)")
    ax.set_title("Momentum: DB-Engines Popularity vs GitHub OpenRank (linear, recent3 vs prev9)", fontsize=12, pad=10)
    ax.margins(x=0.06, y=0.09)

    xmin, xmax = ax.get_xlim(); ymin, ymax = ax.get_ylim()
    cNW, cNE, cSW, cSE, a = "#e8f1ff", "#eafbea", "#fff3e6", "#f8eaff", 0.06
    ax.add_patch(Rectangle((xmin, 0),   0 - xmin, ymax - 0, facecolor=cNW, alpha=a, zorder=0, lw=0))
    ax.add_patch(Rectangle((0,    0),   xmax - 0, ymax - 0, facecolor=cNE, alpha=a, zorder=0, lw=0))
    ax.add_patch(Rectangle((xmin, ymin),0 - xmin, 0 - ymin, facecolor=cSW, alpha=a, zorder=0, lw=0))
    ax.add_patch(Rectangle((0,    ymin),xmax - 0, 0 - ymin, facecolor=cSE, alpha=a, zorder=0, lw=0))
    ax.axvline(0, linestyle="--", linewidth=1.0, color="#4a6fa5")
    ax.axhline(0, linestyle="--", linewidth=1.0, color="#4a6fa5")

    halo_c = [pe.withStroke(linewidth=2.0, foreground="white")]
    kw = dict(fontsize=10, alpha=0.85, weight="bold", color="#2f2f2f", path_effects=halo_c, zorder=2)
    ax.text(0.02, 0.98, "Community ↑ / Market ↓", transform=ax.transAxes, ha="left",  va="top",    **kw)
    ax.text(0.98, 0.98, "Both accelerating",      transform=ax.transAxes, ha="right", va="top",    **kw)
    ax.text(0.02, 0.02, "Both declining",         transform=ax.transAxes, ha="left",  va="bottom", **kw)
    ax.text(0.98, 0.02, "Market ↑ / Community ↓", transform=ax.transAxes, ha="right", va="bottom", **kw)

    texts, halo = [], [pe.withStroke(linewidth=2.2, foreground="white")]
    for xi, yi, lab in zip(x, y, labels):
        texts.append(ax.text(xi, yi, lab, fontsize=8, zorder=5, path_effects=halo))

    MAX_DIST_PX = 48
    MIN_LINE_PX = 6 

    try:
        from adjustText import adjust_text
        adjust_text(texts, x=x, y=y, ax=ax, arrowprops=None,
                    lim=300, expand=(1.05, 1.15),
                    force_text=(0.05, 0.05), force_points=(0.10, 0.10))
    except Exception:
        fig.canvas.draw(); renderer = fig.canvas.get_renderer()
        for _ in range(200):
            moved = False
            bboxes = [t.get_window_extent(renderer).expanded(1.02, 1.08) for t in texts]
            for i in range(len(texts)):
                for j in range(i+1, len(texts)):
                    if bboxes[i].overlaps(bboxes[j]):
                        dx = (bboxes[i].x1+bboxes[i].x0)/2 - (bboxes[j].x1+bboxes[j].x0)/2
                        dy = (bboxes[i].y1+bboxes[i].y0)/2 - (bboxes[j].y1+bboxes[j].y0)/2
                        if dx == 0 and dy == 0: dx = 0.5
                        n = (dx*dx+dy*dy)**0.5; dx, dy = dx/n, dy/n
                        x0, y0 = texts[i].get_position(); texts[i].set_position((x0+dx*0.01, y0+dy*0.01))
                        x0, y0 = texts[j].get_position(); texts[j].set_position((x0-dx*0.01, y0-dy*0.01))
                        moved = True
            if not moved: break
            fig.canvas.draw(); renderer = fig.canvas.get_renderer()

    fig.canvas.draw()
    inv = ax.transData.inverted()
    for t, xi, yi in zip(texts, x, y):
        tx, ty = t.get_position()
        if not (np.isfinite(tx) and np.isfinite(ty) and np.isfinite(xi) and np.isfinite(yi)):
            t.set_visible(False); 
            continue
        p_text  = ax.transData.transform((tx, ty))
        p_point = ax.transData.transform((xi, yi))
        dx, dy  = p_text[0]-p_point[0], p_text[1]-p_point[1]
        dist    = (dx*dx + dy*dy) ** 0.5
        if dist > MAX_DIST_PX and dist > 0:
            ratio = MAX_DIST_PX / dist
            new_disp = (p_point[0] + dx*ratio, p_point[1] + dy*ratio)
            new_data = inv.transform(new_disp)
            t.set_position(new_data)

    for t, xi, yi in zip(texts, x, y):
        if not t.get_visible(): continue
        tx, ty = t.get_position()
        if not (np.isfinite(tx) and np.isfinite(ty) and np.isfinite(xi) and np.isfinite(yi)):
            continue
        p_text  = ax.transData.transform((tx, ty))
        p_point = ax.transData.transform((xi, yi))
        dx, dy  = p_text[0]-p_point[0], p_text[1]-p_point[1]
        dist    = (dx*dx + dy*dy) ** 0.5
        if dist >= MIN_LINE_PX:
            ax.annotate("", xy=(xi, yi), xytext=(tx, ty),
                        arrowprops=dict(arrowstyle="-", lw=0.5, alpha=0.6))

    plt.tight_layout()
    plt.savefig(out_png, dpi=350)
    plt.close()


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    df = pd.read_csv(IN_CSV, parse_dates=["month"])
    df = df.sort_values(["full_name_lc","month"])

    mom = df.groupby("full_name_lc", group_keys=False).apply(compute_momentum).reset_index(drop=True)
    mom.to_csv(OUT_CSV, index=False, encoding="utf-8")

    plot_top_bars(
        mom, "openrank_momentum",
        "Top projects by GitHub OpenRank momentum (recent3 vs prev9)",
        os.path.join(OUT_DIR, "top_openrank_momentum.png")
    )
    plot_top_bars(
        mom, "popularity_momentum",
        "Top projects by DB-Engines popularity momentum (recent3 vs prev9)",
        os.path.join(OUT_DIR, "top_popularity_momentum.png")
    )

    plot_momentum_scatter(mom, os.path.join(OUT_DIR, "momentum_scatter.png"))

if __name__ == "__main__":
    main()

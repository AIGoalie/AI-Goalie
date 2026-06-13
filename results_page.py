#!/usr/bin/env python3
"""
AIGoalie — Phase 3: results.html generator (the verified track record).

Reads archive/stats/summary.json (written by stats_aggregation.build_summary)
and writes a fully static results.html: no JavaScript, charts as inline SVG,
JSON-LD Dataset markup — readable by humans, Googlebot, and AI crawlers alike.

Usage in the pipeline (after build_summary()):
    from results_page import build_results_page
    build_results_page(out_path="results.html")   # cwd = repo checkout
"""
import json
import os
from html import escape as e

GREEN = "#46F08F"; LIME = "#BFE34A"; AMBER = "#FFB13D"
LINE = "#21372B"; MUTED = "#85A091"

CSS = """
:root{--bg:#0A1310;--surface:#101D17;--surface-2:#16271E;--line:#21372B;--line-soft:#1a2c22;
--green:#27D27A;--green-bright:#46F08F;--lime:#BFE34A;--amber:#FFB13D;--gold:#F4C752;
--text:#E9F1EB;--muted:#85A091;--muted-2:#5f7a6c;--loss:#E96A6A}
*{box-sizing:border-box;margin:0;padding:0}
body{background:radial-gradient(900px 460px at 50% -10%,#112a1f 0%,rgba(17,42,31,0) 60%),var(--bg);
color:var(--text);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:860px;margin:0 auto;padding:0 16px 60px}
header.top{display:flex;align-items:center;gap:10px;padding:14px 0;border-bottom:1px solid var(--line-soft);margin-bottom:22px}
header.top a{color:var(--text);text-decoration:none;font-weight:800;font-size:17px}
header.top a b{color:var(--green-bright)}
.eyebrow{text-transform:uppercase;letter-spacing:.15em;font-weight:700;font-size:11px;color:var(--muted)}
h1{font-size:27px;font-weight:900;letter-spacing:-.01em;margin:6px 0 6px}
h2{font-size:19px;font-weight:900;margin:34px 0 6px}
.sub{color:var(--muted);font-size:14.5px;max-width:62ch}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0}
.card{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:15px}
.card .n{font-weight:900;font-size:27px;line-height:1.05;color:var(--green-bright)}
.card .l{color:var(--muted);font-size:12px;margin-top:6px}
.card .s{color:var(--muted-2);font-size:11px;margin-top:3px}
@media(max-width:640px){.cards{grid-template-columns:repeat(2,1fr)}h1{font-size:22px}}
.panel{border:1px solid var(--line);background:var(--surface);border-radius:16px;padding:18px;margin:14px 0}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted-2);
font-weight:700;padding:7px 8px;border-bottom:1px solid var(--line)}
td{padding:8px;border-bottom:1px solid var(--line-soft)}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
tr:last-child td{border-bottom:none}
.rate{font-weight:800}
.hi{color:var(--green-bright)}.mid{color:var(--lime)}.lo{color:var(--amber)}
.bar{height:7px;border-radius:99px;background:var(--line);position:relative;min-width:90px}
.bar i{position:absolute;left:0;top:0;bottom:0;border-radius:99px}
.note{color:var(--muted-2);font-size:12.5px;margin-top:10px}
.callout{border:1px solid rgba(70,240,143,.35);background:rgba(39,210,122,.07);border-radius:14px;
padding:15px 17px;margin:16px 0;font-size:14.5px}
.callout b{color:var(--green-bright)}
.cta-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}
.cta{display:inline-block;background:linear-gradient(135deg,#F4C752,#E0A92e);color:#1a1407;border-radius:12px;
padding:12px 20px;font-weight:800;text-decoration:none}
.cta.ghost{background:var(--surface-2);color:var(--text);border:1px solid var(--line)}
.foot{color:var(--muted-2);font-size:12.5px;border-top:1px solid var(--line-soft);margin-top:40px;padding-top:16px}
a.inline{color:var(--green-bright)}
.svgwrap{overflow-x:auto}
details{margin-top:8px}summary{cursor:pointer;color:var(--muted);font-size:13.5px}
"""


def _tier_color(rate):
    return GREEN if rate >= 60 else (LIME if rate >= 45 else AMBER)


def _hero_cards(s):
    tc, hc = s["top_call"], s["high_confidence"]
    cards = [
        (f"{tc['all_time']['win_rate']}%", "Top call of the day — won",
         f"n={tc['all_time']['n']} days · last 30d: {tc['last_30d']['win_rate']}%"),
        (f"{hc['all_time']['win_rate']}%", f"Picks at ≥{hc['threshold']}% confidence — won",
         f"n={hc['all_time']['n']:,}"),
        (f"{s['graded_total']:,}", "Predictions graded",
         f"since {s['since'][:7]}"),
        (f"{s['leagues_covered']}", "Leagues covered",
         f"{len(s['leagues'])} with public stats (n≥80)"),
    ]
    out = ['<div class="cards">']
    for n, l, sub in cards:
        out.append(f'<div class="card"><div class="n">{e(str(n))}</div>'
                   f'<div class="l">{e(l)}</div><div class="s">{e(sub)}</div></div>')
    out.append("</div>")
    return "".join(out)


def _calibration(s):
    rows = []
    for b in s["calibration"]:
        actual = b["win_rate"]
        col = _tier_color(actual)
        rows.append(
            f"<tr><td>{e(b['bucket'])}</td>"
            f'<td class="num">{b["n"]:,}</td>'
            f'<td><div class="bar"><i style="width:{min(actual,100):.0f}%;background:{col}"></i></div></td>'
            f'<td class="num rate" style="color:{col}">{actual}%</td>'
            f'<td class="num" style="color:{MUTED}">{b["drew"]/b["n"]*100:.0f}%</td></tr>'
        )
    return f"""
<div class="panel"><table>
<thead><tr><th>Model displayed</th><th class="num">Graded picks</th>
<th>Pick actually won</th><th class="num">Win rate</th><th class="num">Drawn</th></tr></thead>
<tbody>{''.join(rows)}</tbody></table>
<p class="note">Read each row as: “when the site displayed a confidence in this range,
this is how often that pick went on to win.” Sample sizes shown; buckets under 30 picks are not published.</p>
</div>"""


def _monthly_svg(s):
    months = s["monthly"]
    if not months:
        return ""
    w_bar, gap, h, pad_l, pad_b = 46, 10, 170, 34, 30
    width = pad_l + len(months) * (w_bar + gap) + 10
    parts = [f'<svg viewBox="0 0 {width} {h + pad_b}" width="{width}" height="{h + pad_b}" '
             f'role="img" aria-label="Monthly pick win rate">']
    for gy in (25, 50, 75):
        y = h - gy / 100 * (h - 20)
        parts.append(f'<line x1="{pad_l}" y1="{y:.0f}" x2="{width-6}" y2="{y:.0f}" stroke="{LINE}" stroke-width="1"/>')
        parts.append(f'<text x="2" y="{y+4:.0f}" fill="{MUTED}" font-size="10">{gy}%</text>')
    x = pad_l
    for m in months:
        r = m["win_rate"]
        bh = r / 100 * (h - 20)
        col = _tier_color(r)
        parts.append(f'<rect x="{x}" y="{h-bh:.0f}" width="{w_bar}" height="{bh:.0f}" rx="5" fill="{col}" opacity="0.9"/>')
        parts.append(f'<text x="{x + w_bar/2}" y="{h-bh-6:.0f}" fill="#E9F1EB" font-size="11" '
                     f'font-weight="700" text-anchor="middle">{r:.0f}%</text>')
        parts.append(f'<text x="{x + w_bar/2}" y="{h+14}" fill="{MUTED}" font-size="10" '
                     f'text-anchor="middle">{e(m["month"][2:])}</text>')
        parts.append(f'<text x="{x + w_bar/2}" y="{h+26}" fill="#5f7a6c" font-size="9" '
                     f'text-anchor="middle">n={m["n"]:,}</text>')
        x += w_bar + gap
    parts.append("</svg>")
    return f'<div class="panel svgwrap">{"".join(parts)}</div>'


def _league_rows(entries):
    rows = []
    for lg in entries:
        a = lg["all"]
        col = _tier_color(a["win_rate"])
        conf = lg.get("confident_picks")
        conf_cell = (f'<td class="num rate" style="color:{_tier_color(conf["win_rate"])}">'
                     f'{conf["win_rate"]}%</td><td class="num" style="color:{MUTED}">{conf["n"]:,}</td>'
                     if conf else f'<td class="num" style="color:{MUTED}">—</td><td class="num" style="color:{MUTED}">—</td>')
        rows.append(f"<tr><td>{e(lg.get('league') or '')}</td>"
                    f'<td class="num">{a["n"]:,}</td>'
                    f'<td class="num rate" style="color:{col}">{a["win_rate"]}%</td>'
                    f"{conf_cell}</tr>")
    return "".join(rows)


def _leagues(s):
    top, rest = s["leagues"][:25], s["leagues"][25:]
    head = ("<thead><tr><th>League</th><th class=\"num\">Graded</th><th class=\"num\">Win rate (all picks)</th>"
            "<th class=\"num\">Win rate (≥50% conf.)</th><th class=\"num\">n</th></tr></thead>")
    out = f'<div class="panel"><table>{head}<tbody>{_league_rows(top)}</tbody></table>'
    if rest:
        out += (f'<details><summary>Show all {len(s["leagues"])} published leagues</summary>'
                f'<table>{head}<tbody>{_league_rows(rest)}</tbody></table></details>')
    out += ('<p class="note">“All picks” includes every match the model rated — including games it itself '
            'flagged as coin-flips — which is why the confidence-filtered column is the fairer measure of usable signal. '
            'A dash means fewer than 25 graded picks at \u226550% confidence in that league \u2014 typically '
            'tight leagues where the model rarely claims a strong favourite, so no honest rate exists yet. '
            'Leagues with fewer than 80 graded predictions overall are not published.</p></div>')
    return out


def _jsonld(s):
    ld = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "AIGoalie verified football prediction track record",
        "description": (f"{s['graded_total']} machine-learning football match predictions published before "
                        f"kick-off and graded against final results, covering {s['leagues_covered']} leagues "
                        f"from {s['since']} to {s['until']}. Includes calibration of displayed confidence "
                        f"against actual outcomes."),
        "url": "https://ai-goalie.com/results.html",
        "temporalCoverage": f"{s['since']}/{s['until']}",
        "creator": {"@type": "Organization", "name": "AIGoalie", "url": "https://ai-goalie.com"},
        "variableMeasured": [
            {"@type": "PropertyValue", "name": "Top-call win rate (all time)",
             "value": f"{s['top_call']['all_time']['win_rate']}%"},
            {"@type": "PropertyValue", "name": f"Win rate at ≥{s['high_confidence']['threshold']}% displayed confidence",
             "value": f"{s['high_confidence']['all_time']['win_rate']}%"},
        ],
        "dateModified": s["generated"],
    }
    return json.dumps(ld, ensure_ascii=False)


def build_results_page(summary_path=None, out_path="results.html"):
    summary_path = summary_path or os.path.join(
        os.getenv("ARCHIVE_DIR", "archive"), "stats", "summary.json")
    with open(summary_path, encoding="utf-8") as f:
        s = json.load(f)

    cal = {b["bucket"]: b for b in s["calibration"]}
    mid = cal.get("50-59%"); hi = next((b for b in s["calibration"] if b["displayed_min"] >= 60), None)
    under_conf = ""
    if mid and hi:
        under_conf = f"""
<div class="callout">The model is <b>under-confident</b>: when it displayed 50–59%, those picks actually won
<b>{mid['win_rate']}%</b> of the time (n={mid['n']:,}); at {hi['bucket']} displayed, they won <b>{hi['win_rate']}%</b>
(n={hi['n']:,}). The displayed number is a floor, not a boast — and every figure on this page is recomputed
automatically from graded predictions, never edited by hand.</div>"""

    html = f"""<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Verified Track Record — {s['graded_total']:,} Graded AI Football Predictions | AIGoalie</title>
<meta name="description" content="Every AIGoalie prediction is published before kick-off and graded after full-time. {s['graded_total']:,} graded predictions since {s['since'][:7]}: top daily call won {s['top_call']['all_time']['win_rate']}% of the time; picks at ≥{s['high_confidence']['threshold']}% confidence won {s['high_confidence']['all_time']['win_rate']}%.">
<link rel="canonical" href="https://ai-goalie.com/results.html">
<script type="application/ld+json">{_jsonld(s)}</script>
<style>{CSS}</style></head><body><div class="wrap">

<header class="top"><a href="/">🥅 AI<b>Goalie</b></a></header>

<span class="eyebrow">Verified track record · updated {e(s['generated'])}</span>
<h1>Every prediction, published before kick-off, graded after full-time.</h1>
<p class="sub">No cherry-picking and no resets: {s['graded_total']:,} predictions across {s['leagues_covered']}
leagues since {e(s['since'])}, each one timestamped on its day page before the match started and graded
automatically against the final score.</p>

{_hero_cards(s)}

<h2>Calibration: what the displayed confidence actually means</h2>
<p class="sub">The single most useful table on this site. For every confidence range the model has displayed,
here is how those picks really performed.</p>
{_calibration(s)}
{under_conf}

<h2>Month by month</h2>
<p class="sub">Win rate of all picks per month — including the coin-flips the model itself flags as such.</p>
{_monthly_svg(s)}

<h2>By league</h2>
{_leagues(s)}

<h2>How grading works</h2>
<div class="panel"><p class="sub" style="max-width:none">
A pick counts as <b>won</b> only when the model's selected team won the match; draws are reported separately
and count against the win rate, not for it. The “top call” is the single highest-confidence prediction of each
day. Every graded prediction remains browsable on its original day page — pick any past date from
<a class="inline" href="/">the predictions board</a> and the results are stamped onto the same rows that showed
the pre-match call.</p>
<p class="note">Predictions are model outputs, not guarantees, and past performance does not promise future
results. 18+ · Gamble responsibly.</p></div>

<div class="cta-row">
<a class="cta ghost" href="/">See today's predictions</a>
<a class="cta" href="/?pro=1">✨ Go Pro — full model read on every fixture</a>
</div>

<footer class="foot">© AIGoalie · <a class="inline" href="/">Home</a> · Model outputs, not betting advice · 18+</footer>
</div></body></html>"""

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"results.html written ({len(html)/1024:.1f} KB) from {summary_path}")
    return out_path


if __name__ == "__main__":
    import sys
    build_results_page(summary_path=sys.argv[1] if len(sys.argv) > 1 else None)

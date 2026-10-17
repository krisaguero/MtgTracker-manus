#!/usr/bin/env python3
"""Backtest granular-v2 and legacy 14-day ranges on available price history."""
import json
import statistics
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ledger = json.loads((ROOT / "data/market/prediction-ledger.json").read_text())
history = json.loads((ROOT / "data/market/daily-movers-history.json").read_text())
snapshots = history["snapshots"]
records = ledger["records"]

def v2(momentum):
    if momentum >= 5:
        a = abs(momentum)
        return (8, 24) if a >= 30 else (6, 18) if a >= 20 else (4, 14) if a >= 12 else (2, 10) if a >= 8 else (1, 7)
    if momentum <= -5:
        a = abs(momentum)
        return (-24, -8) if a >= 30 else (-18, -6) if a >= 20 else (-14, -4) if a >= 12 else (-10, -2) if a >= 8 else (-7, -1)
    return (-2, 2) if abs(momentum) < 1 else (-3, 3) if abs(momentum) < 3 else (-5, 5)

def legacy(momentum):
    return (0, 10) if momentum >= 5 else (-10, 0) if momentum <= -5 else (-5, 5)

def expected_direction(momentum):
    return "UP" if momentum >= 5 else "DOWN" if momentum <= -5 else "FLAT_OR_UNCERTAIN"

def actual_direction(change):
    return "UP" if change > 2 else "DOWN" if change < -2 else "FLAT"

# Current October database readiness. These should remain unscored until review dates arrive.
current_october = [r for r in records if r.get("dateKey", "").startswith("2026-10-")]
current_status = [{
    "id": r["id"], "name": r["name"], "opened": r["dateKey"],
    "evaluationDate": r.get("prediction", {}).get("evaluationDate"),
    "model": r.get("prediction", {}).get("model"),
    "range": r.get("prediction", {}).get("projectedPctRange"),
    "exactPrinting": bool(r.get("setCode") and r.get("collectorNumber")),
    "status": "AWAITING_POST_ENTRY_WINDOW",
} for r in current_october]

# Empirical windows: use entry observations whose 14th subsequent snapshot lands in October.
by_card = {}
for snapshot in snapshots:
    for card_id, price in snapshot.get("prices", {}).items():
        by_card.setdefault(card_id, []).append((snapshot["date"], float(price)))

windows = []
for card_id, points in by_card.items():
    for i, (entry_date, entry_price) in enumerate(points):
        if i == 0 or entry_price <= 0:
            continue
        future = next(((d, p) for d, p in points[i + 14:] if d > entry_date), None)
        if not future or not future[0].startswith("2026-10-"):
            continue
        prior_price = points[i - 1][1]
        momentum = (entry_price - prior_price) / prior_price * 100
        actual_change = (future[1] - entry_price) / entry_price * 100
        for model_name, rule in (("granular-v2", v2), ("legacy", legacy)):
            low, high = rule(momentum)
            direction = expected_direction(momentum)
            realized_direction = actual_direction(actual_change)
            windows.append({
                "model": model_name, "cardId": card_id, "entryDate": entry_date, "exitDate": future[0],
                "momentumPct": round(momentum, 4), "actualChangePct": round(actual_change, 4),
                "range": [low, high], "rangeWidth": high - low, "expectedDirection": direction,
                "actualDirection": realized_direction,
                "rangeContained": low <= actual_change <= high,
                "directionCorrect": (direction == "FLAT_OR_UNCERTAIN" and abs(actual_change) <= 5) or direction == realized_direction,
            })

def summarize(model_name, rows):
    widths = [r["rangeWidth"] for r in rows]
    errors = [abs(r["actualChangePct"] - sum(r["range"]) / 2) for r in rows]
    return {
        "model": model_name,
        "windows": len(rows),
        "rangeContainmentPct": round(sum(r["rangeContained"] for r in rows) / len(rows) * 100, 2) if rows else None,
        "directionalAccuracyPct": round(sum(r["directionCorrect"] for r in rows) / len(rows) * 100, 2) if rows else None,
        "meanAbsoluteMidpointErrorPct": round(statistics.mean(errors), 2) if errors else None,
        "averageRangeWidthPct": round(statistics.mean(widths), 2) if widths else None,
        "medianRangeWidthPct": round(statistics.median(widths), 2) if widths else None,
    }

summaries = [summarize(model, [r for r in windows if r["model"] == model]) for model in ("granular-v2", "legacy")]
by_bucket = []
for lo, hi in ((0, 1), (1, 3), (3, 5), (5, 8), (8, 12), (12, 20), (20, 30), (30, 10_000)):
    bucket_rows = [r for r in windows if r["model"] == "granular-v2" and lo <= abs(r["momentumPct"]) < hi]
    if bucket_rows:
        by_bucket.append({"absMomentumBand": f"{lo}% to {'>=30%' if hi == 10_000 else str(hi) + '%'}", **summarize("granular-v2", bucket_rows)})

result = {
    "simulationDate": str(date.today()),
    "scope": "October prediction database readiness plus historical 14-day windows ending in October",
    "currentOctoberRecords": len(current_october),
    "currentOctoberScored": 0,
    "currentOctoberStatus": current_status,
    "historicalWindowCount": len(windows) // 2,
    "models": summaries,
    "granularV2ByMomentumBand": by_bucket,
    "limitations": [
        "October 13 and October 16 predictions have no 14-day post-entry observations yet.",
        "Historical windows ending in October are a calibration sample, not a direct score of the October 13/16 theses.",
        "Price history reflects the stored source snapshots and does not establish completed-sale liquidity.",
    ],
}

out_json = ROOT / "data/market" / f"prediction-range-simulation-{date.today()}.json"
out_md = ROOT / "docs" / f"prediction-range-simulation-{date.today()}.md"
out_json.write_text(json.dumps(result, indent=2) + "\n")
legacy, refined = summaries[1], summaries[0]
md = f"""# October Prediction Range-Rule Simulation — {date.today()}\n\n## Result\n\nThe October 13 and October 16 prediction records are **not mature enough for a live outcome score**. All {len(current_october)} current October records remain awaiting their 14-day post-entry windows.\n\nI ran an empirical calibration backtest using **{len(windows)//2} historical 14-day windows whose exit observations landed in October**. This tests whether the refined ranges are calibrated against the stored price paths; it does not claim that the October theses have already succeeded or failed.\n\n| Model | Windows | Range containment | Directional accuracy | Mean absolute midpoint error | Average width |\n|---|---:|---:|---:|---:|---:|\n| granular-v2 | {refined['windows']} | {refined['rangeContainmentPct']}% | {refined['directionalAccuracyPct']}% | {refined['meanAbsoluteMidpointErrorPct']}% | {refined['averageRangeWidthPct']}% |\n| legacy | {legacy['windows']} | {legacy['rangeContainmentPct']}% | {legacy['directionalAccuracyPct']}% | {legacy['meanAbsoluteMidpointErrorPct']}% | {legacy['averageRangeWidthPct']}% |\n\n## Interpretation\n\nGranular-v2 cut the average forecast width from **{legacy['averageRangeWidthPct']}% to {refined['averageRangeWidthPct']}%** and slightly improved midpoint error from **{legacy['meanAbsoluteMidpointErrorPct']}% to {refined['meanAbsoluteMidpointErrorPct']}%**. However, range containment fell from **{legacy['rangeContainmentPct']}% to {refined['rangeContainmentPct']}%**, while directional accuracy was unchanged at **{refined['directionalAccuracyPct']}%**.\n\nThe current evidence therefore supports granular-v2 as a **more precise but less conservative interval model**, not as a proven superior forecasting model. The reduced containment is concentrated in low-momentum flat bands, where small multi-day drifts can exceed a narrow ±2% or ±3% range.\n\n## Calibration implication\n\nKeep the directional thresholds, but consider widening the flat bands after a larger sample. A defensible next test is to compare the current bands against flat alternatives of ±3%, ±5%, and ±7%, using the same windows and the same no-lookahead rule. Do not change the production model solely from this small calibration sample.\n\n## Current October records\n\n- Records opened in October: **{len(current_october)}**\n- Exact printing present: **{sum(1 for r in current_status if r['exactPrinting'])}**\n- Matured records: **0**\n- Review dates: October 27 and October 30, 2026\n\n## Limitations\n\n- October 13 and October 16 predictions have no 14-day post-entry observations yet.\n- Historical windows ending in October calibrate the rule but do not evaluate the current October theses.\n- Stored price snapshots do not establish completed-sale liquidity, condition, treatment, or venue consistency.\n\nThis is market research and hobby commentary, not financial advice.\n"""
out_md.write_text(md)
print(json.dumps({"json": str(out_json), "markdown": str(out_md), "models": summaries}, indent=2))

# October Prediction Range-Rule Simulation — 2026-10-17

## Result

The October 13 and October 16 prediction records are **not mature enough for a live outcome score**. All 15 current October records remain awaiting their 14-day post-entry windows.

I ran an empirical calibration backtest using **72 historical 14-day windows whose exit observations landed in October**. This tests whether the refined ranges are calibrated against the stored price paths; it does not claim that the October theses have already succeeded or failed.

| Model | Windows | Range containment | Directional accuracy | Mean absolute midpoint error | Average width |
|---|---:|---:|---:|---:|---:|
| granular-v2 | 72 | 56.94% | 83.33% | 4.58% | 4.86% |
| legacy | 72 | 81.94% | 83.33% | 4.72% | 10% |

## Interpretation

Granular-v2 cut the average forecast width from **10% to 4.86%** and slightly improved midpoint error from **4.72% to 4.58%**. However, range containment fell from **81.94% to 56.94%**, while directional accuracy was unchanged at **83.33%**.

The current evidence therefore supports granular-v2 as a **more precise but less conservative interval model**, not as a proven superior forecasting model. The reduced containment is concentrated in low-momentum flat bands, where small multi-day drifts can exceed a narrow ±2% or ±3% range.

## Calibration implication

Keep the directional thresholds, but consider widening the flat bands after a larger sample. A defensible next test is to compare the current bands against flat alternatives of ±3%, ±5%, and ±7%, using the same windows and the same no-lookahead rule. Do not change the production model solely from this small calibration sample.

## Current October records

- Records opened in October: **15**
- Exact printing present: **15**
- Matured records: **0**
- Review dates: October 27 and October 30, 2026

## Limitations

- October 13 and October 16 predictions have no 14-day post-entry observations yet.
- Historical windows ending in October calibrate the rule but do not evaluate the current October theses.
- Stored price snapshots do not establish completed-sale liquidity, condition, treatment, or venue consistency.

This is market research and hobby commentary, not financial advice.

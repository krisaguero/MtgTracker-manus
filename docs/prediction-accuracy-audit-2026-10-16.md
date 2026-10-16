# MTG AI Prediction Accuracy Audit — 2026-10-16

## Executive finding

**No defensible historical hit rate can be calculated yet.** The prediction ledger contains 15 records, all opened on October 13 or October 16. The available daily price history ends on October 8, so there are zero post-entry observations and zero recorded outcomes. The earliest reviews are due October 27; the October 16 calls are due October 30.

This is a coverage result, not a model failure result. It means the evaluation pipeline has not reached its first valid checkpoint. Pre-entry movement is shown below as context only and is excluded from accuracy.

## Coverage metrics

| Metric | Result |
|---|---:|
| Prediction records | 15 |
| Unique cards | 12 |
| Records with any stored price history | 11 |
| Records with post-entry price observations | 0 |
| Records with recorded outcomes | 0 |
| Valid evaluated records | 0 |
| Directional hit rate | N/A — no valid evaluations |
| Projected-range hit rate | N/A — no valid evaluations |
| Mean absolute error | N/A — no valid evaluations |

## Prediction inventory

| Opened | Card | Expected direction | Projected range | Entry | Due | Post-entry data | Status |
|---|---|---|---:|---:|---|---:|---|
| 2026-10-16 | Tivit, Seller of Secrets (SNC) | UP | 0% to 10% | $15.00 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-16 | Ripples of Potential (EOE) | UP | 0% to 10% | $6.00 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-16 | The Theorist, Jace Beleren (UNVERIFIED) | UP | 0% to 10% | $63.41 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-16 | Preeminent Captain (M15) | FLAT_OR_UNCERTAIN | -5% to 5% | $0.75 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-16 | Counterspell (MH2) | FLAT_OR_UNCERTAIN | -5% to 5% | $3.84 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-16 | Tyvar, the Pummeler (PPDSK) | FLAT_OR_UNCERTAIN | -5% to 5% | $6.75 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-16 | Command Tower (CMD) | FLAT_OR_UNCERTAIN | -5% to 5% | $1.00 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-16 | The Great Henge (ELD) | FLAT_OR_UNCERTAIN | -5% to 5% | $65.55 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-16 | Force of Will (ALL) | FLAT_OR_UNCERTAIN | -5% to 5% | $67.01 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-16 | Abstergo Entertainment (ACR) | UP | 0% to 10% | $4.00 | 2026-10-30 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-13 | Preeminent Captain (M15) | FLAT_OR_UNCERTAIN | -5% to 5% | $0.75 | 2026-10-27 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-13 | Counterspell (MH2) | FLAT_OR_UNCERTAIN | -5% to 5% | $3.84 | 2026-10-27 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-13 | Command Tower (CMD) | FLAT_OR_UNCERTAIN | -5% to 5% | $1.00 | 2026-10-27 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-13 | Idol of Oblivion (PLST) | FLAT_OR_UNCERTAIN | -5% to 5% | $2.60 | 2026-10-27 | 0 | UNRESOLVED — no post-entry data |
| 2026-10-13 | Lightning Bolt (PLST) | FLAT_OR_UNCERTAIN | -5% to 5% | $1.08 | 2026-10-27 | 0 | UNRESOLVED — no post-entry data |

## Pre-entry price context (excluded from accuracy)

History available: **2026-09-09 through 2026-10-08**. These changes occurred before the prediction opened and cannot be used as hits or misses.

| Card | First stored price | Last stored price | Pre-entry change |
|---|---:|---:|---:|
| Preeminent Captain | $0.72 | $0.75 | +4.17% |
| Counterspell | $4.09 | $3.84 | -6.11% |
| Tyvar, the Pummeler | $4.88 | $6.75 | +38.32% |
| Command Tower | $0.97 | $1.00 | +3.09% |
| The Great Henge | $62.97 | $65.55 | +4.10% |
| Force of Will | $64.44 | $67.01 | +3.99% |
| Idol of Oblivion | $2.28 | $2.60 | +14.04% |
| Lightning Bolt | $1.09 | $1.08 | -0.92% |

## Data-quality findings

- **Evaluation lag:** prediction records are created before the price-history refresh that will resolve them. The next valid checkpoints are October 27 and October 30.
- **Duplicate exposure:** Preeminent Captain, Counterspell, and Command Tower appear in both the October 13 and October 16 posts. They should share one canonical thesis ID or be labeled as a follow-up observation, not counted as independent model bets.
- **Exact-printing risk:** The October 16 Reality Fracture, EOE, and ACR records have unresolved collector numbers. A price comparison should be blocked or marked unverified until the printing is resolved.
- **Forecast calibration:** The current rule-based model maps positive momentum to a broad +0% to +10% range and negative momentum to -10% to 0%; it has not yet generated enough matured calls to test calibration.

## Recommended next audit checkpoints

1. On October 27, resolve the October 13 records against exact-printing prices and record actual percentage changes.
2. On October 30, resolve the October 16 records and separately score direction, range containment, and action quality.
3. Score duplicate follow-up posts once per canonical thesis, with repeated mentions tracked as persistence rather than new bets.
4. Add a minimum observation requirement: no hit-rate calculation until at least 10 matured, exact-printing predictions have realized prices.
5. Track two baselines: naive persistence (same direction as entry momentum) and flat/no-change. The AI/rule-based model should beat both before it informs purchase suggestions.

> This audit measures data coverage and prediction outcomes; it is not financial advice.

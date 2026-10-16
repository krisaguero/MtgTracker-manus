# MTG Market Watch Operating Playbook

## What runs each day

The recurring feed produces one dated Market Watch post every day. The weekday lens rotates through precon economics, bulk collection triage, Commander demand, constructed format watch, penny watch, supply watch, and collection buy lists. Every other Friday also produces a ten-card watchlist.

Each card is a research queue, not an automatic buy signal. Open the card, confirm the exact printing, check the linked source evidence, review completed-sale liquidity, and compare the failure case before taking action.

## Demonstrated workflow using October 16

1. Open **Daily Movers** and use the **Latest research refresh** link to enter the dated Market Watch post.
2. Start with the highest-ranked cards, but do not equate rank with conviction. Rank is based on observed movement and current price, not a guarantee of future return.
3. For **The Theorist, Jace Beleren (FRA #43)**, the source snapshot reported a large preceding move. The card is therefore a `DO_NOT_CHASE` research item. Verify the regular FRA #43 printing, compare the source-specific prices, and look for completed sales before considering any purchase.
4. For **Preeminent Captain (M15 #25)**, the observed movement was small. The correct use is a watchlist entry: compare the next snapshot against the entry price and do not force a trade from a low-magnitude move.
5. On the review date, record actual price, actual percentage change, actual direction, source count, liquidity note, and whether the forecast range contained the realized move.
6. Keep the prediction open when the exact printing, price source, or liquidity is unresolved. Use `UNRESOLVED`, not a guessed outcome.

## Forecast format v2

Future predictions use a granular 14-day range rather than a single `0%–10%` bracket. The rule uses the absolute observed momentum at entry and the expected direction:

| Expected direction | Entry momentum | Forecast range |
|---|---:|---:|
| UP | 5% to <8% | +1% to +7% |
| UP | 8% to <12% | +2% to +10% |
| UP | 12% to <20% | +4% to +14% |
| UP | 20% to <30% | +6% to +18% |
| UP | 30% or more | +8% to +24% |
| DOWN | −5% to >−8% | −7% to −1% |
| DOWN | −8% to >−12% | −10% to −2% |
| DOWN | −12% to >−20% | −14% to −4% |
| DOWN | −20% to >−30% | −18% to −6% |
| DOWN | −30% or less | −24% to −8% |
| FLAT_OR_UNCERTAIN | under 1% absolute movement | −2% to +2% |
| FLAT_OR_UNCERTAIN | 1% to under 3% | −3% to +3% |
| FLAT_OR_UNCERTAIN | 3% to under 5% | −5% to +5% |

Formula:

```text
momentum = observed_percent_change_at_entry
direction = UP when momentum >= 5%
             DOWN when momentum <= -5%
             FLAT_OR_UNCERTAIN otherwise
range = granular_band(abs(momentum), direction)
```

The implementation records `model: granular-v2 momentum bands` and a `rangeFormula` string with every newly generated prediction. Historical predictions are not rewritten; this keeps backtests honest and makes the model-version boundary visible.

## Review record format

Every matured prediction should produce an outcome with this shape:

```json
{
  "status": "EVALUATED",
  "correctDirection": true,
  "rangeContained": false,
  "evaluatedAt": "2026-10-30",
  "entryUsd": 63.41,
  "exitUsd": 67.12,
  "actualChangePct": 5.85,
  "actualDirection": "UP",
  "sourceCount": 2,
  "exactPrintingVerified": true,
  "liquidityNote": "completed sales visible; no thin-listing warning",
  "failureCaseObserved": null
}
```

Use three separate scores:

- **Directional accuracy:** actual direction matched the forecast direction.
- **Range containment:** actual percentage change landed inside the forecast interval.
- **Action quality:** the action label was sensible after considering liquidity, reprint risk, and exact printing. A correct direction does not automatically make `BUY` correct.

Do not score a record if the exact printing is unresolved, the price is from a different treatment, or there is no post-entry observation. Mark it `UNRESOLVED` and carry it forward.

## Monday audit cadence

The weekly audit runs every Monday at **09:00 UTC**. It should:

1. Load the prior 35 days of prediction records and daily prices.
2. Resolve due and overdue records only when post-entry prices exist.
3. Deduplicate repeated mentions by canonical printing key.
4. Calculate direction accuracy, range containment, mean absolute error, unresolved rate, and action-quality notes.
5. Compare the granular-v2 model against flat and momentum-persistence baselines.
6. Write a dated Markdown report and machine-readable JSON artifact.
7. Update the historical log without replacing prior reports.

The audit must report sample size and unresolved rate beside every accuracy number. No purchase recommendation should use the model until at least ten exact-printing predictions have matured and the model has beaten both simple baselines.

> This is market research and hobby commentary, not financial advice. Verify condition, printing, fees, shipping, and completed sales before transacting.

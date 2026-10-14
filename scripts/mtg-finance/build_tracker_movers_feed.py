#!/usr/bin/env python3
"""Turn MtgTracker-manus's existing dailyMarketSnapshot into a five-category feed."""

from __future__ import annotations

import argparse
import json
import math
import os
import tempfile
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any
from urllib.parse import quote

SCHEMA_VERSION = 1
MTGJSON_URL = "https://mtgjson.com/downloads/all-files/"


def number(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return None
    return result if result.is_finite() else None


def read_json(path: Path, required: bool = True) -> dict[str, Any] | None:
    if not path.exists():
        if required:
            raise FileNotFoundError(path)
        return None
    result = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(result, dict):
        raise ValueError(f"Expected a JSON object in {path}")
    return result


def scryfall_search_url(signal: dict[str, Any]) -> str | None:
    name = str(signal.get("name") or "").strip()
    if not name:
        return None
    query = f'!"{name}"'
    set_code = str(signal.get("setCode") or "").strip()
    collector = str(signal.get("collectorNumber") or "").strip()
    if set_code:
        query += f" set:{set_code}"
    if collector:
        query += f" cn:{collector}"
    return "https://scryfall.com/search?q=" + quote(query, safe="!:")


def normalize_signal(signal: dict[str, Any]) -> dict[str, Any] | None:
    current = number(signal.get("currentUsd"))
    previous = number(signal.get("previousUsd"))
    if not signal.get("id") or not signal.get("name") or current is None or previous is None or current <= 0 or previous <= 0:
        return None
    delta = current - previous
    percent = (delta / previous) * Decimal("100")
    source_count = signal.get("sourceCount", 0)
    try:
        source_count = max(0, int(source_count))
    except (ValueError, TypeError):
        source_count = 0
    return {
        "id": str(signal["id"]),
        "name": str(signal["name"]),
        "setCode": signal.get("setCode"),
        "setName": signal.get("setName"),
        "collectorNumber": signal.get("collectorNumber"),
        "rarity": signal.get("rarity"),
        "format": signal.get("format"),
        "marketCategory": signal.get("category"),
        "currentUsd": round(float(current), 2),
        "previousUsd": round(float(previous), 2),
        "changeUsd": round(float(delta), 2),
        "percentChange": round(float(percent), 2),
        "sourceCount": source_count,
        "tcgplayerMarketUsd": _price(signal.get("tcgplayerMarketUsd")),
        "cardKingdomUsd": _price(signal.get("cardKingdomUsd")),
        "imageUrl": signal.get("imageUrl"),
        "scryfallSearchUrl": scryfall_search_url(signal),
        "reason": signal.get("reason"),
        "lastUpdated": signal.get("lastUpdated"),
    }


def _price(value: Any) -> float | None:
    parsed = number(value)
    return None if parsed is None or parsed <= 0 else round(float(parsed), 2)


def build_feed(
    snapshot: dict[str, Any],
    history: dict[str, Any] | None,
    *,
    limit: int = 10,
    min_price_usd: Decimal = Decimal("1.00"),
    min_dollar_move_usd: Decimal = Decimal("1.00"),
    budget_ceiling_usd: Decimal = Decimal("10.00"),
    budget_min_rise_usd: Decimal = Decimal("0.25"),
    budget_min_rise_percent: Decimal = Decimal("10.00"),
) -> dict[str, Any]:
    raw_signals = snapshot.get("signals")
    if not isinstance(raw_signals, list):
        raise ValueError("dailyMarketSnapshot must contain a signals array")
    signals = [normalized for raw in raw_signals if isinstance(raw, dict) and (normalized := normalize_signal(raw))]

    snapshots = history.get("snapshots", []) if history else []
    dates = {str(item.get("date")) for item in snapshots if isinstance(item, dict) and item.get("date")}
    status = "ready" if len(dates) >= 2 else "warming_up"

    def current(item: dict[str, Any]) -> Decimal:
        return Decimal(str(item["currentUsd"]))

    def previous(item: dict[str, Any]) -> Decimal:
        return Decimal(str(item["previousUsd"]))

    def delta(item: dict[str, Any]) -> Decimal:
        return Decimal(str(item["changeUsd"]))

    def pct(item: dict[str, Any]) -> Decimal:
        return Decimal(str(item["percentChange"]))

    groups = [
        (
            "percentage_gainers", "Percentage gainers",
            f"Positive percentage change; previous and current price at least ${min_price_usd:.2f}.",
            [s for s in signals if pct(s) > 0 and previous(s) >= min_price_usd and current(s) >= min_price_usd],
            lambda s: (-s["percentChange"], -s["changeUsd"], s["name"].casefold()),
        ),
        (
            "percentage_decliners", "Percentage decliners",
            f"Negative percentage change; previous and current price at least ${min_price_usd:.2f}.",
            [s for s in signals if pct(s) < 0 and previous(s) >= min_price_usd and current(s) >= min_price_usd],
            lambda s: (s["percentChange"], s["changeUsd"], s["name"].casefold()),
        ),
        (
            "dollar_gainers", "Dollar gainers",
            f"Positive absolute price change of at least ${min_dollar_move_usd:.2f}.",
            [s for s in signals if delta(s) >= min_dollar_move_usd],
            lambda s: (-s["changeUsd"], -s["percentChange"], s["name"].casefold()),
        ),
        (
            "dollar_decliners", "Dollar decliners",
            f"Negative absolute price change of at least ${min_dollar_move_usd:.2f}.",
            [s for s in signals if delta(s) <= -min_dollar_move_usd],
            lambda s: (s["changeUsd"], s["percentChange"], s["name"].casefold()),
        ),
        (
            "budget_breakouts", "Budget breakouts",
            f"Current price ${min_price_usd:.2f}–${budget_ceiling_usd:.2f}; rise at least ${budget_min_rise_usd:.2f} and {budget_min_rise_percent:.2f}%.",
            [s for s in signals if min_price_usd <= current(s) <= budget_ceiling_usd and delta(s) >= budget_min_rise_usd and pct(s) >= budget_min_rise_percent],
            lambda s: (-s["percentChange"], -s["changeUsd"], s["name"].casefold()),
        ),
    ]

    categories = []
    for category_id, label, criteria, items, sort_key in groups:
        ranked = sorted(items, key=sort_key)[:limit]
        categories.append({
            "id": category_id,
            "label": label,
            "criteria": criteria,
            "items": [{"rank": rank, **item} for rank, item in enumerate(ranked, start=1)],
        })

    return {
        "schemaVersion": SCHEMA_VERSION,
        "status": status,
        "generatedAt": snapshot.get("generatedAt"),
        "marketScope": "Curated market-signal matrix and tracked Commander deck printings; not the complete MTG singles universe.",
        "sources": snapshot.get("sources", ["MTGJSON paper prices"]),
        "methodology": snapshot.get("methodology", "Movements compare the latest normalized price with the prior saved observation."),
        "sourceUrl": MTGJSON_URL,
        "historyDaysAvailable": len(dates),
        "signalCount": len(signals),
        "thresholds": {
            "limitPerCategory": limit,
            "minimumPriceUsdForPercentageCategories": float(min_price_usd),
            "minimumAbsoluteMoveUsd": float(min_dollar_move_usd),
            "budgetCurrentPriceMaxUsd": float(budget_ceiling_usd),
            "budgetMinimumRiseUsd": float(budget_min_rise_usd),
            "budgetMinimumRisePercent": float(budget_min_rise_percent),
        },
        "categories": categories,
        "warnings": snapshot.get("warnings", []),
        "disclaimer": "Aggregated daily market-price estimates and snapshot-derived changes are not guaranteed transaction prices or financial advice. No sales-volume or liquidity data is provided.",
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
            temp_name = handle.name
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(temp_name, path)
    finally:
        if temp_name and os.path.exists(temp_name):
            os.unlink(temp_name)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", default="client/src/data/dailyMarketSnapshot.json")
    parser.add_argument("--history", default="data/market/daily-movers-history.json")
    parser.add_argument("--output", default="client/public/mtg-movers.json")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--min-price-usd", type=Decimal, default=Decimal("1.00"))
    parser.add_argument("--min-dollar-move-usd", type=Decimal, default=Decimal("1.00"))
    parser.add_argument("--budget-ceiling-usd", type=Decimal, default=Decimal("10.00"))
    parser.add_argument("--budget-min-rise-usd", type=Decimal, default=Decimal("0.25"))
    parser.add_argument("--budget-min-rise-percent", type=Decimal, default=Decimal("10.00"))
    args = parser.parse_args()
    if args.limit < 1:
        parser.error("--limit must be at least 1")
    snapshot = read_json(Path(args.snapshot))
    history = read_json(Path(args.history), required=False)
    assert snapshot is not None
    feed = build_feed(
        snapshot, history, limit=args.limit,
        min_price_usd=args.min_price_usd,
        min_dollar_move_usd=args.min_dollar_move_usd,
        budget_ceiling_usd=args.budget_ceiling_usd,
        budget_min_rise_usd=args.budget_min_rise_usd,
        budget_min_rise_percent=args.budget_min_rise_percent,
    )
    write_json(Path(args.output), feed)
    print(f"Wrote {feed['status']} feed with {feed['signalCount']} signals to {args.output}")


if __name__ == "__main__":
    main()

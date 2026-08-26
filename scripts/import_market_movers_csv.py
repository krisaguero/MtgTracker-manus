import csv
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data/market/mtg_top_250_movers_2026-08-25.csv"
OUTPUT_PATH = ROOT / "client/src/data/marketMoversCsv.ts"


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def load_set_codes() -> dict[str, str]:
    result = subprocess.run(
        ["curl", "-fsSL", "-A", "Mozilla/5.0 mtg-sets-tracker/1.0", "https://api.scryfall.com/sets"],
        check=True,
        capture_output=True,
        text=True,
        timeout=30,
    )
    payload = json.loads(result.stdout)
    return {normalize(item["name"]): item["code"] for item in payload.get("data", [])}


def percent(value: str) -> float:
    return float(value.rstrip("%"))


def number_or_none(value: str) -> float | None:
    value = value.strip()
    return float(value) if value else None


def clean_name(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def category_for(signal: str, direction: str, percent_change: float) -> str:
    lower_signal = signal.lower()
    if "mtgstocks" in lower_signal:
        return "high-spikes" if percent_change >= 10 else "penny-risers"
    if "mtggoldfish" in lower_signal:
        return "standard-breakouts"
    if "echomtg" in lower_signal:
        return "reprint-squashes" if direction == "down" else "imported-top-250"
    if "mtgjson" in lower_signal:
        return "commander-picks"
    return "reprint-squashes" if direction == "down" else "imported-top-250"


def main() -> None:
    set_codes = load_set_codes()
    rows = []
    unmatched = set()
    with CSV_PATH.open(newline="", encoding="utf-8") as handle:
        reader = csv.reader(handle)
        next(reader, None)
        for raw in reader:
            if len(raw) < 9:
                continue
            # A few source rows leave commas in card names unquoted. The last
            # six columns remain stable, so join everything between direction
            # and set as the card name.
            name = clean_name(",".join(raw[2:-6]))
            set_name = raw[-6].strip()
            set_code = set_codes.get(normalize(set_name), "unk")
            if set_code == "unk":
                unmatched.add(set_name)
            current = number_or_none(raw[-5])
            previous = number_or_none(raw[-4])
            change = number_or_none(raw[-3])
            if current is None:
                continue
            if previous is None and change is not None:
                previous = current - change
            if change is None and previous is not None:
                change = current - previous
            if previous is None:
                previous = current
            if change is None:
                change = 0.0
            direction = raw[1].lower()
            percent_change = percent(raw[-2])
            rows.append(
                {
                    "rank": int(raw[0]),
                    "direction": direction,
                    "category": category_for(raw[-1], direction, percent_change),
                    "name": name,
                    "setName": set_name,
                    "setCode": set_code,
                    "currentUsd": current,
                    "previousUsd": previous,
                    "changeUsd": change,
                    "percentChange": percent_change,
                    "signalSource": raw[-1].strip(),
                }
            )

    output = """/* Generated from data/market/mtg_top_250_movers_2026-08-25.csv. Do not hand-edit. */\n\nexport interface CsvMarketMover {\n  rank: number;\n  direction: 'up' | 'down' | 'flat';
  category: string;
  name: string;\n  setName: string;\n  setCode: string;\n  currentUsd: number;\n  previousUsd: number;\n  changeUsd: number;\n  percentChange: number;\n  signalSource: string;\n}\n\nexport const csvMarketMovers: CsvMarketMover[] = """ + json.dumps(rows, indent=2, ensure_ascii=False) + ";\n\nexport const csvMarketMoversAsOf = '2026-08-25';\nexport const csvMarketMoversUnmatchedSets = """ + json.dumps(sorted(unmatched), indent=2, ensure_ascii=False) + ";\n"
    OUTPUT_PATH.write_text(output, encoding="utf-8")
    print(f"wrote {len(rows)} rows to {OUTPUT_PATH}")
    print(f"unmatched sets: {len(unmatched)}")
    for name in sorted(unmatched):
        print(f"- {name}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Resolve only public shared-list names; never reads collection or ownership data."""
import json
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DECKS = ROOT / 'client/src/data/retroBattleBox2026.json'
OUTPUT = ROOT / 'client/src/data/battleBoxCardReference.json'

def main():
    names = sorted({c['name'] for deck in json.loads(DECKS.read_text()) for group in deck['groups'] for c in group['cards']})
    records = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {}
    for index, name in enumerate(names):
        if name in records:
            continue
        # Normalize typography, not spelling. Exact lookup prevents substituting another card.
        query = name.replace('’', "'").replace('‘', "'").replace('–', '-').replace('—', '-')
        url = 'https://api.scryfall.com/cards/named?' + urlencode({'exact': query})
        req = Request(url, headers={'User-Agent': 'MTGTracker-PublicDeckReview/1.0', 'Accept': 'application/json'})
        try:
            with urlopen(req, timeout=30) as response:
                card = json.load(response)
            fields = ['id', 'name', 'oracle_text', 'type_line', 'mana_cost', 'power', 'toughness', 'keywords', 'color_identity', 'image_uris', 'card_faces', 'scryfall_uri', 'set', 'collector_number']
            records[name] = {key: card[key] for key in fields if key in card}
            OUTPUT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
        except Exception as error:
            print(f'UNRESOLVED {name}: {error}', flush=True)
        print(f'{index + 1}/{len(names)} {name}', flush=True)
        time.sleep(0.55)
    missing = set(names) - records.keys()
    print(f'Complete: {len(records)} records; unresolved: {sorted(missing)}', flush=True)
    if missing:
        raise SystemExit(1)

if __name__ == '__main__':
    main()

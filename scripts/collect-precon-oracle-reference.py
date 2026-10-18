#!/usr/bin/env python3
"""Collect Oracle evidence for the public indexed precons, never private inventory.

Writes one same-origin snapshot per indexed set so a single deck page does not
need the entire catalog's card-text payload. Source decklists are read-only.
"""
import json
import subprocess
import time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'client/public/data/precon-oracle'
CACHE = ROOT.parent / f'{ROOT.name}-oracle-collector-cache.json'


def main():
    query = "import {commanderDecklists} from './client/src/data/commanderDecklists'; console.log(JSON.stringify(commanderDecklists.map(d=>({set:d.set_code,names:[...d.commander,...d.cards].map(c=>c.name)}))));"
    decks = json.loads(subprocess.check_output([str(ROOT / 'node_modules/.bin/tsx'), '-e', query], cwd=ROOT, text=True))
    names = sorted({name for deck in decks for name in deck['names']})
    records = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    pending = [name for name in names if name not in records]
    session = requests.Session()
    session.headers.update({'User-Agent': 'MTGTracker-PublicDeckReview/1.0', 'Accept': 'application/json'})
    unresolved = set()
    normalize = lambda name: name.replace('’', "'").replace('‘', "'").lower()
    for offset in range(0, len(pending), 75):
        batch = pending[offset:offset + 75]
        response = session.post('https://api.scryfall.com/cards/collection', json={'identifiers': [{'name': name.split(' // ')[0]} for name in batch]}, timeout=60)
        response.raise_for_status()
        payload = response.json()
        returned = payload.get('data', [])
        by_name = {normalize(card['name']): card for card in returned}
        for name in batch:
            card = by_name.get(normalize(name))
            if not card:
                # Exact front-face names in an official list may resolve to a combined name.
                card = next((card for card in returned if {normalize(part) for part in card['name'].split(' // ')} == {normalize(part) for part in name.split(' // ')}), None)
            if not card and ' // ' in name:
                front, back = name.split(' // ', 1)
                card = next((item for item in returned if normalize(item['name']) == normalize(front) and any(part.get('component') == 'meld_result' and normalize(part.get('name', '')) == normalize(back) for part in item.get('all_parts', []))), None)
                # Use the indexed front's text only. A linked meld result is not
                # treated as an ability the unmelded card already possesses.
            if not card:
                unresolved.add(name)
                continue
            fields = ['name', 'oracle_text', 'type_line', 'keywords', 'mana_cost']
            evidence = {key: card[key] for key in fields if key in card}
            if card.get('card_faces'):
                evidence['card_faces'] = [{key: face[key] for key in ['name', 'oracle_text', 'type_line', 'mana_cost'] if key in face} for face in card['card_faces']]
            evidence['source_uri'] = card['scryfall_uri']
            records[name] = evidence
        CACHE.write_text(json.dumps(records, ensure_ascii=False))
        print(f'{min(offset+75, len(pending))}/{len(pending)} pending names queried; {len(records)} verified; {len(unresolved)} unresolved', flush=True)
        time.sleep(0.6)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    set_names = {}
    for deck in decks:
        set_names.setdefault(deck['set'].lower(), set()).update(deck['names'])
    for set_code, included in sorted(set_names.items()):
        data = {'source': 'Scryfall Oracle card text', 'cards': {name: records[name] for name in sorted(included) if name in records}, 'unresolved': sorted(included - records.keys())}
        (OUTPUT / f'{set_code}.json').write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n')
    missing = sorted(set(names) - records.keys())
    print(f'Finished {len(set_names)} indexed sets, {len(decks)} decks, {len(records)} verified unique names. Unresolved ({len(missing)}): {missing}', flush=True)


if __name__ == '__main__':
    main()

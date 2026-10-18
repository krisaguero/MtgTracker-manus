"""Refresh public card text and representative printing metadata; never reads inventory."""
import json
import time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]
source = json.loads((ROOT / 'client/src/data/brawlBox2026.json').read_text())
names = sorted({card['name'] for deck in source['decks'] for group in deck['groups'] + deck.get('sideboardGroups', []) for card in group['cards'] if card.get('verificationStatus') != 'unresolved'})
reference = {}
session = requests.Session()
session.headers.update({'User-Agent': 'MtgTracker-BrawlReview/1.0', 'Accept': 'application/json'})
for offset in range(0, len(names), 75):
    batch = names[offset:offset+75]
    response = session.post('https://api.scryfall.com/cards/collection', json={'identifiers': [{'name': name} for name in batch]}, timeout=60)
    response.raise_for_status()
    payload = response.json()
    if payload.get('not_found'):
        raise ValueError(f"Exact submitted names not found: {payload['not_found']}")
    for card in payload['data']:
        faces = card.get('card_faces', [])
        images = card.get('image_uris') or (faces[0].get('image_uris', {}) if faces else {})
        entry = {
            'name': card['name'], 'id': card['id'], 'scryfallUrl': card['scryfall_uri'],
            'imageUrl': images.get('normal') or images.get('grid'),
            'artUrl': images.get('art_crop') or images.get('art'),
            'set': card['set'], 'setName': card['set_name'], 'collectorNumber': card['collector_number'],
            'artist': card.get('artist', faces[0].get('artist') if faces else None),
            'oracleText': card.get('oracle_text') or '\n\n'.join(f"{face['name']}: {face.get('oracle_text', '')}" for face in faces),
            'typeLine': card['type_line'], 'colorIdentity': card['color_identity'],
        }
        for submitted in batch:
            if submitted.casefold() == card['name'].casefold() or any(submitted.casefold() == face['name'].casefold() for face in faces):
                reference[submitted] = entry
    print(f'Collected {len(reference)}/{len(names)} exact card references', flush=True)
    time.sleep(0.15)
missing = set(names) - reference.keys()
if missing:
    raise ValueError(f'Unmatched submitted names: {sorted(missing)}')
(ROOT / 'client/src/data/brawlCardReference.json').write_text(json.dumps(reference, indent=2, ensure_ascii=False) + '\n')

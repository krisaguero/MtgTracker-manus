#!/usr/bin/env python3
"""Build direct Scryfall image maps from approved public Deck Gallery data.

Only public Gallery card names and public Battle Box selection metadata are read.
No private archive, inventory, Deckbox export, or withheld source file is used.
"""
from __future__ import annotations

import gzip
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_GALLERY = ROOT / "client/public/data/deck-gallery.json"
PUBLIC_ROLES = ROOT / "client/src/data/deckGalleryRoles.json"
PUBLIC_BATTLE_BOX = ROOT / "client/src/data/deckboxBattleBoxMetadata.json"
OUTPUT = ROOT / "client/src/data/deckGalleryImageUris.json"
TILE_OUTPUT = ROOT / "client/src/data/deckboxBattleBoxTileImageUris.json"
USER_AGENT = "MTG-Tracker-Deck-Gallery-Image-Map/1.0"


def normalize_name(name: str) -> str:
    normalized = unicodedata.normalize("NFKC", name)
    normalized = normalized.replace("’", "'").replace("‘", "'")
    normalized = normalized.replace("–", "-").replace("—", "-")
    normalized = normalized.strip()
    return re.sub(r"\s+", " ", normalized).casefold()


def card_image_uris(card: dict) -> dict[str, str]:
    candidates = [card.get("image_uris") or {}]
    candidates.extend(face.get("image_uris") or {} for face in card.get("card_faces", []))
    return {
        size: uri
        for size in ("normal", "art_crop")
        if any((uri := candidate.get(size)) for candidate in candidates)
    }


def public_gallery_names(payload: dict) -> dict[str, str]:
    names: dict[str, str] = {}
    for entry in payload.get("entries", []):
        for section in ("main", "sideboard"):
            for card in entry.get(section, []):
                name = str(card.get("name", "")).strip()
                if name:
                    names.setdefault(normalize_name(name), name)

        helm = entry.get("helm") or {}
        for card in helm.get("commanders", []):
            name = str(card.get("name", "")).strip()
            if name:
                names.setdefault(normalize_name(name), name)
        child = helm.get("separateChildGuess") or {}
        name = str(child.get("name", "")).strip()
        if name:
            names.setdefault(normalize_name(name), name)
    return names


def public_battle_box_tile_names(
    payload: dict, roles_payload: dict, metadata: list[dict]
) -> dict[str, str]:
    entries = {entry["id"]: entry for entry in payload.get("entries", [])}
    readings = {reading["deckId"]: reading for reading in roles_payload.get("entries", [])}
    names: dict[str, str] = {}
    for item in metadata:
        deck_id = item["deckId"]
        entry = entries.get(deck_id)
        if not entry:
            continue
        reading = readings.get(deck_id)
        main_categories = (reading or {}).get("main", [])
        threats = next(
            (category for category in main_categories if category.get("id") == "threats"),
            None,
        )
        other = next(
            (category for category in main_categories if category.get("id") != "lands"),
            None,
        )
        feature = (
            ((threats or {}).get("cards") or [None])[0]
            or ((other or {}).get("cards") or [None])[0]
            or ((entry.get("main") or [None])[0])
        )
        if feature and feature.get("name"):
            name = str(feature["name"]).strip()
            names.setdefault(normalize_name(name), name)
    return names


def write_map(path: Path, source_updated_at: str | None, images: dict[str, dict[str, str]]) -> None:
    data = {
        "schemaVersion": 1,
        "source": "Scryfall oracle_cards bulk data",
        "sourceUpdatedAt": source_updated_at,
        "imageUris": dict(sorted(images.items())),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> int:
    gallery = json.loads(PUBLIC_GALLERY.read_text(encoding="utf-8"))
    roles = json.loads(PUBLIC_ROLES.read_text(encoding="utf-8"))
    tile_metadata = json.loads(PUBLIC_BATTLE_BOX.read_text(encoding="utf-8"))
    requested = public_gallery_names(gallery)
    tile_requested = public_battle_box_tile_names(gallery, roles, tile_metadata)
    all_requested = {**requested, **tile_requested}
    if not all_requested:
        raise SystemExit("The approved public Gallery data contains no card names.")

    metadata_request = Request(
        "https://api.scryfall.com/bulk-data",
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    with urlopen(metadata_request, timeout=30) as response:
        bulk_metadata = json.load(response)
    oracle_bulk = next(
        (item for item in bulk_metadata.get("data", []) if item.get("type") == "oracle_cards"),
        None,
    )
    if not oracle_bulk:
        raise SystemExit("Scryfall did not return the oracle_cards bulk file metadata.")
    download_uri = oracle_bulk.get("download_uri") or oracle_bulk.get("jsonl_download_uri")
    if not download_uri:
        raise SystemExit("Scryfall bulk metadata did not include a JSONL download URI.")

    bulk_request = Request(
        download_uri,
        headers={"User-Agent": USER_AGENT, "Accept": "application/gzip"},
    )
    found: dict[str, dict[str, str]] = {}
    with urlopen(bulk_request, timeout=180) as response:
        with gzip.GzipFile(fileobj=response) as archive:
            for line in archive:
                card = json.loads(line)
                key = normalize_name(str(card.get("name", "")))
                if key not in all_requested or key in found:
                    continue
                uris = card_image_uris(card)
                if uris:
                    found[key] = uris
                if len(found) == len(all_requested):
                    break

    write_map(OUTPUT, oracle_bulk.get("updated_at"), {key: found[key] for key in requested if key in found})
    write_map(TILE_OUTPUT, oracle_bulk.get("updated_at"), {key: found[key] for key in tile_requested if key in found})

    missing = sorted(set(all_requested) - set(found))
    print(
        f"Wrote {len(requested) - len(set(requested) - set(found))} of {len(requested)} Gallery records "
        f"and {len(tile_requested) - len(set(tile_requested) - set(found))} of {len(tile_requested)} tile records."
    )
    print(f"Gallery map: {OUTPUT}\nBattle Box tile map: {TILE_OUTPUT}")
    if missing:
        requested_labels = {**requested, **tile_requested}
        print(f"No Scryfall bulk image found for {len(missing)} public card name(s):", file=sys.stderr)
        for key in missing:
            print(f"  {requested_labels[key]}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Build editorial role groups for public Deck Gallery entries.

Uses only the already-public Deck Gallery lists plus a local Scryfall Oracle
Cards JSONL snapshot. The groups are a presentation aid, not Deckbox author
categories, legality checks, or ownership data.
"""
from __future__ import annotations

import argparse
import gzip
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

ROLE_ORDER = [
    ("lands", "Lands"),
    ("ramp", "Ramp & mana rocks"),
    ("draw", "Card draw & selection"),
    ("interaction", "Removal & disruption"),
    ("engines", "Key engines & payoffs"),
    ("combat", "Combat tricks & protection"),
    ("threats", "Creatures & threats"),
    ("support", "Other spells & support"),
]
ROLE_INDEX = {role_id: index for index, (role_id, _) in enumerate(ROLE_ORDER)}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = value.replace("’", "'").replace("‘", "'")
    value = value.replace("–", "-").replace("—", "-")
    return " ".join(value.casefold().split())


def iter_jsonl(path: Path):
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                yield json.loads(line)


def text_for(card: dict[str, Any]) -> str:
    pieces = [card.get("oracle_text", "") or ""]
    for face in card.get("card_faces", []) or []:
        pieces.extend([face.get("oracle_text", "") or "", face.get("type_line", "") or ""])
    return "\n".join(pieces)


def type_for(card: dict[str, Any]) -> str:
    pieces = [card.get("type_line", "") or ""]
    for face in card.get("card_faces", []) or []:
        pieces.append(face.get("type_line", "") or "")
    return "\n".join(pieces)


def load_oracle_index(path: Path, requested: set[str]) -> dict[str, dict[str, Any]]:
    direct: dict[str, dict[str, Any]] = {}
    face_names: dict[str, dict[str, Any]] = {}
    for card in iter_jsonl(path):
        key = normalize(card.get("name", ""))
        if key in requested:
            direct[key] = card
        for face in card.get("card_faces", []) or []:
            face_key = normalize(face.get("name", ""))
            if face_key in requested and face_key not in face_names:
                face_names[face_key] = card
    return {**face_names, **direct}


def has_ramp(text: str, type_line: str) -> bool:
    low = text.casefold()
    return bool(
        re.search(r"\badds?\s+(?:(?:an|one|two|three|four|\d+)\s+additional\s+)?(?:\{[wubrgc0-9xyz]+\}|one|two|three|four|\d+)", low)
        or re.search(r"\bcreate\s+(?:one|a|two|three|\d+)?\s*treasure(?:\s+token)?s?\b", low)
        or re.search(r"\bsearch your library for.{0,100}\bland card\b.{0,140}\bput (?:it|that card|them) onto the battlefield", low, re.S)
        or re.search(r"\bput (?:a|one|up to \d+) land card from your hand onto the battlefield", low)
        or re.search(r"\bplay an additional land", low)
        or re.search(r"\bplay up to (?:one|two|three|\d+) (?:additional )?lands? this turn", low)
        or re.search(r"\bplay (?:one|two|three|\d+) additional lands?\b", low)
    )


def has_draw(text: str) -> bool:
    low = text.casefold()
    return bool(
        re.search(r"\bdraw\s+(?:a|one|two|three|four|\d+|x|up to|equal to)?\s*cards?\b", low)
        or re.search(r"\blook at the top.{0,160}\bput (?:that card|those cards|one of them|it) into your hand", low, re.S)
        or re.search(r"\bsurveil\b|\bscry\s+\d+", low)
        or re.search(r"\bsearch your library for (?:a|an|one|up to \d+) card.{0,100}\bput (?:it|that card) into your hand", low, re.S)
    )


def has_interaction(text: str) -> bool:
    low = text.casefold()
    patterns = [
        r"\bdestroy (?:target|all|each)\b",
        r"\bexile (?:target|all|each)\b",
        r"\bcounter target\b",
        r"\btarget (?:player|opponent) discards?\b",
        r"\btarget (?:player|opponent) sacrifices?\b",
        r"\btarget (?:player|opponent) (?:reveals|shows) [\s\S]{0,240}\bdiscard\b",
        r"\blook at target (?:player|opponent)'s hand[\s\S]{0,200}\bdiscards?\b",
        r"\btarget creature gets -[xyz\d+]+/-[xyz\d+]+\b",
        r"\bcreatures? (?:target player|target opponent) controls? get -[xyz\d+]+/-[xyz\d+]+\b",
        r"\bput a -[xyz\d+]+/-[xyz\d+]+ counter on target creature\b",
        r"\breturn target .{0,70} to (?:its|their|that card's) owner's hand\b",
        r"\bdeals? (?:one|two|three|\d+) damage to (?:any target|target (?:creature|player|opponent|planeswalker))\b",
        r"\bdeals? (?:one|two|three|\d+) damage to each (?:creature|player|opponent)\b",
        r"\bdeals? \d+ damage divided as you choose among\b",
        r"\bdeals? damage equal to .{0,70} to (?:target|each) (?:creature|player|opponent)\b",
        r"\bprevent all (?:combat )?damage\b",
        r"\bcan't attack\b",
    ]
    return any(re.search(pattern, low) for pattern in patterns)


def has_engine(text: str, type_line: str) -> bool:
    low = (text + "\n" + type_line).casefold()
    patterns = [
        r"\bwhenever\b",
        r"\bat the beginning of\b",
        r"\bas long as\b",
        r"\blandfall\b",
        r"\bcreate (?:one|a|two|three|\d+)?\s*(?:[\w -]+ )?tokens?\b",
        r"\bgraveyard\b",
        r"\bsacrifice\b",
        r"\+1/\+1 counters?\b",
        r"\bproliferate\b",
        r"\bwhenever you cast\b",
        r"\bwhenever a creature dies\b",
        r"\bsliver\b",
        r"\bequipped creature\b|\bequipped creature gets\b",
        r"\benchanted creature\b",
    ]
    return any(re.search(pattern, low) for pattern in patterns)


def has_combat_role(text: str, type_line: str) -> bool:
    low = text.casefold()
    if re.search(r"\bcreature\b", type_line.casefold()):
        return False
    patterns = [
        r"\b(?:target|enchanted|equipped) creature\b.{0,100}\b(?:gets? \+|gains?|can't be blocked|haste|first strike|double strike|trample|flying|indestructible)\b",
        r"\bcreatures you control get \+",
        r"\bcan't be blocked\b",
        r"\ball creatures able to block .{0,80} do so\b",
        r"\bprevent all (?:combat )?damage\b",
        r"\bprotection from\b",
    ]
    return any(re.search(pattern, low) for pattern in patterns)


def role_for(card: dict[str, Any] | None) -> str:
    if not card:
        return "support"
    text = text_for(card)
    type_line = type_for(card)
    low_type = type_line.casefold()
    if re.search(r"\bland\b", low_type):
        return "lands"
    if has_interaction(text):
        return "interaction"
    if has_ramp(text, type_line):
        return "ramp"
    if has_draw(text):
        return "draw"
    if has_combat_role(text, type_line):
        return "combat"
    if has_engine(text, type_line):
        return "engines"
    if re.search(r"\b(creature|planeswalker|battle)\b", low_type):
        return "threats"
    return "support"


def compact_names(cards: list[dict[str, Any]]) -> str:
    names = list(dict.fromkeys(card["name"] for card in cards))
    sample = names[:5]
    if len(names) > 5:
        sample.append("and other listed cards")
    if not sample:
        return "the listed cards"
    if len(sample) == 1:
        return sample[0]
    return ", ".join(sample[:-1]) + ", and " + sample[-1]


def engine_signals(cards: list[dict[str, Any]], oracle: dict[str, dict[str, Any]]) -> list[str]:
    joined = "\n".join(text_for(oracle.get(normalize(card["name"]), {})) for card in cards).casefold()
    signals = []
    checks = [
        ("sacrifice", r"\bsacrifice\b|\bcreature dies\b"),
        ("graveyard recursion", r"\bgraveyard\b|\breturn .* from your graveyard\b"),
        ("tokens", r"\btoken\b"),
        ("+1/+1 counters", r"\+1/\+1 counter"),
        ("discard", r"\bdiscard\b"),
        ("landfall", r"\blandfall\b|\bland enters the battlefield\b"),
        ("lifegain", r"\bgain life\b|\blifelink\b"),
        ("Sliver synergy", r"\bsliver\b"),
        ("equipment", r"\bequip\b|\bequipped\b"),
        ("spellcasting", r"\binstant or sorcery\b|\bwhenever you cast\b"),
    ]
    for label, pattern in checks:
        if re.search(pattern, joined):
            signals.append(label)
    return signals[:4]


def explanation(role_id: str, cards: list[dict[str, Any]], oracle: dict[str, dict[str, Any]]) -> str:
    names = compact_names(cards)
    if role_id == "lands":
        return f"The saved land rows ({names}) support the deck's mana base; quantities stay exactly as recorded."
    if role_id == "ramp":
        return f"Mana sources and acceleration in this group include {names}; their printed effects add mana, make Treasures, or put lands into play."
    if role_id == "draw":
        return f"Card flow or selection comes from {names}; their printed effects draw, filter, scry, surveil, or find cards."
    if role_id == "interaction":
        return f"Answers and disruption include {names}; their printed effects target opposing cards, counter spells, or pressure an opponent's hand or board."
    if role_id == "engines":
        signals = engine_signals(cards, oracle)
        detail = f" Visible text cues include {', '.join(signals)}." if signals else " Their recurring or conditional text links cards to continuing value."
        return f"Ongoing synergies and payoffs include {names}.{detail}"
    if role_id == "combat":
        return f"Combat support includes {names}; their printed effects pump, protect, or improve how creatures attack and block."
    if role_id == "threats":
        return f"Creature, planeswalker, and battle cards here include {names}; they provide bodies, combat pressure, and possible finishers."
    return f"The remaining support cards include {names}; this is a practical role bucket, not a claim that these cards are less important."


def group_rows(rows: list[dict[str, Any]], oracle: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    bucket: dict[str, list[dict[str, Any]]] = {role_id: [] for role_id, _ in ROLE_ORDER}
    for card in rows:
        role_id = role_for(oracle.get(normalize(card["name"])))
        bucket[role_id].append({"name": card["name"], "quantity": card["quantity"]})
    groups = []
    for role_id, title in ROLE_ORDER:
        cards = bucket[role_id]
        if not cards:
            continue
        groups.append({
            "id": role_id,
            "title": title,
            "copies": sum(card["quantity"] for card in cards),
            "rows": len(cards),
            "description": explanation(role_id, cards, oracle),
            "cards": cards,
        })
    return groups


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--deck-gallery", type=Path, required=True)
    parser.add_argument("--oracle-jsonl", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    payload = json.loads(args.deck_gallery.read_text(encoding="utf-8"))
    entries = payload.get("entries", [])
    names = {
        normalize(card["name"])
        for entry in entries
        for section in (entry.get("main", []), entry.get("sideboard", []))
        for card in section
    }
    oracle = load_oracle_index(args.oracle_jsonl, names)
    missing = sorted(names - oracle.keys())
    if missing:
        print("Oracle metadata missing for: " + ", ".join(missing), file=sys.stderr)
        raise SystemExit(2)

    output_entries = []
    for entry in entries:
        output_entries.append({
            "deckId": entry["id"],
            "main": group_rows(entry.get("main", []), oracle),
            "sideboard": group_rows(entry.get("sideboard", []), oracle),
        })
    result = {"schemaVersion": 1, "entries": output_entries}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated roles for {len(output_entries)} decks; {len(names)} unique card names; {len(missing)} missing metadata records.")
    print(f"Output: {args.output}")


if __name__ == "__main__":
    main()

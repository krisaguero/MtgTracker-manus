#!/usr/bin/env python3
"""Build exclusive theme/package categories for approved public Deck Gallery lists.

Only the public Gallery export and a local Scryfall Oracle snapshot are read.
Categories are editorial groupings for directly related cards; they are not
Deckbox author categories, format/legality checks, or ownership data. Cards that
do not match an explicit theme/package stay in the visible deck remainder.
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


# A tribe is only enabled when the source title names it, or the assigned
# commander identity clearly establishes it. Card membership requires the
# creature type itself or Oracle text that directly names the tribe.
TRIBES = [
    ("dragons", "Dragons", r"\bdragons?\b", r"\bdragon\b"),
    ("zombies", "Zombies", r"\bzombies?\b", r"\bzombie\b"),
    ("elves", "Elves", r"\b(?:elf|elves)\b", r"\belf\b"),
    ("cats", "Cats", r"\b(?:cats?|catz)\b", r"\bcat\b"),
    ("humans", "Humans", r"\bhumans?\b", r"\bhuman\b"),
    ("slivers", "Slivers", r"\bslivers?\b", r"\bsliver\b"),
    ("goblins", "Goblins", r"\bgoblins?\b", r"\bgoblin\b"),
    ("birds", "Birds", r"\bbirds?\b", r"\bbird\b"),
    ("wizards", "Wizards", r"\bwizards?\b|\bwizardry\b", r"\bwizard\b"),
    ("spirits", "Spirits", r"\bspirits?\b", r"\bspirit\b"),
    ("vampires", "Vampires", r"\bvampir(?:e|es|ic)\b", r"\bvampire\b"),
    ("eldrazi", "Eldrazi", r"\beldrazi\b", r"\beldrazi\b"),
    ("giants", "Giants", r"\bgiants?\b", r"\bgiant\b"),
    ("beasts", "Beasts", r"\bbeasts?\b", r"\bbeast\b"),
    ("allies", "Allies", r"\ball(?:y|ies)\b", r"\ball(?:y|ies)\b"),
    ("apes", "Apes", r"\bapes?\b", r"\bape\b"),
    ("knights", "Knights", r"\bknights?\b", r"\bknight\b"),
    ("rebels", "Rebels", r"\brebels?\b", r"\brebel\b"),
    ("walls", "Walls", r"\bwalls?\b", r"\bwall\b"),
    ("wolves", "Wolves", r"\b(?:wolf|wolves)\b", r"\bwolf\b"),
    ("centaurs", "Centaurs", r"\bcentaurs?\b", r"\bcentaur\b"),
    ("scorpions", "Scorpions", r"\bscorpions?\b", r"\bscorpion\b"),
    ("elementals", "Elementals", r"\belementals?\b", r"\belemental\b"),
]

# Mechanic/package titles are deliberately specific. Generic labels such as
# lands, ramp, draw, removal, threats, or support are never generated here.
MECHANICS: dict[str, dict[str, Any]] = {
    "tokens": {
        "title": "Token package",
        "title_patterns": [r"\btokens?\b", r"\blocust(?:'s)?\b"],
        "commander_names": ["The Locust God", "Marath, Will of the Wild"],
        "card_pattern": r"\btokens?\b|\binvestigate\b",
        "description": "Cards that create, use, or directly reward tokens.",
    },
    "clues": {
        "title": "Clue package",
        "title_patterns": [r"\bclues?\b"],
        "commander_names": [],
        "card_pattern": r"\bclues?\b|\binvestigate\b",
        "description": "Cards that investigate, create Clues, or directly use Clue tokens.",
    },
    "sacrifice": {
        "title": "Sacrifice package",
        "title_patterns": [r"\bsac(?:s)?\b", r"\bsacrific(?:e|es|ing)\b"],
        "commander_names": ["Mazirek, Kraul Death Priest", "Meren of Clan Nel Toth", "Teysa Karlov", "Vaevictis Asmadi, the Dire"],
        "card_pattern": r"\bsacrifice\b|\bcreature dies\b|\bpermanent dies\b|\bwhenever .* dies\b",
        "description": "Cards whose text directly uses sacrifice or death triggers.",
    },
    "graveyard": {
        "title": "Graveyard package",
        "title_patterns": [r"\bgraveyard\w*\b", r"\bmilly?self\b"],
        "commander_names": ["Alesha, Who Smiles at Death", "Gisa and Geralf", "Meren of Clan Nel Toth", "The Scarab God", "Daretti, Scrap Savant", "Kess, Dissident Mage"],
        "card_pattern": r"\bgraveyard\b|\bmill(?:ed|ing)?\b|\bfrom your graveyard\b|\binto your graveyard\b",
        "description": "Cards that mill, recur, or otherwise directly use a graveyard.",
    },
    "counters": {
        "title": "+1/+1 counter package",
        "title_patterns": [r"\+1\s*/\s*\+1", r"\bcounters?\b"],
        "commander_names": ["Mazirek, Kraul Death Priest", "Atraxa, Praetors' Voice", "Daghatar the Adamant", "Karlov of the Ghost Council", "Vorel of the Hull Clade", "Marath, Will of the Wild"],
        "card_pattern": r"\+1/\+1 counters?\b|\bproliferate\b|\bdouble the number of .{0,40} counters?\b",
        "description": "Cards that add, move, multiply, or proliferate +1/+1 counters.",
    },
    "equipment": {
        "title": "Equipment package",
        "title_patterns": [r"\bequipment\b", r"\bgear\b", r"\barmadillo cloak\b"],
        "commander_names": ["Akiri, Line-Slinger"],
        "card_pattern": r"\bequip(?:ped|ment)?\b|\bequipment\b|\battach .* equipment\b",
        "type_pattern": r"\bequipment\b",
        "description": "Equipment and cards that directly equip, attach, or reward Equipment.",
    },
    "enchantments": {
        "title": "Enchantment package",
        "title_patterns": [r"\benchant(?:ment|ments|s)?\b", r"\bchants\b", r"\barmadillo cloak\b"],
        "commander_names": ["Daxos the Returned", "Estrid, the Masked"],
        "card_pattern": r"\benchantments?\b|\bconstellation\b|\b enchanted \b",
        "type_pattern": r"\benchantment\b|\baura\b",
        "description": "Enchantments, Auras, and cards that directly reward or use them.",
    },
    "artifacts": {
        "title": "Artifact package",
        "title_patterns": [r"\bartifact(?:s)?\b", r"\bfacts\b"],
        "commander_names": ["Breya, Etherium Shaper", "Daretti, Scrap Savant", "Saheeli, the Gifted", "Silas Renn, Seeker Adept"],
        "card_pattern": r"\bartifacts?\b|\bservo\b|\bthopter\b",
        "type_pattern": r"\bartifact\b",
        "description": "Artifacts and cards that directly create, recur, or reward artifacts.",
    },
    "lifegain": {
        "title": "Lifegain package",
        "title_patterns": [r"\blife\b", r"\blifegain\b", r"\blife gain\b"],
        "commander_names": ["Licia, Sanguine Tribune", "Karlov of the Ghost Council"],
        "card_pattern": r"\bgain(?:s)? life\b|\blifelink\b|\bwhenever you gain life\b|\bwhenever .* gains life\b",
        "description": "Cards that gain life or directly reward lifegain.",
    },
    "energy": {
        "title": "Energy package",
        "title_patterns": [r"\benergy\b"],
        "commander_names": [],
        "card_pattern": r"\benergy counter\b|\benergy counters\b|\bpay .* energy\b|\bget .* energy\b",
        "description": "Cards that generate, use, or directly reward energy counters.",
    },
    "landfall": {
        "title": "Landfall package",
        "title_patterns": [r"\blandfall\b", r"\bland ?drops?\b"],
        "commander_names": [],
        "card_pattern": r"\blandfall\b|\bland enters the battlefield\b|\bplay an additional land\b|\bplay .* additional lands?\b",
        "description": "Cards that reward land entries or directly enable extra land plays.",
    },
    "blink": {
        "title": "Blink & enter-the-battlefield package",
        "title_patterns": [r"\bblink\b", r"\betb(?:ers?)?\b"],
        "commander_names": ["Brago, King Eternal", "Inalla, Archmage Ritualist"],
        "card_pattern": r"\benters? the battlefield\b|\breturn .* to the battlefield\b|\bexile .* then return\b|\bexile .* at the beginning of the next end step\b",
        "description": "Cards with blink effects or enter-the-battlefield abilities that fit this package.",
    },
    "monarch": {
        "title": "Monarch package",
        "title_patterns": [r"\bmonarch\b"],
        "commander_names": ["Queen Marchesa"],
        "card_pattern": r"\bmonarch\b|\bbecome the monarch\b|\bthe monarch\b",
        "description": "Cards that create, pass, or directly reward the monarch.",
    },
    "combat-damage": {
        "title": "Unblocked & combat-damage package",
        "title_patterns": [r"\bon hits?\b", r"\bstealer\b", r"\bsmackdown\b"],
        "commander_names": ["Kaseto, Orochi Archmage"],
        "card_pattern": r"\bcan't be blocked\b|\bcannot be blocked\b|\bdeals? combat damage\b|\bwhenever .* deals damage to a player\b|\bunblockable\b",
        "description": "Cards that enable unblocked attacks or trigger directly from combat damage.",
    },
    "discard": {
        "title": "Discard & empty-hand package",
        "title_patterns": [r"\bdiscard\b", r"\bno cards\b", r"\bempty hand\b"],
        "commander_names": ["Neheb, the Worthy"],
        "card_pattern": r"\bdiscards?\b|\bhellbent\b|\bhand is empty\b|\bno cards in hand\b",
        "description": "Cards that discard, reward an empty hand, or directly use discard.",
    },
    "stax": {
        "title": "Stax package",
        "title_patterns": [r"\bstax\b"],
        "commander_names": [],
        "card_pattern": r"\bcan't untap\b|\bdoesn't untap\b|\bcosts? \{1\} more\b|\bcan't cast more than\b|\bcan't attack\b|\beach opponent sacrifices\b",
        "description": "Cards that directly tax, restrict, or lock opponents' actions.",
    },
    "fling": {
        "title": "Fling & creature-toss package",
        "title_patterns": [r"\bfling(?:ers?)?\b", r"\bchuckers?\b", r"\bquarterback\b"],
        "commander_names": ["Brion Stoutarm"],
        "card_pattern": r"\bsacrifice (?:another |a |one )?creature\b[\s\S]{0,180}\bdeals? damage\b|\bdeals? damage equal to .* power\b|\bthrow .* creature\b",
        "description": "Cards that sacrifice or throw creatures to deal power-based damage.",
    },
    "pingers": {
        "title": "Pinger package",
        "title_patterns": [r"\bpingers?\b"],
        "commander_names": [],
        "card_pattern": r"\bdeals? one damage to\b|\bdeals? 1 damage to\b|\bdeals? damage to any target\b",
        "description": "Cards that directly deal repeatable or targeted damage in the pinger package.",
    },
    "bounce": {
        "title": "Bounce package",
        "title_patterns": [r"\bbounce\b"],
        "commander_names": [],
        "card_pattern": r"\breturn target .{0,100} to (?:its|their|that card's) owner's hand\b|\breturn .* to its owner's hand\b",
        "description": "Cards that return opposing permanents to their owners' hands.",
    },
    "counterspells": {
        "title": "Counterspell package",
        "title_patterns": [r"\bcounter(?:spells?)?\b"],
        "commander_names": [],
        "card_pattern": r"\bcounter target\b",
        "description": "Cards that directly counter spells in the named package.",
    },
    "card-draw": {
        "title": "Draw package",
        "title_patterns": [r"\bdraw\b"],
        "commander_names": [],
        "card_pattern": r"\bdraw (?:a |one |two |three |four |\d+ |x |up to |equal to )?cards?\b",
        "description": "Cards that directly draw cards in the named package.",
    },
    "noncreature-spells": {
        "title": "Noncreature spell package",
        "title_patterns": [r"\bnon ?creatures?\b"],
        "commander_names": [],
        "card_pattern": r"",
        "exclude_type_pattern": r"\bcreature\b|\bland\b",
        "description": "Noncreature, nonland cards in the source's explicitly named package.",
    },
    "mill": {
        "title": "Mill package",
        "title_patterns": [r"\bmill(?:ing)?\b"],
        "commander_names": ["Phenax, God of Deception"],
        "card_pattern": r"\bmill(?:s|ed|ing)?\b|\bputs? the top .* into .* graveyard\b|\btarget player puts the top\b",
        "description": "Cards that mill or directly trigger from cards being put in graveyards.",
    },
    "theft": {
        "title": "Creature-theft package",
        "title_patterns": [r"\bsteal(?:er|ing)?\b", r"\bget over here\b"],
        "commander_names": ["Olivia Voldaren", "Yasova Dragonclaw"],
        "card_pattern": r"\bgain control of target creature\b|\bgain control of .* creature\b|\bcontrol of target creature\b",
        "description": "Cards that take control of opposing creatures or directly support that plan.",
    },
    "spell-copy": {
        "title": "Spell-copy package",
        "title_patterns": [r"\bspell copy\b", r"\bspell-copy\b"],
        "commander_names": ["Zada, Hedron Grinder"],
        "card_pattern": r"\bcopy target (?:instant or sorcery )?spell\b|\bcopy that spell\b|\bcopy .* spell\b|\bcopy it\b",
        "description": "Cards that copy spells or directly reward copied spells.",
    },
    "polymorph": {
        "title": "Polymorph package",
        "title_patterns": [r"\bpolymorph\b", r"\bconversions\b"],
        "commander_names": ["Jalira, Master Polymorphist"],
        "card_pattern": r"\bsacrifice .* creature\b[\s\S]{0,160}\breveal cards? from the top\b|\bmanifest\b|\bmorph\b|\bface down\b|\bface-down\b",
        "description": "Cards that transform, manifest, or directly support the named polymorph plan.",
    },
}


def build_theme_definitions() -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for theme_id, title, title_pattern, tribe_pattern in TRIBES:
        result.append({
            "id": theme_id,
            "title": title,
            "title_patterns": [title_pattern],
            "commander_names": [],
            "card_pattern": tribe_pattern,
            "type_pattern": tribe_pattern,
            "description": f"Cards that are {title.lower()} or directly refer to them.",
        })
    result.extend({"id": theme_id, **theme} for theme_id, theme in MECHANICS.items())
    return result


THEMES = build_theme_definitions()


def enabled_themes(entry: dict[str, Any]) -> list[dict[str, Any]]:
    title = normalize(entry.get("title", ""))
    explicit = [
        theme for theme in THEMES
        if any(re.search(pattern, title, re.I) for pattern in theme.get("title_patterns", []))
    ]
    commander_names: set[str] = set()
    helm = entry.get("helm") or {}
    if helm.get("status") == "assigned":
        commander_names = {normalize(card.get("name", "")) for card in helm.get("commanders", [])}
    inferred = [
        theme for theme in THEMES
        if theme not in explicit
        and any(normalize(name) in commander_names for name in theme.get("commander_names", []))
    ]
    return explicit + inferred


def matches_theme(card_meta: dict[str, Any] | None, theme: dict[str, Any]) -> bool:
    if not card_meta:
        return False
    text = normalize(text_for(card_meta))
    type_line = normalize(type_for(card_meta))
    if theme.get("exclude_type_pattern") and re.search(theme["exclude_type_pattern"], type_line, re.I):
        return False
    type_match = bool(theme.get("type_pattern") and re.search(theme["type_pattern"], type_line, re.I))
    text_match = bool(theme.get("card_pattern") and re.search(theme["card_pattern"], text, re.I))
    return type_match or text_match


def consolidated_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    order: list[str] = []
    for card in rows:
        key = normalize(card["name"])
        if key not in merged:
            merged[key] = {"name": card["name"], "quantity": 0}
            order.append(key)
        merged[key]["quantity"] += int(card["quantity"])
    return [merged[key] for key in order]


def group_rows(
    rows: list[dict[str, Any]],
    oracle: dict[str, dict[str, Any]],
    themes: list[dict[str, Any]],
    already_categorized: set[str],
) -> list[dict[str, Any]]:
    buckets: dict[str, list[dict[str, Any]]] = {theme["id"]: [] for theme in themes}
    used_names = set(already_categorized)
    for card in consolidated_rows(rows):
        key = normalize(card["name"])
        if key in used_names:
            continue
        card_meta = oracle.get(key)
        for theme in themes:
            if matches_theme(card_meta, theme):
                buckets[theme["id"]].append(card)
                used_names.add(key)
                break
    groups = []
    for theme in themes:
        cards = buckets[theme["id"]]
        if not cards:
            continue
        groups.append({
            "id": theme["id"],
            "title": theme["title"],
            "copies": sum(card["quantity"] for card in cards),
            "rows": len(cards),
            "description": theme["description"],
            "cards": cards,
        })
    already_categorized.update(used_names)
    return groups


def validate_reading(entry: dict[str, Any], reading: dict[str, Any]) -> None:
    all_category_names: set[str] = set()
    for section in ("main", "sideboard"):
        source = consolidated_rows(entry.get(section, []))
        source_counts = {normalize(card["name"]): card["quantity"] for card in source}
        groups = reading[section]
        for group in groups:
            if group["copies"] != sum(card["quantity"] for card in group["cards"]):
                raise ValueError(f"Category copy count mismatch: {entry['id']} / {section} / {group['id']}")
            if group["rows"] != len(group["cards"]):
                raise ValueError(f"Category row count mismatch: {entry['id']} / {section} / {group['id']}")
            for card in group["cards"]:
                key = normalize(card["name"])
                if key not in source_counts or card["quantity"] > source_counts[key]:
                    raise ValueError(f"Category card not reconciled to source: {entry['id']} / {card['name']}")
                if key in all_category_names:
                    raise ValueError(f"Card appears in more than one category: {entry['id']} / {card['name']}")
                all_category_names.add(key)


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
    categorized_cards = 0
    categorized_decks = 0
    for entry in entries:
        themes = enabled_themes(entry)
        used_names: set[str] = set()
        reading = {
            "deckId": entry["id"],
            "main": group_rows(entry.get("main", []), oracle, themes, used_names),
            "sideboard": group_rows(entry.get("sideboard", []), oracle, themes, used_names),
        }
        validate_reading(entry, reading)
        categorized_cards += sum(group["rows"] for group in reading["main"] + reading["sideboard"])
        categorized_decks += bool(reading["main"] or reading["sideboard"])
        output_entries.append(reading)

    result = {"schemaVersion": 2, "entries": output_entries}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated exclusive theme/package categories for {len(output_entries)} decks; "
          f"{categorized_decks} decks have categories; {categorized_cards} unique card rows are categorized; "
          f"{len(names)} unique source card names were checked; {len(missing)} metadata records are missing.")
    print(f"Output: {args.output}")


if __name__ == "__main__":
    main()

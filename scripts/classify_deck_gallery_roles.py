#!/usr/bin/env python3
"""Fill Deck Gallery remainder rows with Scryfall-backed functional roles.

The gallery's editorial theme categories remain authoritative. This script only
adds one primary EDHREC-style functional role to cards that were previously in
the uncategorized remainder, preserving main/sideboard separation and counts.
"""
from __future__ import annotations

import gzip
import json
import re
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROLES = ROOT / "client/src/data/deckGalleryRoles.json"
GALLERY = ROOT / "client/public/data/deck-gallery.json"
ORACLE = ROOT / ".cache/oracle-cards.jsonl.gz"
AUDIT = ROOT / "client/src/data/deckGalleryFunctionalRoleAudit.json"


def key(value: str) -> str:
    return (
        value.normalize("NFKC") if hasattr(value, "normalize") else value
    )


def norm(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("’", "'").replace("‘", "'").replace("–", "-").replace("—", "-").strip()).lower()


def load_oracle() -> dict[str, dict]:
    by_name: dict[str, dict] = {}
    with gzip.open(ORACLE, "rt", encoding="utf-8") as stream:
        for line in stream:
            card = json.loads(line)
            name = card.get("name", "")
            by_name.setdefault(norm(name), card)
            # MDFC and split cards can be stored under the front name in deck exports.
            for face in card.get("card_faces") or []:
                face_name = face.get("name", "")
                if face_name:
                    by_name.setdefault(norm(face_name), {**card, **face})
    return by_name


ROLE_DEFS = OrderedDict([
    ("lands", ("Lands", "Lands and land-like mana sources that establish the deck's mana base.")),
    ("ramp", ("Ramp", "Mana acceleration, cost reduction, or effects that put additional lands or mana into play.")),
    ("card-draw", ("Card draw", "Cards that draw, replace, or generate repeatable card advantage.")),
    ("tutors", ("Tutors", "Cards that search the library or reliably find a specific class of card.")),
    ("removal", ("Spot removal", "Targeted answers to creatures, artifacts, enchantments, planeswalkers, or other permanents.")),
    ("board-wipes", ("Board wipes", "Effects that reset or sweep a meaningful portion of the battlefield.")),
    ("protection", ("Protection", "Cards that protect permanents, grant hexproof or indestructible, or prevent damage.")),
    ("recursion", ("Recursion", "Cards that return permanents or spells from the graveyard or reuse spent resources.")),
    ("tokens", ("Tokens", "Cards whose primary job is creating or multiplying creature or artifact tokens.")),
    ("sacrifice", ("Sacrifice / aristocrats", "Sacrifice outlets, death-trigger payoffs, and cards that convert deaths into value.")),
    ("graveyard", ("Graveyard", "Cards that stock, exile, surveil, or otherwise directly use graveyards.")),
    ("counters", ("Counters", "Cards that place, proliferate, double, or meaningfully use counters.")),
    ("blink", ("Blink / ETB", "Cards that exile, return, flicker, or reward enter-the-battlefield effects.")),
    ("combat", ("Combat", "Cards whose primary role is attacking, evasion, equipment, or combat damage.")),
    ("artifacts", ("Artifacts / equipment", "Artifact-matters, equipment, vehicles, and artifact utility not captured above.")),
    ("enchantments", ("Enchantments", "Enchantment-matters and persistent enchantment utility.")),
    ("interaction", ("Stack interaction", "Countermagic, taxing, or other ways to interact with spells on the stack.")),
    ("utility", ("Other utility", "Cards that do not safely fit a more specific primary functional role.")),
])


def text(card: dict) -> tuple[str, str, str]:
    oracle = card.get("oracle_text", "")
    type_line = card.get("type_line", "")
    if card.get("card_faces"):
        faces = card["card_faces"]
        oracle = "\n".join(face.get("oracle_text", "") for face in faces)
        type_line = " // ".join(face.get("type_line", "") for face in faces)
    return norm(oracle), norm(type_line), norm(card.get("name", ""))


def classify(name: str, oracle: dict | None) -> tuple[str, str]:
    o, t, n = text(oracle or {"name": name})
    is_land = "land" in t or any(token in n for token in ("command tower", "temple of", "guildgate", "signet", "panorama")) and "artifact" not in t
    if is_land:
        return "lands", "type line identifies a land or a common land-base utility pattern"
    if re.search(r"\b(add|produce)\s+\{?[wubrgcxt]\}?|search your library for (a |an )?basic land|put (a|one|up to) .*land .* battlefield|costs? \{?[0-9]", o) or any(x in n for x in ("sol ring", "signet", "talisman", "fellwar stone", "mind stone", "wayfarer's bauble", "llanowar elves", "elvish mystic", "birds of paradise", "cultivate", "kodama's reach", "rampant growth")):
        return "ramp", "oracle text indicates mana acceleration or land development"
    if re.search(r"search your library for|search your library", o) and not re.search(r"basic land|land card", o):
        return "tutors", "oracle text searches the library for a nonland card or named class"
    if re.search(r"draw (a|two|three|x|that many)|draws? a card|draw cards|look at the top .* put .* into your hand|impulse", o):
        return "card-draw", "oracle text provides card draw or card selection"
    if re.search(r"destroy target|exile target|return target .* to its owner's hand|sacrifice target|deals? .* damage to .* creature|-\d+/-\d+", o):
        return "removal", "oracle text provides targeted permanent interaction"
    if re.search(r"destroy all|exile all|each creature gets -|all creatures get -|return all .* to their owners' hands|sacrifice all", o):
        return "board-wipes", "oracle text resets or sweeps multiple permanents"
    if re.search(r"hexproof|indestructible|protection from|prevent .* damage|phase out|can't be countered", o):
        return "protection", "oracle text protects a permanent or prevents a common answer"
    if re.search(r"return .* from (your |a )?graveyard|return target .* graveyard|cast .* from your graveyard|reanimate|escape", o):
        return "recursion", "oracle text returns or reuses cards from the graveyard"
    if re.search(r"create .* token|creates? .* token|populate|copy of (target )?(creature|artifact|token)", o):
        return "tokens", "oracle text creates or multiplies tokens"
    if re.search(r"sacrifice (a|an|another|this)|whenever .* dies|when .* dies|aristocrat|exploit", o):
        return "sacrifice", "oracle text uses sacrifice or death as a resource"
    if re.search(r"graveyard|mill |surveil|from graveyards?", o):
        return "graveyard", "oracle text directly uses graveyards, milling, or surveil"
    if re.search(r"proliferate|\+1/\+1 counter|counter on|counters? on|double .* counters?", o):
        return "counters", "oracle text places, multiplies, or uses counters"
    if re.search(r"exile .* return .* battlefield|return .* to the battlefield|enters the battlefield|when .* enters", o):
        return "blink", "oracle text supports blink or enter-the-battlefield value"
    if "equipment" in t or re.search(r"double strike|first strike|trample|flying|menace|unblockable|combat damage|attacks?", o):
        return "combat", "oracle text or type line primarily supports combat"
    if "artifact" in t or "artifact" in o or "vehicle" in t:
        return "artifacts", "artifact or vehicle role"
    if "enchantment" in t or "enchantment" in o:
        return "enchantments", "enchantment role"
    if re.search(r"counter target spell|counter target", o):
        return "interaction", "oracle text interacts with spells on the stack"
    return "utility", "no higher-confidence functional role matched"


def main() -> None:
    roles = json.loads(ROLES.read_text())
    gallery = json.loads(GALLERY.read_text())
    oracle = load_oracle()
    source_by_id = {entry["id"]: entry for entry in gallery["entries"]}
    audit = {"schemaVersion": 1, "classifier": "scryfall-oracle-primary-role-v1", "entries": [], "unmatchedOracleNames": []}
    unmatched = set()
    changed = 0
    total_remainder_before = 0
    total_remainder_after = 0

    for reading in roles["entries"]:
        source = source_by_id.get(reading["deckId"])
        if not source:
            continue
        entry_audit = {"deckId": reading["deckId"], "sections": {}}
        for section in ("main", "sideboard"):
            categories = reading.setdefault(section, [])
            categorized = {norm(card["name"]) for group in categories for card in group.get("cards", [])}
            additions: dict[str, OrderedDict[str, dict]] = {}
            remainder_rows = []
            for row in source.get(section, []):
                name_key = norm(row["name"])
                if name_key in categorized:
                    continue
                total_remainder_before += row["quantity"]
                role, reason = classify(row["name"], oracle.get(name_key))
                if not oracle.get(name_key):
                    unmatched.add(row["name"])
                additions.setdefault(role, OrderedDict())
                existing = additions[role].get(name_key)
                if existing:
                    existing["quantity"] += row["quantity"]
                else:
                    additions[role][name_key] = {"name": row["name"], "quantity": row["quantity"]}
                remainder_rows.append({"name": row["name"], "quantity": row["quantity"], "role": role, "reason": reason})
            for role, cards in additions.items():
                title, description = ROLE_DEFS[role]
                group = next((g for g in categories if g["id"] == f"functional-{role}"), None)
                if group is None:
                    group = {"id": f"functional-{role}", "title": title, "copies": 0, "rows": 0, "description": description, "cards": []}
                    categories.append(group)
                existing_by_key = {norm(c["name"]): c for c in group["cards"]}
                for card in cards.values():
                    if norm(card["name"]) in existing_by_key:
                        existing_by_key[norm(card["name"])] ["quantity"] += card["quantity"]
                    else:
                        group["cards"].append(card)
                group["copies"] = sum(card["quantity"] for card in group["cards"])
                group["rows"] = len(group["cards"])
            total_remainder_after += sum(row["quantity"] for row in source.get(section, []) if norm(row["name"]) not in {norm(c["name"]) for g in categories for c in g.get("cards", [])})
            entry_audit["sections"][section] = {"rowsAssigned": len(remainder_rows), "copiesAssigned": sum(r["quantity"] for r in remainder_rows), "roles": sorted({r["role"] for r in remainder_rows}), "cards": remainder_rows}
            if remainder_rows:
                changed += 1
        audit["entries"].append(entry_audit)
    audit["summary"] = {"entriesWithAssignments": changed, "remainderCopiesBefore": total_remainder_before, "remainderCopiesAfter": total_remainder_after, "unmatchedOracleNames": len(unmatched)}
    audit["unmatchedOracleNames"] = sorted(unmatched)
    ROLES.write_text(json.dumps(roles, indent=2, ensure_ascii=False) + "\n")
    AUDIT.write_text(json.dumps(audit, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(audit["summary"], indent=2))


if __name__ == "__main__":
    main()

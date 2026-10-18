import strategyJson from "@/data/battleBoxStrategy.json";
import referenceJson from "@/data/battleBoxCardReference.json";
import { retroBattleBoxDecks, type RetroBattleBoxDeck } from "./retroBattleBox";

export type BattleBoxReference = {
  id: string;
  name: string;
  oracle_text?: string;
  type_line: string;
  scryfall_uri: string;
  set: string;
  collector_number: string;
  image_uris?: { normal?: string; small?: string };
  card_faces?: Array<{
    name: string;
    oracle_text?: string;
    image_uris?: { normal?: string };
  }>;
};
export type BattleBoxPackage = {
  id: string;
  title: string;
  intro: string;
  cards: Array<{ name: string; role: string }>;
};
export type BattleBoxStrategy = { plan: string; packages: BattleBoxPackage[] };
const strategies = strategyJson as Record<string, BattleBoxStrategy>;
export const battleBoxReferences = referenceJson as Record<
  string,
  BattleBoxReference
>;
export { battleBoxDeckPath } from "./battleBoxPaths";
export const findBattleBoxDeck = (id: string) =>
  retroBattleBoxDecks.find(deck => deck.id === id);
export const battleBoxStrategy = (deck: RetroBattleBoxDeck) =>
  strategies[deck.id];
export function battleBoxPackageRows(
  deck: RetroBattleBoxDeck,
  group: BattleBoxPackage
) {
  // Preserve every source line and its proxy annotation, even repeated names.
  return deck.groups
    .flatMap((sourceGroup, groupIndex) =>
      sourceGroup.cards.map((card, cardIndex) => ({
        ...card,
        sourceGroup: sourceGroup.label,
        sourceKey: `${groupIndex}-${cardIndex}`,
        role: group.cards.find(entry => entry.name === card.name)?.role,
      }))
    )
    .filter(card => group.cards.some(entry => entry.name === card.name));
}
export function battleBoxOracleText(reference: BattleBoxReference | undefined) {
  return (
    reference?.oracle_text ??
    reference?.card_faces
      ?.map(face => `${face.name}\n${face.oracle_text ?? ""}`)
      .join("\n\n") ??
    ""
  );
}

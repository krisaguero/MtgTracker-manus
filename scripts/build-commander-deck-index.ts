import { writeFile } from "node:fs/promises";
import { commanderDecklists } from "../client/src/data/commanderDecklists";

const index = commanderDecklists.map(({ name, set_code, set_name, release_date, commander, approxValue, synopsis }) => ({
  name,
  set_code,
  set_name,
  release_date,
  commander: commander.map(({ name: commanderName }) => ({ name: commanderName })),
  approxValue,
  synopsis,
}));

await writeFile(
  "client/src/data/commanderDeckIndex.json",
  `${JSON.stringify({ generatedAt: new Date().toISOString(), decks: index }, null, 2)}\n`,
);
console.log(`Commander metadata index: ${index.length} decks`);

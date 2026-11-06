import { readFile, writeFile, mkdir } from "node:fs/promises";

const watchPath = "data/market/star-trek-price-watch.json";
const historyPath = "client/src/data/starTrekPriceHistory.json";
const watch = JSON.parse(await readFile(watchPath, "utf8"));
const history = JSON.parse(await readFile(historyPath, "utf8"));
const today = new Date().toISOString().slice(0, 10);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fetchCard(card) {
  const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}`;
  const response = await fetch(url, { headers: { "User-Agent": "mtg-tracker-star-trek-weekly/1.0" } });
  if (!response.ok) return { ...card, priceUsd: null, status: `HTTP ${response.status}` };
  const data = await response.json();
  return {
    ...card,
    resolvedName: data.name,
    setCode: data.set,
    collectorNumber: data.collector_number,
    priceUsd: data.prices?.usd ? Number(data.prices.usd) : null,
    status: data.prices?.usd ? "resolved" : "no-usd-quote",
  };
}

const resolvedCards = [];
for (const card of watch.cards) {
  resolvedCards.push(await fetchCard(card));
  await sleep(110);
}

const cardPricesUsd = Object.fromEntries(
  resolvedCards.map(card => [card.name, card.priceUsd]).filter(([, price]) => typeof price === "number")
);
const signalBasketUsd = Object.fromEntries(
  watch.products.map(product => [
    product.id,
    product.cards.reduce((sum, name) => sum + (cardPricesUsd[name] || 0), 0),
  ])
);
const snapshot = {
  date: today,
  source: "Scryfall card prices; sealed product quotes intentionally not inferred",
  sealedPricesUsd: {},
  collectorSealedPricesUsd: {},
  signalBasketUsd,
  cardPricesUsd,
  resolution: {
    cardsRequested: resolvedCards.length,
    cardsResolved: resolvedCards.filter(card => card.status === "resolved").length,
    unresolvedCards: resolvedCards.filter(card => card.status !== "resolved").map(card => card.name),
  },
};

const snapshots = history.snapshots.filter(row => row.date !== today);
snapshots.push(snapshot);
snapshots.sort((a, b) => a.date.localeCompare(b.date));
history.generatedAt = new Date().toISOString();
history.source = "Weekly Scryfall refresh for Star Trek Commander signal baskets; sealed product quotes remain separate and null until sourced.";
history.snapshots = snapshots;
await mkdir("client/src/data", { recursive: true });
await writeFile(historyPath, `${JSON.stringify(history, null, 2)}\n`);
console.log(`Star Trek weekly price history: ${today}; ${snapshot.resolution.cardsResolved}/${snapshot.resolution.cardsRequested} card quotes resolved; ${snapshots.length} snapshots retained.`);

import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dailyDirectory = resolve(root, "data/market/daily");
const strategyDirectory = resolve(root, "client/src/data");
const edhrecFile = resolve(root, "client/src/data/edhrecTopCommanders.ts");
const outputFile = resolve(root, "data/market/meta-watch.json");
const clientOutputFile = resolve(root, "client/src/data/metaWatch.json");

export const META_THRESHOLDS = {
  latestDayPct: 10,
  sevenDayPct: 15,
  minimumPriceForAbsoluteMove: 5,
  minimumAbsoluteMove: 1,
  topPriceSignals: 25,
  topCommanderSignals: 25,
  topBrawlCardSignals: 25,
};

function number(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function round(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function readDailySnapshots() {
  const files = (await readdir(dailyDirectory))
    .filter(file => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort();
  return Promise.all(
    files.map(async file => ({
      date: file.slice(0, 10),
      ...(await readJson(resolve(dailyDirectory, file), { signals: [] })),
    }))
  );
}

function parseEdhrecSnapshot(source) {
  const rows = [];
  const pattern = /^\s*\[(['"])(.*?)\1,\s*(\d+)\],?$/gm;
  for (const match of source.matchAll(pattern))
    rows.push({ name: match[2], decksPastMonth: Number(match[3]) });
  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

function strategyRecords(strategyPayload, sourceFile) {
  const records = [];
  for (const [commanderKey, strategy] of Object.entries(
    strategyPayload || {}
  )) {
    if (commanderKey.startsWith("proposal-")) continue;
    const cardCounts = new Map();
    for (const group of [
      ...(strategy.groups || []),
      ...(strategy.sideboardGroups || []),
    ]) {
      for (const card of group.cards || []) {
        const name = typeof card === "string" ? card : card?.name;
        if (!name) continue;
        cardCounts.set(
          name,
          (cardCounts.get(name) || 0) + Number(card?.quantity || 1)
        );
      }
    }
    records.push({
      commanderKey,
      sourceFile,
      cardCounts: Object.fromEntries(cardCounts),
    });
  }
  return records;
}

async function readBrawlStrategies() {
  const files = (await readdir(strategyDirectory))
    .filter(file => /^brawlStrategy.*\.json$/.test(file))
    .sort();
  const records = [];
  for (const file of files)
    records.push(
      ...strategyRecords(
        await readJson(resolve(strategyDirectory, file), {}),
        file
      )
    );
  return records;
}

export function buildPriceSpikes(snapshots, thresholds = META_THRESHOLDS) {
  const latest = snapshots.at(-1);
  const prior = snapshots.at(-2);
  const baseline = snapshots.at(-8) || snapshots[0];
  if (!latest)
    return {
      asOf: null,
      latestDate: null,
      previousDate: null,
      baselineDate: null,
      signals: [],
    };

  const previousByKey = new Map(
    (prior?.signals || []).map(signal => [signal.key || signal.id, signal])
  );
  const baselineByKey = new Map(
    (baseline?.signals || []).map(signal => [signal.key || signal.id, signal])
  );
  const signals = (latest.signals || [])
    .map(signal => {
      const key = signal.key || signal.id;
      const previous = previousByKey.get(key);
      const base = baselineByKey.get(key);
      const latestPct =
        previous && number(previous.currentUsd) > 0
          ? round(
              ((signal.currentUsd - previous.currentUsd) /
                previous.currentUsd) *
                100
            )
          : null;
      const sevenDayPct =
        base && number(base.currentUsd) > 0
          ? round(
              ((signal.currentUsd - base.currentUsd) / base.currentUsd) * 100
            )
          : null;
      const absoluteMove = previous
        ? round(signal.currentUsd - previous.currentUsd)
        : null;
      const qualifies =
        Math.abs(Number(latestPct || 0)) >= thresholds.latestDayPct ||
        Math.abs(Number(sevenDayPct || 0)) >= thresholds.sevenDayPct ||
        (number(signal.currentUsd) >= thresholds.minimumPriceForAbsoluteMove &&
          Math.abs(Number(absoluteMove || 0)) >=
            thresholds.minimumAbsoluteMove);
      return {
        key,
        name: signal.name,
        setCode: signal.setCode,
        setName: signal.setName,
        collectorNumber: signal.collectorNumber || null,
        currentUsd: signal.currentUsd,
        previousUsd: previous?.currentUsd ?? null,
        baselineUsd: base?.currentUsd ?? null,
        latestDayPct: latestPct,
        sevenDayPct,
        absoluteMove,
        direction:
          Number(sevenDayPct ?? latestPct ?? 0) > 0
            ? "up"
            : Number(sevenDayPct ?? latestPct ?? 0) < 0
              ? "down"
              : "flat",
        category: signal.category,
        sourceCount: signal.sourceCount ?? null,
        imageUrl: signal.imageUrl || null,
        qualifies,
        evidenceDates: {
          latest: latest.date,
          previous: prior?.date || null,
          baseline: baseline?.date || null,
        },
      };
    })
    .filter(signal => signal.qualifies)
    .sort(
      (a, b) =>
        Math.max(Math.abs(b.latestDayPct || 0), Math.abs(b.sevenDayPct || 0)) -
        Math.max(Math.abs(a.latestDayPct || 0), Math.abs(a.sevenDayPct || 0))
    )
    .slice(0, thresholds.topPriceSignals);

  return {
    asOf: latest.date,
    latestDate: latest.date,
    previousDate: prior?.date || null,
    baselineDate: baseline?.date || null,
    signals,
  };
}

export function buildCommanderShifts(
  current,
  previous = [],
  thresholds = META_THRESHOLDS
) {
  const previousByName = new Map(previous.map(row => [row.name, row]));
  return current
    .map(row => {
      const prior = previousByName.get(row.name);
      return {
        ...row,
        priorRank: prior?.rank ?? null,
        priorDecksPastMonth: prior?.decksPastMonth ?? null,
        rankDelta: prior ? prior.rank - row.rank : null,
        deckCountDelta: prior
          ? row.decksPastMonth - prior.decksPastMonth
          : null,
        signal:
          prior &&
          (Math.abs(prior.rank - row.rank) >= 3 ||
            Math.abs(row.decksPastMonth - prior.decksPastMonth) >= 100)
            ? "shift"
            : prior
              ? "stable-range"
              : "new-baseline",
      };
    })
    .sort(
      (a, b) =>
        Math.abs(Number(b.rankDelta || 0)) -
          Math.abs(Number(a.rankDelta || 0)) ||
        b.decksPastMonth - a.decksPastMonth
    )
    .slice(0, thresholds.topCommanderSignals);
}

export function buildBrawlMeta(
  strategies,
  previous = {},
  thresholds = META_THRESHOLDS
) {
  const commanders = strategies.map(({ commanderKey, sourceFile }) => ({
    commanderKey,
    sourceFile,
  }));
  const cardCounts = new Map();
  for (const strategy of strategies) {
    for (const [name, count] of Object.entries(strategy.cardCounts)) {
      const entry = cardCounts.get(name) || {
        name,
        strategyCount: 0,
        totalCopies: 0,
        commanders: [],
      };
      entry.strategyCount += 1;
      entry.totalCopies += count;
      entry.commanders.push(strategy.commanderKey);
      cardCounts.set(name, entry);
    }
  }
  const cards = [...cardCounts.values()]
    .map(card => ({
      ...card,
      priorStrategyCount:
        previous.cards?.find(row => row.name === card.name)?.strategyCount ??
        null,
      change: previous.cards
        ? card.strategyCount -
          (previous.cards.find(row => row.name === card.name)?.strategyCount ||
            0)
        : null,
    }))
    .sort(
      (a, b) =>
        b.strategyCount - a.strategyCount ||
        b.totalCopies - a.totalCopies ||
        a.name.localeCompare(b.name)
    )
    .slice(0, thresholds.topBrawlCardSignals);
  return {
    methodology:
      "Curated strategy-corpus proxy. Counts show representation in repository strategy documents, not tournament results, win rates, or platform-wide deck prevalence.",
    strategyDocumentCount: new Set(strategies.map(row => row.sourceFile)).size,
    commanderSignals: commanders,
    cardSignals: cards,
  };
}

export function buildMetaWatch({
  snapshots,
  edhrecSource,
  previous = {},
  brawlStrategies,
  thresholds = META_THRESHOLDS,
}) {
  const edhrec = parseEdhrecSnapshot(edhrecSource);
  const previousCommanders = previous.commanderDemand?.current || [];
  const price = buildPriceSpikes(snapshots, thresholds);
  return {
    schemaVersion: 1,
    asOf: price.asOf,
    generatedFrom: {
      priceSnapshotDate: price.latestDate,
      priceBaselineDate: price.baselineDate,
      edhrecSource: "client/src/data/edhrecTopCommanders.ts",
      brawlStrategyDirectory: "client/src/data/brawlStrategy*.json",
    },
    thresholds,
    priceSpikes: price,
    commanderDemand: {
      methodology:
        "EDHREC past-month snapshot comparison. A first observation is a baseline, not a measured trend.",
      current: edhrec,
      shifts: buildCommanderShifts(edhrec, previousCommanders, thresholds),
    },
    brawlMeta: buildBrawlMeta(brawlStrategies, previous.brawlMeta, thresholds),
  };
}

async function main() {
  const [snapshots, edhrecSource, previous, brawlStrategies] =
    await Promise.all([
      readDailySnapshots(),
      readFile(edhrecFile, "utf8"),
      readJson(outputFile, {}),
      readBrawlStrategies(),
    ]);
  const output = buildMetaWatch({
    snapshots,
    edhrecSource,
    previous,
    brawlStrategies,
  });
  await Promise.all([
    writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8"),
    writeFile(clientOutputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8"),
  ]);
  console.log(
    `Meta watch complete: ${output.priceSpikes.signals.length} price signals, ${output.commanderDemand.current.length} Commander records, ${output.brawlMeta.strategyDocumentCount} Brawl strategy documents.`
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

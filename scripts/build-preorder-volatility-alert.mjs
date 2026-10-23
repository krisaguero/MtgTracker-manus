import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dailyDirectory = resolve(root, "data/market/daily");
const releaseCalendarFile = resolve(root, "data/releases/upcoming-sets.json");
const productCatalogFile = resolve(
  root,
  "data/releases/preorder-products.json"
);
const outputFile = resolve(root, "data/market/preorder-volatility-alert.json");
const historyFile = resolve(
  root,
  "data/market/preorder-volatility-alert-history.json"
);

export const PREORDER_VOLATILITY_RULE = {
  schemaVersion: 1,
  targetSetCodes: ["TRK", "TRC", "MBC"],
  targetNamePatterns: ["star trek", "mystery booster commander"],
  thresholds: {
    dailyPct: 8,
    sevenDayPct: 15,
    marketplaceSpreadPct: 12,
  },
};

function number(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function round(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
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

function targetMatches(signal, rule) {
  const setCode = normalize(signal.setCode).toUpperCase();
  const text = normalize(`${signal.name} ${signal.setName}`);
  return (
    rule.targetSetCodes.includes(setCode) ||
    rule.targetNamePatterns.some(pattern => text.includes(normalize(pattern)))
  );
}

function getReleaseDates(calendar) {
  const dates = {};
  for (const record of calendar.records || []) {
    const code = normalize(record.setCode).toUpperCase();
    if (code) dates[code] = record.releaseDate || null;
  }
  // MBC is event-driven rather than a normal MTGJSON set-calendar record.
  dates.MBC ||= "2026-11-13";
  return dates;
}

export function buildPreorderVolatilityAlert(
  snapshots,
  calendar = { records: [] },
  rule = PREORDER_VOLATILITY_RULE
) {
  const latest = snapshots.at(-1);
  const prior = snapshots.at(-2);
  const baseline = snapshots.at(-8) || snapshots[0];
  const releaseDates = getReleaseDates(calendar);

  if (!latest) {
    return {
      schemaVersion: rule.schemaVersion,
      asOf: null,
      status: "awaiting-coverage",
      rule,
      coverage: { matchingSignals: 0, latestDate: null },
      targets: [],
      alerts: [],
    };
  }

  const previousByKey = new Map(
    (prior?.signals || []).map(signal => [signal.key || signal.id, signal])
  );
  const baselineByKey = new Map(
    (baseline?.signals || []).map(signal => [signal.key || signal.id, signal])
  );

  const targets = (latest.signals || [])
    .filter(signal => targetMatches(signal, rule))
    .map(signal => {
      const key = signal.key || signal.id;
      const previous = previousByKey.get(key);
      const base = baselineByKey.get(key);
      const currentUsd = number(signal.currentUsd);
      const previousUsd = number(previous?.currentUsd);
      const baselineUsd = number(base?.currentUsd);
      const dailyPct =
        currentUsd !== null && previousUsd > 0
          ? round(((currentUsd - previousUsd) / previousUsd) * 100)
          : null;
      const sevenDayPct =
        currentUsd !== null && baselineUsd > 0
          ? round(((currentUsd - baselineUsd) / baselineUsd) * 100)
          : null;
      const tcgplayer = number(signal.tcgplayerMarketUsd);
      const cardKingdom = number(signal.cardKingdomUsd);
      const marketplaceSpreadPct =
        tcgplayer > 0 && cardKingdom > 0
          ? round(
              (Math.abs(tcgplayer - cardKingdom) /
                Math.min(tcgplayer, cardKingdom)) *
                100
            )
          : null;
      const releaseDate =
        releaseDates[normalize(signal.setCode).toUpperCase()] || null;
      const preorderWindow = Boolean(releaseDate && latest.date < releaseDate);
      const reasons = [];
      if (Math.abs(dailyPct || 0) >= rule.thresholds.dailyPct)
        reasons.push("daily-volatility");
      if (Math.abs(sevenDayPct || 0) >= rule.thresholds.sevenDayPct)
        reasons.push("seven-day-volatility");
      if (
        marketplaceSpreadPct !== null &&
        marketplaceSpreadPct >= rule.thresholds.marketplaceSpreadPct
      )
        reasons.push("marketplace-spread");
      return {
        key,
        name: signal.name,
        setCode: signal.setCode,
        setName: signal.setName,
        collectorNumber: signal.collectorNumber || null,
        currentUsd,
        previousUsd,
        baselineUsd,
        dailyPct,
        sevenDayPct,
        marketplaceSpreadPct,
        tcgplayerMarketUsd: tcgplayer,
        cardKingdomUsd: cardKingdom,
        sourceCount: signal.sourceCount ?? null,
        releaseDate,
        preorderWindow,
        reasons,
        imageUrl: signal.imageUrl || null,
        evidenceDates: {
          latest: latest.date,
          previous: prior?.date || null,
          baseline: baseline?.date || null,
        },
      };
    })
    .sort(
      (a, b) =>
        Math.max(
          Math.abs(b.dailyPct || 0),
          Math.abs(b.sevenDayPct || 0),
          b.marketplaceSpreadPct || 0
        ) -
        Math.max(
          Math.abs(a.dailyPct || 0),
          Math.abs(a.sevenDayPct || 0),
          a.marketplaceSpreadPct || 0
        )
    );

  const alerts = targets.filter(target => target.reasons.length > 0);
  return {
    schemaVersion: rule.schemaVersion,
    asOf: latest.date,
    status:
      targets.length === 0
        ? "awaiting-coverage"
        : alerts.length
          ? "alert"
          : "clear",
    rule,
    coverage: {
      matchingSignals: targets.length,
      alertedSignals: alerts.length,
      latestDate: latest.date,
      latestGeneratedAt: latest.generatedAt || null,
    },
    targets,
    alerts,
  };
}

async function main() {
  const [snapshots, calendar, productCatalog, priorHistory] = await Promise.all(
    [
      readDailySnapshots(),
      readJson(releaseCalendarFile, { records: [] }),
      readJson(productCatalogFile, { products: [] }),
      readJson(historyFile, { records: [] }),
    ]
  );
  const output = buildPreorderVolatilityAlert(snapshots, calendar);
  output.productRisk = (productCatalog.products || []).map(product => ({
    id: product.id,
    name: product.name,
    setCode: product.setCode,
    releaseDate: product.releaseDate,
    riskScore: product.riskScore ?? null,
    riskBand: product.riskBand || "watch",
    sourceCount: product.sourceCount || 0,
    riskFactors: product.riskFactors || product.riskFlags || [],
    marketplaceSpreadPct: product.marketplaceSpreadPct ?? null,
  }));
  output.lifecycle = {
    state:
      output.alerts.length ||
      output.productRisk.some(
        product => product.sourceCount > 0 && product.riskBand === "high"
      )
        ? "detected"
        : output.coverage.matchingSignals ||
            output.productRisk.some(product => product.sourceCount > 0)
          ? "review"
          : "awaiting-coverage",
    firstDetectedAt:
      priorHistory.records?.find(
        record => record.alertCount > 0 || record.productCoverage > 0
      )?.asOf || null,
    lastCheckedAt: output.asOf,
  };
  const historyRecords = [
    ...(priorHistory.records || []).filter(
      record => record.asOf !== output.asOf
    ),
    {
      asOf: output.asOf,
      status: output.status,
      alertCount: output.alerts.length,
      matchingSignals: output.coverage.matchingSignals,
      productCoverage: output.productRisk.filter(
        product => product.sourceCount > 0
      ).length,
    },
  ].sort((a, b) => a.asOf.localeCompare(b.asOf));
  await writeFile(
    historyFile,
    `${JSON.stringify({ schemaVersion: 1, records: historyRecords }, null, 2)}\n`,
    "utf8"
  );
  await writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(
    `Preorder volatility watch: ${output.status}; ${output.coverage.matchingSignals} matching signals; ${output.alerts.length} alerts.`
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

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dailyDir = resolve(root, "data/market/daily");
const historyFile = resolve(root, "data/market/daily-movers-history.json");
const ledgerFile = resolve(root, "data/market/prediction-ledger.json");
const preorderFile = resolve(root, "data/market/preorder-volatility-alert.json");
const metaFile = resolve(root, "data/market/meta-watch.json");
const outputFile = resolve(root, "client/src/data/dailyResearchContext.json");
const archiveDir = resolve(root, "data/market/research-context");
const dateArg = process.argv.find((arg) => arg.startsWith("--date="))?.split("=")[1];

const readJson = (file, fallback) =>
  readFile(file, "utf8").then((value) => JSON.parse(value)).catch(() => fallback);
const round = (value) => Number(Number(value || 0).toFixed(2));
const keyFor = (signal) => signal.key ?? signal.id ?? `${signal.name}:${signal.setCode}:${signal.collectorNumber ?? ""}`;
const pct = (value) => `${value >= 0 ? "+" : ""}${round(value)}%`;

const files = (await readdir(dailyDir)).filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort();
const snapshots = await Promise.all(files.map(async (file) => ({
  date: file.slice(0, 10),
  ...(await readJson(resolve(dailyDir, file), { signals: [], signalCount: 0, warnings: [], sources: [], methodology: "" })),
})));
const latest = snapshots.at(-1) ?? { date: dateArg ?? new Date().toISOString().slice(0, 10), signals: [], signalCount: 0, warnings: [], sources: [], methodology: "" };
const previous = snapshots.at(-2) ?? null;
const window21 = snapshots.slice(-21);
const [history, ledger, preorder, meta] = await Promise.all([
  readJson(historyFile, { snapshots: [] }),
  readJson(ledgerFile, { records: [] }),
  readJson(preorderFile, { status: "unavailable", alerts: [], targets: [] }),
  readJson(metaFile, { priceSpikes: [], commanderDemand: [], brawlMeta: [] }),
]);

const signals = Array.isArray(latest.signals) ? latest.signals : [];
const categories = [...new Set(signals.map((signal) => signal.category).filter(Boolean))].sort();
const categoryStats = categories.map((category) => {
  const rows = signals.filter((signal) => signal.category === category);
  const changes = rows.map((signal) => Number(signal.percentChange)).filter(Number.isFinite);
  return {
    category,
    cards: rows.length,
    positiveSignals: changes.filter((value) => value > 0).length,
    negativeSignals: changes.filter((value) => value < 0).length,
    averagePctChange: round(changes.reduce((sum, value) => sum + value, 0) / Math.max(changes.length, 1)),
  };
}).sort((a, b) => b.averagePctChange - a.averagePctChange);

const sourceCounts = signals.map((signal) => Number(signal.sourceCount)).filter(Number.isFinite);
const singleSourceCount = sourceCounts.filter((count) => count < 2).length;
const positive = signals.filter((signal) => Number(signal.percentChange) > 0).length;
const negative = signals.filter((signal) => Number(signal.percentChange) < 0).length;
const commanderCount = signals.filter((signal) => signal.format === "Commander" || signal.category === "commander-picks").length;
const reprintCount = signals.filter((signal) => signal.category === "reprint-squashes").length;
const status = [];
if (singleSourceCount / Math.max(signals.length, 1) >= 0.25) status.push("Low-liquidity caution");
if (reprintCount > 0) status.push("Reprint-heavy");
if (commanderCount / Math.max(signals.length, 1) >= 0.75) status.push("Commander-driven");
if (preorder.status === "alert" || (preorder.alerts ?? []).length > 0) status.push("Precon-driven");
if (!status.length) status.push("Normal snapshot review");

const historyByKey = new Map();
for (const snapshot of window21) {
  for (const signal of snapshot.signals ?? []) {
    const key = keyFor(signal);
    const entry = historyByKey.get(key) ?? { name: signal.name, setCode: signal.setCode, collectorNumber: signal.collectorNumber ?? null, observations: [] };
    entry.observations.push({ date: snapshot.date, price: Number(signal.currentUsd), percentChange: Number(signal.percentChange || 0) });
    historyByKey.set(key, entry);
  }
}
const repeatedMovers = [...historyByKey.values()]
  .filter((entry) => entry.observations.length >= 3)
  .map((entry) => ({
    name: entry.name,
    setCode: entry.setCode,
    collectorNumber: entry.collectorNumber,
    observations: entry.observations.length,
    firstDate: entry.observations[0].date,
    lastDate: entry.observations.at(-1).date,
    totalPctChange: entry.observations[0].price > 0 ? round(((entry.observations.at(-1).price - entry.observations[0].price) / entry.observations[0].price) * 100) : null,
    positiveDays: entry.observations.filter((observation) => observation.percentChange > 0).length,
    negativeDays: entry.observations.filter((observation) => observation.percentChange < 0).length,
  }))
  .sort((a, b) => b.observations - a.observations || Math.abs(b.totalPctChange ?? 0) - Math.abs(a.totalPctChange ?? 0))
  .slice(0, 5);

const priorKeys = new Set((previous?.signals ?? []).map(keyFor));
const newSignals = signals.filter((signal) => !priorKeys.has(keyFor(signal))).slice(0, 5).map((signal) => ({ name: signal.name, setCode: signal.setCode, collectorNumber: signal.collectorNumber ?? null, category: signal.category }));
const topGainers = [...signals].filter((signal) => Number(signal.percentChange) > 0).sort((a, b) => Number(b.percentChange) - Number(a.percentChange)).slice(0, 5).map((signal) => ({ name: signal.name, setCode: signal.setCode, collectorNumber: signal.collectorNumber ?? null, currentUsd: signal.currentUsd, percentChange: signal.percentChange, sourceCount: signal.sourceCount, category: signal.category }));
const topDecliners = [...signals].filter((signal) => Number(signal.percentChange) < 0).sort((a, b) => Number(a.percentChange) - Number(b.percentChange)).slice(0, 5).map((signal) => ({ name: signal.name, setCode: signal.setCode, collectorNumber: signal.collectorNumber ?? null, currentUsd: signal.currentUsd, percentChange: signal.percentChange, sourceCount: signal.sourceCount, category: signal.category }));
const dueReviews = (ledger.records ?? []).filter((record) => !record.outcome && record.prediction?.evaluationDate && record.prediction.evaluationDate <= latest.date).slice(0, 10).map((record) => ({ name: record.name, setCode: record.setCode, collectorNumber: record.collectorNumber ?? null, evaluationDate: record.prediction.evaluationDate }));
const resolvedReviews = (ledger.records ?? []).filter((record) => record.outcome?.evaluatedAt === latest.date).slice(0, 10).map((record) => ({ name: record.name, setCode: record.setCode, collectorNumber: record.collectorNumber ?? null, status: record.outcome.status, correct: record.outcome.correct ?? null, actualChangePct: record.outcome.actualChangePct ?? null }));

const context = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  pricingDate: latest.date,
  dataWindow: window21.length ? `${window21[0].date} through ${latest.date}` : latest.date,
  marketStatus: status,
  signalCount: Number(latest.signalCount || signals.length),
  positiveSignals: positive,
  negativeSignals: negative,
  sourceCoverage: {
    declaredSources: latest.sources ?? [],
    singleSourceSignals: singleSourceCount,
    multiSourceSignals: signals.length - singleSourceCount,
    limitation: "Price snapshots are not completed-sale or broad-market volume evidence; single-source and thin-listing moves remain unverified.",
  },
  categoryStats,
  executiveSummary: [
    `${latest.signalCount ?? signals.length} exact-printing price observations were screened for ${latest.date}; ${positive} rose and ${negative} fell in the latest snapshot.`,
    categoryStats[0] ? `${categoryStats[0].category} has the strongest latest average movement at ${pct(categoryStats[0].averagePctChange)} across ${categoryStats[0].cards} cards.` : "No category momentum was available.",
    `${singleSourceCount} signals have fewer than two price sources; treat large percentage changes as a research queue, not confirmed demand.`,
    reprintCount ? `${reprintCount} reprint-floor observations require supply and reprint-risk review before buying.` : "No reprint-floor observations were present in the latest snapshot.",
    "Live catalyst, policy, tournament, EDHREC, completed-sale, and retailer evidence must be reviewed separately before a signal is promoted to Confirmed.",
  ],
  whatChangedSinceYesterday: {
    newSignals,
    topGainers,
    topDecliners,
    snapshotWarnings: latest.warnings ?? [],
  },
  historicalSignalCheck: {
    windowDays: 21,
    snapshotsReviewed: window21.length,
    repeatedMovers,
    predictionsDue: dueReviews,
    predictionsResolved: resolvedReviews,
    recurringCatalystsToReview: ["spoilers", "precons", "reprints", "tournament results", "rules and policy", "collector demand"],
    patternWarnings: ["thin listings", "spoiler reversal", "post-release supply", "reprint compression", "low-liquidity premium"],
  },
  externalResearchQueue: {
    status: "pending-live-web-review",
    requiredBeforeConfirmed: [
      "Official Wizards, Magic.gg, Arena, and Commander Rules Committee policy/product checks",
      "Completed sales, market-price tools, buylist, and multiple-marketplace comparison",
      "Tournament and deck-data review for Constructed adoption",
      "EDHREC, Moxfield, Archidekt, and upgrade-list review for Commander demand",
      "Release, spoiler, reprint, restock, preorder, and rotation review",
    ],
    sourceDiversityTarget: "At least 10 distinct domains when reasonably available; no single source family above 25% of material claims.",
    unavailableClaims: "No live-web catalyst or completed-sale claim is invented by this deterministic job.",
  },
  confidenceRules: {
    Confirmed: "Printing-specific price movement corroborated by reliable market or liquidity evidence.",
    Developing: "Real catalyst or deck demand with incomplete broad price/liquidity confirmation.",
    Speculative: "Spoiler, social, thin-listing, or anticipated-synergy thesis; not confirmed demand.",
    Unverified: "Useful context exists, but live price, volume, or adoption evidence is not confirmed.",
  },
  actionGuardrails: {
    buyDiscipline: "Prefer targeted singles, portable utility, and verified sealed value over random $50–$60 gift-box purchases.",
    dipRule: "Use WAIT_FOR_DIP only when a dip, supply wave, sale volume, or market cooldown is independently visible; otherwise WATCH.",
    doNotChase: "Do not promote a thin-listing spike, premium treatment, spoiler premium, or single-source percentage move to a buy call.",
    preconDecisions: ["BUY_SEALED", "BUY_SINGLES", "WAIT_FOR_DIP", "SKIP_OR_MONITOR"],
  },
  methodology: latest.methodology,
  disclaimer: "This is market research and hobby commentary, not financial advice. Prices may be volatile, treatment-specific, region-specific, and distorted by low-liquidity inventory. Verify condition, printing, fees, shipping, and completed sales before transacting.",
};

await mkdir(dirname(outputFile), { recursive: true });
await mkdir(archiveDir, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(context, null, 2)}\n`, "utf8");
await writeFile(resolve(archiveDir, `${latest.date}.json`), `${JSON.stringify(context, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ pricingDate: context.pricingDate, signalCount: context.signalCount, marketStatus: context.marketStatus, repeatedMovers: context.historicalSignalCheck.repeatedMovers.length, predictionsDue: context.historicalSignalCheck.predictionsDue.length }, null, 2));

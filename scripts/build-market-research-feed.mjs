import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const snapshotFile = resolve(root, "client/src/data/dailyMarketSnapshot.json");
const historyFile = resolve(root, "data/market/daily-movers-history.json");
const feedFile = resolve(root, "client/src/data/marketResearchFeed.json");
const researchContextFile = resolve(root, "client/src/data/dailyResearchContext.json");
const archiveDirectory = resolve(root, "data/market/research");
const predictionLedgerFile = resolve(
  root,
  "data/market/prediction-ledger.json"
);
const clientPredictionLedgerFile = resolve(
  root,
  "client/src/data/marketPredictionLedger.json"
);
const dateArg = process.argv
  .find(arg => arg.startsWith("--date="))
  ?.split("=")[1];
const generatedDate = dateArg || new Date().toISOString().slice(0, 10);

const TOPIC_BY_WEEKDAY = {
  0: {
    slug: "spoiler-supply-watch",
    label: "Spoiler & Supply Watch",
    lens: "spoilers, release calendars, reprints, restocks, and low-liquidity supply warnings",
  },
  1: {
    slug: "precon-sealed-economics",
    label: "Precon & Sealed Economics",
    lens: "Commander precon value, portable singles, duplicate overlap, and sealed-versus-singles discipline",
  },
  2: {
    slug: "bulk-collection-triage",
    label: "Bulk Collection Triage",
    lens: "bulk sorting, duplicate utility, buylist floors, and the next best use of collection dollars",
  },
  3: {
    slug: "commander-demand",
    label: "Commander Demand Desk",
    lens: "Commander adoption, EDHREC-style usage signals, upgrade paths, and narrow versus portable demand",
  },
  4: {
    slug: "constructed-format-watch",
    label: "Constructed Format Watch",
    lens: "tournament adoption, format legality, archetype repetition, and rotation or metagame risk",
  },
  5: {
    slug: "penny-watch",
    label: "Penny Watch & Do Not Chase",
    lens: "low-cost watch candidates, verified dip windows, thin-listing warnings, and failure cases",
  },
  6: {
    slug: "collection-buy-list",
    label: "Collection Buy List",
    lens: "owned-card sellout queues, missing precon cards, and targeted purchases instead of random sealed product",
  },
};

function readJson(file, fallback) {
  return readFile(file, "utf8")
    .then(value => JSON.parse(value))
    .catch(() => fallback);
}
function dateParts(dateKey) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  return { date, weekday: date.getUTCDay() };
}
function isoWeek(date) {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
}
function money(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? `$${value.toFixed(2)}`
    : "unverified";
}
function signed(value) {
  return `${value >= 0 ? "+" : ""}${Number(value || 0).toFixed(1)}%`;
}
function confidence(signal) {
  if (signal.sourceCount >= 2 && Math.abs(signal.percentChange) >= 5)
    return "Developing";
  return "Unverified";
}
function actionFor(signal) {
  if (signal.percentChange <= -8) return "WAIT_FOR_DIP";
  if (signal.currentUsd <= 2 && signal.percentChange > 5) return "MONITOR";
  if (signal.percentChange >= 15) return "DO_NOT_CHASE";
  return "WATCH";
}
function forecastRange(momentum, direction) {
  const magnitude = Math.abs(momentum);
  if (direction === "UP") {
    if (magnitude >= 30) return [8, 24];
    if (magnitude >= 20) return [6, 18];
    if (magnitude >= 12) return [4, 14];
    if (magnitude >= 8) return [2, 10];
    return [1, 7];
  }
  if (direction === "DOWN") {
    if (magnitude >= 30) return [-24, -8];
    if (magnitude >= 20) return [-18, -6];
    if (magnitude >= 12) return [-14, -4];
    if (magnitude >= 8) return [-10, -2];
    return [-7, -1];
  }
  if (magnitude < 1) return [-2, 2];
  if (magnitude < 3) return [-3, 3];
  return [-5, 5];
}
function cardFromSignal(signal, rank) {
  return {
    rank,
    name: signal.name,
    setCode: signal.setCode,
    setName: signal.setName,
    collectorNumber: signal.collectorNumber || null,
    currentUsd: signal.currentUsd,
    previousUsd: signal.previousUsd,
    percentChange: signal.percentChange,
    category: signal.category,
    sourceCount: signal.sourceCount,
    confidence: confidence(signal),
    action: actionFor(signal),
    thesis: signal.reason,
    risk:
      signal.percentChange >= 15
        ? "Thin-listing or reversal risk; do not treat velocity alone as durable demand."
        : signal.percentChange <= -8
          ? "Reprint, supply release, or metagame pressure may be creating a temporary floor."
          : "Catalyst and liquidity require independent confirmation before transacting.",
    verifiedAt: signal.lastUpdated,
  };
}
function predictionFor(card, dateKey) {
  const momentum = Number(card.percentChange || 0);
  const expectedDirection =
    momentum >= 5 ? "UP" : momentum <= -5 ? "DOWN" : "FLAT_OR_UNCERTAIN";
  const projectedPctRange = forecastRange(momentum, expectedDirection);
  const due = new Date(`${dateKey}T12:00:00Z`);
  due.setUTCDate(due.getUTCDate() + 14);
  return {
    horizonDays: 14,
    expectedDirection,
    projectedPctRange,
    model: "granular-v2 momentum bands; not a verified AI forecast",
    rangeFormula:
      "14-day range selected by direction and absolute observed momentum: <1%, 1–3%, 3–5%, 5–8%, 8–12%, 12–20%, 20–30%, or ≥30%",
    confidence: card.confidence,
    openedAt: dateKey,
    evaluationDate: due.toISOString().slice(0, 10),
  };
}
function topicMatches(signal, topic) {
  const category = String(signal.category || "").toLowerCase();
  if (
    topic.slug === "precon-sealed-economics" ||
    topic.slug === "commander-demand"
  )
    return signal.format === "Commander" || category.includes("commander");
  if (topic.slug === "constructed-format-watch")
    return signal.format !== "Commander" && !category.includes("penny");
  if (topic.slug === "penny-watch")
    return signal.currentUsd <= 5 || category.includes("penny");
  if (
    topic.slug === "bulk-collection-triage" ||
    topic.slug === "collection-buy-list"
  )
    return (
      signal.currentUsd <= 3 ||
      category.includes("watchlist") ||
      category.includes("reprint")
    );
  return (
    category.includes("supply") ||
    category.includes("reprint") ||
    Math.abs(signal.percentChange) >= 10
  );
}
function rankSignals(signals, limit) {
  return signals
    .filter(
      signal =>
        typeof signal.percentChange === "number" &&
        Number.isFinite(signal.percentChange) &&
        signal.percentChange !== 0
    )
    .sort(
      (a, b) =>
        Math.abs(b.percentChange) - Math.abs(a.percentChange) ||
        b.currentUsd - a.currentUsd
    )
    .slice(0, limit);
}
function paragraph(topic, dateKey, cards, snapshot, biweekly, selectionMode) {
  const direction = snapshot.signals.filter(
    signal => signal.percentChange > 0
  ).length;
  const top = cards[0];
  const mode = biweekly
    ? "This cycle also publishes the biweekly Top 10 watchlist."
    : `Today’s lens is ${topic.lens}.`;
  const fallbackNote =
    selectionMode === "fallback-top-movers"
      ? " The topic filter returned no cards, so this post falls back to the strongest non-zero movers across the full snapshot."
      : "";
  return `${topic.label} · ${dateKey}. The generated screen contains ${snapshot.signalCount} priced signals, with ${direction} positive moves in the current snapshot. ${mode}${fallbackNote} The leading screened name is ${top ? `${top.name} (${top.setCode.toUpperCase()}) at ${money(top.currentUsd)} and ${signed(top.percentChange)}` : "no qualifying card after filtering"}. This is a research queue, not confirmed transaction demand; source coverage, completed sales, format adoption, and reprint risk still require review.`;
}
export function buildPost({ dateKey, topic, snapshot, history, isBiweekly, researchContext }) {
  const topicSignals = [...(snapshot.signals || [])].filter(
    signal => isBiweekly || topicMatches(signal, topic)
  );
  const limit = isBiweekly ? 10 : 8;
  const usedFallback = !isBiweekly && topicSignals.length === 0;
  const selectionMode = usedFallback ? "fallback-top-movers" : "topic-filter";
  const ranked = rankSignals(
    usedFallback ? snapshot.signals || [] : topicSignals,
    limit
  );
  const cards = ranked.map((signal, index) =>
    cardFromSignal(signal, index + 1)
  );
  for (const card of cards) card.prediction = predictionFor(card, dateKey);
  const recent = (history.snapshots || []).slice(-21).length;
  const title = isBiweekly
    ? `Biweekly Top 10 Watchlist · ${dateKey}`
    : `${topic.label} · ${dateKey}`;
  return {
    id: `${dateKey}-${isBiweekly ? "top-10" : topic.slug}`,
    dateKey,
    slug: isBiweekly ? "biweekly-top-10" : topic.slug,
    title,
    label: isBiweekly ? "Biweekly Top 10" : topic.label,
    kind: isBiweekly ? "biweekly-top-10" : "topic-expansion",
    dataWindow:
      "Most recent verified daily snapshot; compare against the prior saved observation.",
    selectionMode,
    selectionNote: usedFallback
      ? "Topic filter returned zero cards; populated from the strongest non-zero movers in the full snapshot."
      : null,
    generatedAt: new Date(`${dateKey}T08:00:00Z`).toISOString(),
    summary: paragraph(
      topic,
      dateKey,
      cards,
      snapshot,
      isBiweekly,
      selectionMode
    ),
    body: [
      paragraph(topic, dateKey, cards, snapshot, isBiweekly, selectionMode),
      `Historical context: the local mover ledger currently retains ${recent} daily observations. Repeated movement should be checked against exact printing identity and liquidity before being called a streak. The feed labels snapshot-derived ideas as Developing or Unverified rather than financial advice.`,
      "Purchase discipline: compare targeted singles or a verified sealed precon opportunity against random booster or gift-box spending. If a dip, sale volume, or catalyst cannot be verified, the correct action is to watch rather than chase.",
    ],
    cards,
    sources: snapshot.sources || [],
    methodology: snapshot.methodology,
    marketStatus: researchContext?.marketStatus?.join("; ") ||
      "Snapshot-derived; live catalyst and completed-sale review required",
    researchContext: researchContext
      ? {
          pricingDate: researchContext.pricingDate,
          dataWindow: researchContext.dataWindow,
          executiveSummary: researchContext.executiveSummary,
          whatChangedSinceYesterday: researchContext.whatChangedSinceYesterday,
          historicalSignalCheck: researchContext.historicalSignalCheck,
          externalResearchQueue: researchContext.externalResearchQueue,
          confidenceRules: researchContext.confidenceRules,
          actionGuardrails: researchContext.actionGuardrails,
        }
      : null,
    disclaimer:
      "This is market research and hobby commentary, not financial advice. Verify condition, printing, fees, shipping, and completed sales before transacting.",
  };
}

async function main() {
  const [snapshot, history, previousFeed, predictionLedger, researchContext] = await Promise.all(
    [
      readJson(snapshotFile, {
        signalCount: 0,
        signals: [],
        sources: [],
        methodology: "",
      }),
      readJson(historyFile, { snapshots: [] }),
      readJson(feedFile, { schemaVersion: 1, generatedAt: null, posts: [] }),
      readJson(predictionLedgerFile, { schemaVersion: 1, records: [] }),
      readJson(researchContextFile, null),
    ]
  );
  const { date, weekday } = dateParts(generatedDate);
  const topic = TOPIC_BY_WEEKDAY[weekday];
  const isBiweekly = weekday === 5 && isoWeek(date) % 2 === 0;
  const post = buildPost({
    dateKey: generatedDate,
    topic,
    snapshot,
    history,
    isBiweekly,
    researchContext,
  });
  const priorRecords = Array.isArray(predictionLedger.records)
    ? predictionLedger.records
    : [];
  const activeKeys = new Set(
    priorRecords.map(
      record =>
        `${record.dateKey}:${record.setCode}:${record.collectorNumber || record.name}`
    )
  );
  const newRecords = post.cards
    .map(card => ({
      id: `${post.id}:${card.rank}:${card.setCode}:${card.collectorNumber || card.name}`,
      dateKey: generatedDate,
      postId: post.id,
      prompt: `Assess ${card.name} (${card.setCode.toUpperCase()} ${card.collectorNumber || "printing unresolved"}) for a 14-day market direction and precon/third-party demand risk.`,
      name: card.name,
      setCode: card.setCode,
      collectorNumber: card.collectorNumber,
      entryUsd: card.currentUsd,
      action: card.action,
      thesis: card.thesis,
      prediction: card.prediction,
      outcome: null,
    }))
    .filter(
      record =>
        !activeKeys.has(
          `${record.dateKey}:${record.setCode}:${record.collectorNumber || record.name}`
        )
    );
  const refreshedRecords = priorRecords.map(record => {
    if (
      record.outcome ||
      !record.prediction?.evaluationDate ||
      record.prediction.evaluationDate > generatedDate
    )
      return record;
    const latest = (snapshot.signals || []).find(
      signal =>
        signal.setCode === record.setCode &&
        (signal.collectorNumber || null) === (record.collectorNumber || null) &&
        signal.name === record.name
    );
    if (
      !latest ||
      typeof record.entryUsd !== "number" ||
      typeof latest.currentUsd !== "number"
    )
      return {
        ...record,
        outcome: {
          status: "UNRESOLVED",
          evaluatedAt: generatedDate,
          reason: "No exact-printing price in the current snapshot.",
        },
      };
    const change =
      ((latest.currentUsd - record.entryUsd) /
        Math.max(record.entryUsd, 0.01)) *
      100;
    const direction = change > 2 ? "UP" : change < -2 ? "DOWN" : "FLAT";
    const expected = record.prediction.expectedDirection;
    return {
      ...record,
      outcome: {
        status: expected === "FLAT_OR_UNCERTAIN" ? "OBSERVED" : "EVALUATED",
        correct: expected === direction,
        evaluatedAt: generatedDate,
        actualChangePct: Number(change.toFixed(2)),
        actualDirection: direction,
      },
    };
  });
  const nextLedger = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    records: [...newRecords, ...refreshedRecords].slice(0, 2500),
  };
  const existingPosts = Array.isArray(previousFeed.posts)
    ? previousFeed.posts
    : [];
  const posts = [post, ...existingPosts.filter(entry => entry.id !== post.id)]
    .sort(
      (a, b) => b.dateKey.localeCompare(a.dateKey) || b.id.localeCompare(a.id)
    )
    .slice(0, 90);
  const feed = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    schedule: {
      daily: "08:00 UTC",
      topicExpansion: "weekday rotation",
      biweeklyTop10: "every other Friday",
    },
    posts,
  };
  await Promise.all([
    mkdir(dirname(feedFile), { recursive: true }),
    mkdir(archiveDirectory, { recursive: true }),
  ]);
  await Promise.all([
    writeFile(feedFile, `${JSON.stringify(feed, null, 2)}\n`, "utf8"),
    writeFile(
      resolve(archiveDirectory, `${generatedDate}.json`),
      `${JSON.stringify(post, null, 2)}\n`,
      "utf8"
    ),
    writeFile(
      predictionLedgerFile,
      `${JSON.stringify(nextLedger, null, 2)}\n`,
      "utf8"
    ),
    writeFile(
      clientPredictionLedgerFile,
      `${JSON.stringify(nextLedger, null, 2)}\n`,
      "utf8"
    ),
  ]);
  console.log(
    `Market research feed complete: ${post.title} (${post.cards.length} cards${isBiweekly ? ", biweekly Top 10" : ""}).`
  );
}

const isEntryPoint =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isEntryPoint) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

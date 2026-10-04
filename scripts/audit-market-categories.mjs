import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dailyDir = path.join(root, 'data', 'market', 'daily');
const clientDataDir = path.join(root, 'client', 'src', 'data');
const outputDir = path.join(root, 'data', 'market');

const categorySource = await readFile(path.join(root, 'client', 'src', 'lib', 'dailyMoversEngine.ts'), 'utf8');
const configuredCategories = [...categorySource.matchAll(/\{ id: '([^']+)', label: '([^']+)' \}/g)].map(([, id, label]) => ({ id, label }));
const snapshotFiles = (await readdir(dailyDir)).filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file)).sort();
const snapshots = await Promise.all(snapshotFiles.map(async (file) => ({ date: file.slice(0, 10), ...JSON.parse(await readFile(path.join(dailyDir, file), 'utf8')) })));
const latest = snapshots.at(-1);
const previous = snapshots.at(-2);

const observedCategories = [...new Set(snapshots.flatMap((snapshot) => snapshot.signals.map((signal) => signal.category)))].sort();
const latestCategories = [...new Set((latest?.signals ?? []).map((signal) => signal.category))].sort();
const categoryRows = configuredCategories.map((category) => {
  const observations = snapshots.flatMap((snapshot) => snapshot.signals.filter((signal) => signal.category === category.id));
  return {
    ...category,
    observedInDailyFeed: observations.length > 0,
    observationCount: observations.length,
    latestCount: latest?.signals.filter((signal) => signal.category === category.id).length ?? 0,
    lastObservedDate: snapshots.findLast((snapshot) => snapshot.signals.some((signal) => signal.category === category.id))?.date ?? null,
  };
});
const unconfiguredObservedCategories = observedCategories.filter((category) => !configuredCategories.some((configured) => configured.id === category));

const latestSignals = [...(latest?.signals ?? [])];
const previousByKey = new Map((previous?.signals ?? []).map((signal) => [signal.key ?? signal.id, signal]));
const recentSnapshots = snapshots.slice(-7);
const recentByKey = new Map();
for (const snapshot of recentSnapshots) {
  for (const signal of snapshot.signals) {
    const key = signal.key ?? signal.id;
    const history = recentByKey.get(key) ?? [];
    history.push({ date: snapshot.date, price: Number(signal.currentUsd), signal });
    recentByKey.set(key, history);
  }
}
const signalRows = latestSignals.map((signal) => {
  const prior = previousByKey.get(signal.key ?? signal.id);
  const priceDelta = prior ? Number((Number(signal.currentUsd) - Number(prior.currentUsd)).toFixed(2)) : null;
  const pctDelta = prior ? Number((((Number(signal.currentUsd) - Number(prior.currentUsd)) / Number(prior.currentUsd || 1)) * 100).toFixed(2)) : null;
  const history = recentByKey.get(signal.key ?? signal.id) ?? [];
  const first = history[0];
  const sevenDayPriceDelta = first ? Number((Number(signal.currentUsd) - first.price).toFixed(2)) : null;
  const sevenDayPctChange = first && first.price > 0 ? Number((((Number(signal.currentUsd) - first.price) / first.price) * 100).toFixed(2)) : null;
  return { ...signal, priceDelta, pctDelta, sevenDayPriceDelta, sevenDayPctChange, firstObservedDate: first?.date ?? null };
});
const topGainers = signalRows.filter((signal) => Number(signal.sevenDayPctChange ?? signal.pctDelta ?? signal.percentChange) > 0).sort((a, b) => Number(b.sevenDayPctChange ?? b.pctDelta ?? b.percentChange) - Number(a.sevenDayPctChange ?? a.pctDelta ?? a.percentChange)).slice(0, 5);
const topDecliners = signalRows.filter((signal) => Number(signal.sevenDayPctChange ?? signal.pctDelta ?? signal.percentChange) < 0).sort((a, b) => Number(a.sevenDayPctChange ?? a.pctDelta ?? a.percentChange) - Number(b.sevenDayPctChange ?? b.pctDelta ?? b.percentChange)).slice(0, 5);
const categoryMomentum = latestCategories.map((category) => {
  const rows = signalRows.filter((signal) => signal.category === category);
  const changes = rows.map((signal) => Number(signal.sevenDayPctChange ?? signal.pctDelta ?? signal.percentChange));
  return { category, cards: rows.length, averagePctChange: Number((changes.reduce((sum, value) => sum + value, 0) / Math.max(changes.length, 1)).toFixed(2)), positiveSignals: changes.filter((value) => value > 0).length, negativeSignals: changes.filter((value) => value < 0).length };
}).sort((a, b) => b.averagePctChange - a.averagePctChange);

const moverPrompt = `Act as an MTG market analyst. Using only the attached site snapshot, explain the strongest market signals without treating a single low-liquidity print as proof of durable demand. Prioritize: (1) category momentum, (2) cards with repeat observations, (3) price direction and absolute move, (4) reprint or variant risk, and (5) what evidence would invalidate the thesis. Cite the pricing date ${latest?.date ?? 'unknown'} and distinguish observed data from speculation.`;
const findings = [
  `The latest feed is dated ${latest?.date ?? 'unknown'} and contains ${latestSignals.length} signals across ${latestCategories.length} observed categories; seven-day momentum is used when the latest file is flat.`,
  categoryMomentum[0] ? `${categoryMomentum[0].category} is the strongest latest category by average observed change (${categoryMomentum[0].averagePctChange}%).` : 'No category momentum could be calculated.',
  topGainers[0] ? `${topGainers[0].name} is the strongest seven-day gainer at ${Number(topGainers[0].sevenDayPctChange ?? topGainers[0].pctDelta ?? topGainers[0].percentChange).toFixed(2)}%. Verify liquidity before treating it as a trend.` : 'No positive seven-day signal was found.',
  topDecliners[0] ? `${topDecliners[0].name} is the sharpest seven-day decliner at ${Number(topDecliners[0].sevenDayPctChange ?? topDecliners[0].pctDelta ?? topDecliners[0].percentChange).toFixed(2)}%, making reprint or demand exhaustion a risk to investigate.` : 'No negative seven-day signal was found.',
  unconfiguredObservedCategories.length ? `The data feed contains categories not represented in the configured site tabs: ${unconfiguredObservedCategories.join(', ')}.` : 'All observed daily categories are represented in the configured site tabs.',
];

const audit = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  pricingDate: latest?.date ?? null,
  snapshotCount: snapshots.length,
  configuredCategories: categoryRows,
  observedDailyCategories: observedCategories,
  latestDailyCategories: latestCategories,
  unconfiguredObservedCategories,
  categoryMomentum,
  topGainers,
  topDecliners,
  findings,
  moverPrompt,
  methodology: 'Computed from repository daily market snapshots. Latest changes compare the two most recent dated files; seven-day momentum compares the first and last observation for each signal in the most recent seven dated files.',
};

await writeFile(path.join(outputDir, 'category-signal-audit.json'), JSON.stringify(audit, null, 2) + '\n');
await writeFile(path.join(clientDataDir, 'marketSignalAudit.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify({ pricingDate: audit.pricingDate, snapshotCount: audit.snapshotCount, configuredCategories: configuredCategories.length, observedDailyCategories: observedCategories.length, latestSignals: latestSignals.length, topGainers: topGainers.map((signal) => signal.name), topDecliners: topDecliners.map((signal) => signal.name), unconfiguredObservedCategories }, null, 2));

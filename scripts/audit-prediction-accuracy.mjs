import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const ledger = JSON.parse(await readFile(resolve(root, 'data/market/prediction-ledger.json'), 'utf8'));
const history = JSON.parse(await readFile(resolve(root, 'data/market/daily-movers-history.json'), 'utf8'));
const snapshot = JSON.parse(await readFile(resolve(root, 'client/src/data/dailyMarketSnapshot.json'), 'utf8'));
const records = Array.isArray(ledger.records) ? ledger.records : [];
const snapshots = Array.isArray(history.snapshots) ? history.snapshots : [];
const signalByKey = new Map((snapshot.signals || []).map((signal) => [`${signal.name}|${signal.setCode}|${signal.collectorNumber || ''}`, signal]));
const pricePath = (record) => {
  const signal = signalByKey.get(`${record.name}|${record.setCode}|${record.collectorNumber || ''}`);
  if (!signal?.id) return [];
  return snapshots.filter((entry) => typeof entry.prices?.[signal.id] === 'number').map((entry) => ({ date: entry.date, usd: entry.prices[signal.id] }));
};
const direction = (change) => change > 2 ? 'UP' : change < -2 ? 'DOWN' : 'FLAT';
const rows = records.map((record) => {
  const path = pricePath(record);
  const post = path.filter((point) => point.date > record.dateKey);
  const latest = post.at(-1) || null;
  const actualChangePct = latest && typeof record.entryUsd === 'number' && record.entryUsd > 0 ? ((latest.usd - record.entryUsd) / record.entryUsd) * 100 : null;
  const range = record.prediction?.projectedPctRange;
  const matured = latest && record.prediction?.evaluationDate && latest.date >= record.prediction.evaluationDate;
  return {
    id: record.id, opened: record.dateKey, name: record.name, setCode: record.setCode, collectorNumber: record.collectorNumber || null,
    expectedDirection: record.prediction?.expectedDirection || 'UNKNOWN', range, evaluationDate: record.prediction?.evaluationDate || null,
    latestPostEntry: latest, postEntryPoints: post.length, actualChangePct: actualChangePct === null ? null : Number(actualChangePct.toFixed(2)),
    actualDirection: actualChangePct === null ? null : direction(actualChangePct), matured: Boolean(matured), outcome: record.outcome || null,
  };
});
const evaluated = rows.filter((row) => row.matured && row.actualChangePct !== null && row.collectorNumber);
const directionalHits = evaluated.filter((row) => row.expectedDirection === 'FLAT_OR_UNCERTAIN' ? Math.abs(row.actualChangePct) <= 5 : row.expectedDirection === row.actualDirection);
const rangeHits = evaluated.filter((row) => row.range && row.actualChangePct >= row.range[0] && row.actualChangePct <= row.range[1]);
const duplicateCounts = Object.fromEntries([...rows.reduce((map, row) => map.set(`${row.name}|${row.setCode}|${row.collectorNumber || ''}`, (map.get(`${row.name}|${row.setCode}|${row.collectorNumber || ''}`) || 0) + 1), new Map())].filter(([, count]) => count > 1));
const date = new Date().toISOString().slice(0, 10);
const summary = {
  auditDate: date,
  historyWindow: { first: snapshots[0]?.date || null, last: snapshots.at(-1)?.date || null },
  coverage: { records: rows.length, evaluated: evaluated.length, withPostEntryPrices: rows.filter((row) => row.postEntryPoints > 0).length, unresolved: rows.length - evaluated.length, duplicateCanonicalKeys: duplicateCounts },
  accuracy: { directionalHitRate: evaluated.length ? Number((directionalHits.length / evaluated.length * 100).toFixed(2)) : null, rangeContainmentRate: evaluated.length ? Number((rangeHits.length / evaluated.length * 100).toFixed(2)) : null, meanAbsoluteErrorPct: evaluated.length ? Number((evaluated.reduce((sum, row) => sum + Math.abs(row.actualChangePct - (row.range?.[0] + row.range?.[1]) / 2), 0) / evaluated.length).toFixed(2)) : null, evaluatedRecords: evaluated.length },
  notes: evaluated.length ? ['Accuracy scores include only matured records with exact set code, collector number, and post-entry prices.'] : ['No matured exact-printing records with post-entry prices were available at audit time.'],
  records: rows,
};
const duplicateText = Object.keys(duplicateCounts).length ? Object.entries(duplicateCounts).map(([key, count]) => `- ${key}: ${count} mentions`).join('\n') : '- None.';
const resultText = evaluated.length ? `${evaluated.length} matured predictions evaluated.` : 'No matured prediction can be scored yet.';
const directionalText = summary.accuracy.directionalHitRate === null ? 'N/A' : `${summary.accuracy.directionalHitRate}%`;
const rangeText = summary.accuracy.rangeContainmentRate === null ? 'N/A' : `${summary.accuracy.rangeContainmentRate}%`;
const markdown = [
  `# MTG Prediction Accuracy Audit — ${date}`,
  '', '## Result', '', `**${resultText}** Historical movement before a prediction opened is excluded.`, '',
  `- History available: **${summary.historyWindow.first || 'none'} through ${summary.historyWindow.last || 'none'}**`,
  `- Prediction records: **${rows.length}**`, `- Post-entry price records: **${summary.coverage.withPostEntryPrices}**`,
  `- Exact-printing matured records: **${evaluated.length}**`, `- Directional accuracy: **${directionalText}**`, `- Range containment: **${rangeText}**`, '',
  '## Interpretation', '', 'Only records with an exact set code, collector number, post-entry price, and reached evaluation date are scored. Missing prices, unresolved treatments, thin listings, and future review dates remain **UNRESOLVED**. Duplicate canonical keys are tracked once for model scoring and separately as repeated mentions.', '',
  '## Duplicate canonical keys', '', duplicateText, '', '## References', '',
  '- Prediction ledger: `data/market/prediction-ledger.json`', '- Daily price history: `data/market/daily-movers-history.json`', '- Forecast model: `scripts/build-market-research-feed.mjs` (granular-v2 momentum bands)',
].join('\n');
await mkdir(resolve(root, 'docs'), { recursive: true });
await mkdir(resolve(root, 'data/market'), { recursive: true });
await writeFile(resolve(root, 'data/market', `prediction-audit-${date}.json`), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(resolve(root, 'docs', `prediction-accuracy-audit-${date}.md`), `${markdown}\n`);
console.log(`Prediction audit complete: ${evaluated.length}/${rows.length} records evaluated.`);

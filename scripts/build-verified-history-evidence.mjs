import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Curated retrospective windows, not forecasts or a representative return sample.
const sourceCommit = 'f8f721ecbbb49e590aedbb101887b6238a5db0dc';
const sourceFile = (path) => execFileSync('git', ['show', `${sourceCommit}:${path}`], { encoding: 'utf8' });
const history = JSON.parse(sourceFile('data/market/daily-movers-history.json')).snapshots;
const selections = [
  { uuid: '40470d4d-f834-59ae-9af3-de01926a221a', start: '2026-10-06', end: '2026-10-11' },
  { uuid: 'd0d8e204-7951-522c-80b9-a39c995bbc8a', start: '2026-10-12', end: '2026-10-13' },
  { uuid: '0a573387-0cbb-55f0-8b82-f300660b58eb', start: '2026-10-06', end: '2026-10-16' },
];
function observation(uuid, snapshot) {
  const artifact = `data/market/daily/${snapshot.date}.json`;
  const raw = sourceFile(artifact);
  const row = JSON.parse(raw).signals.find((signal) => signal.id === uuid);
  if (!row || row.source !== 'MTGJSON' || row.tcgplayerMarketUsd !== snapshot.prices[uuid] || row.currentUsd !== row.tcgplayerMarketUsd) {
    throw new Error(`Unreconciled MTGJSON/TCGplayer reference observation: ${uuid} ${snapshot.date}`);
  }
  return { date: snapshot.date, capturedAt: snapshot.generatedAt, usd: row.tcgplayerMarketUsd, artifact, artifactSha256: createHash('sha256').update(raw).digest('hex'), name: row.name, setCode: row.setCode, collectorNumber: row.collectorNumber };
}
const dips = selections.map(({ uuid, start, end }) => {
  const points = history.filter((snapshot) => snapshot.date >= start && snapshot.date <= end).map((snapshot) => observation(uuid, snapshot));
  const first = points[0];
  if (!first || first.date !== start || points.at(-1).date !== end || points.some((point) => point.name !== first.name || point.setCode !== first.setCode || point.collectorNumber !== first.collectorNumber)) throw new Error('Missing or mixed-printing window');
  const latest = observation(uuid, history.filter((snapshot) => snapshot.prices[uuid] !== undefined).at(-1));
  return { uuid, name: first.name, setCode: first.setCode, collectorNumber: first.collectorNumber, percentChange: Number(((points.at(-1).usd / first.usd - 1) * 100).toFixed(2)), points, latest };
});
const pending = [
  ['Ink-Treader Nephilim', '2026-10-22'], ['Last Laugh', '2026-10-22'],
  ['Caller of the Claw', '2026-10-30'], ['Jet Medallion', '2026-10-30'], ['Abstergo Entertainment', '2026-10-30'],
  ['Haliya, Guided by Light', '2026-10-30'], ['The Theorist, Jace Beleren', '2026-10-30'], ['Ripples of Potential', '2026-10-30'], ['Tivit, Seller of Secrets', '2026-10-30'],
  ['Molecule Man', '2026-11-14'], ['Doom’s Time Platform', '2026-11-14'],
];
const evidence = {
  schemaVersion: 1,
  checkedAt: '2026-10-17T21:19:08Z',
  priceSource: 'Archived MTGJSON-derived TCGplayer reference-price observations in the production daily artifacts',
  sourceCommit,
  methodology: 'Each displayed USD value matches both the saved daily history and that day’s MTGJSON-derived tcgplayerMarketUsd field for the same card UUID, set, and collector number. Dates are capture dates, not guaranteed underlying vendor price dates. The importer prefers normal prices but permits finish fallback; finish is not preserved in these artifacts. These are normalized reference values, not independently audited nonfoil quotes or completed sales. No causal explanation or live quote is inferred. Windows were selected retrospectively to illustrate declines, not to measure overall performance.',
  formula: '(ending reference USD / starting reference USD − 1) × 100',
  dips,
  notionReviewCheck: {
    source: 'Authorized Notion Prediction Reviews — public research fields only',
    checkedAt: '2026-10-17T21:19:08Z',
    note: 'Read-only check. All Actual Outcome fields say Pending review. The source select value Mixed does not resolve a pending record. This newer check is separate from the older static source snapshot below and from the tracker-generated prediction ledger.',
    records: pending.map(([name, reviewDate]) => ({ name, reviewDate, sourceStatus: 'Mixed', actualOutcome: 'Pending review.', resolution: 'pending' })),
  },
  studies: [
    {
      id: 'stanford-2014', title: 'Stanford CS229 · 2014', kind: 'External academic backtest',
      result: 'The logistic-regression model reported 11% classification error on 3,405 held-out test samples.',
      context: '13,608 rare/mythic card-date samples from May 2012–August 2014; 75% train / 25% test. The label examined a price increase of at least $0.50 over the following week.',
      limitation: 'Retrospective historical evaluation, not a timestamped public trading recommendation or a tracker win. The split does not establish a forward-only live trial. No realized investment return is claimed.',
      sourceUrl: 'https://cs229.stanford.edu/proj2014/Matt%20Pawlicki,%20Joe%20Polin,%20Jesse%20Zhang,%20Prediction%20of%20Price%20Increase%20for%20MTG%20Cards.pdf',
    },
    {
      id: 'tru-2024', title: 'Thompson Rivers University · 2024', kind: 'External academic backtest',
      result: 'For card LRW.145, the NN2 forecast-combination example reported 1.06% MAPE, versus a 9.31% base-model average.',
      context: 'Roberto Primo Curti Sanches used weekly historical data from September 2013–September 2023 and held out the last 12 observations (about three months). MAPE measures average absolute percentage forecast error.',
      limitation: 'A retrospective, card-specific model comparison, not a market-wide accuracy score, contemporaneous public call, realized return, or tracker win.',
      sourceUrl: 'https://tru.arcabc.ca/_flysystem/repo-bin/2024-10/tru_6495.pdf',
      repositoryUrl: 'https://tru.arcabc.ca/node/3151',
    },
  ],
};
for (const path of ['client/src/data/verifiedHistoricalEvidence.json', 'client/public/verified-history-evidence.json']) writeFileSync(path, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Built ${dips.length} archived dip replays, ${pending.length} pending source reviews, and ${evidence.studies.length} external backtests.`);

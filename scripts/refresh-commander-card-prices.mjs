import { readFile, rename, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';

const snapshotPath =
  process.argv[2] || 'client/src/data/commanderCardPriceSnapshot.json';
const metadataPath =
  process.argv[3] || 'client/src/data/commanderCardPriceMeta.json';
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const records = Array.isArray(snapshot.records) ? snapshot.records : [];
const byUuid = new Map(
  records.filter(record => record.uuid).map(record => [record.uuid, record])
);

const metaResult = spawnSync(
  'curl',
  ['-fsSL', '--max-time', '30', 'https://mtgjson.com/api/v5/Meta.json'],
  { encoding: 'utf8' }
);
if (metaResult.error || metaResult.status !== 0) {
  throw new Error(
    `Unable to retrieve MTGJSON Meta.json: ${metaResult.stderr || metaResult.error || metaResult.status}`
  );
}
const meta = JSON.parse(metaResult.stdout);
const sourceBuildDate = meta.meta?.date || meta.data?.date || null;
const sourceVersion = meta.meta?.version || meta.data?.version || null;
if (!sourceBuildDate)
  throw new Error('MTGJSON Meta.json did not contain a build date.');

const vendorPrices = new Map();
const command = `curl -fsSL --max-time 240 https://mtgjson.com/api/v5/AllPricesToday.json.gz | gzip -dc | jq --stream -c '
  select(
    length == 2
    and .[0][0] == "data"
    and .[0][2] == "paper"
    and ((.[0][3] == "tcgplayer") or (.[0][3] == "cardkingdom") or (.[0][3] == "cardmarket"))
    and (
      ((.[0][4] == "currency") and (.[0] | length == 5))
      or ((.[0][4] == "retail") and (.[0][5] == "normal") and (.[0] | length == 7))
    )
  )
  | if .[0][4] == "currency" then
      {uuid: .[0][1], vendor: .[0][3], currency: .[1]}
    else
      {uuid: .[0][1], vendor: .[0][3], date: .[0][6], price: .[1]}
    end
'`;
const childProcess = spawn('sh', ['-c', command], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stderr = '';
childProcess.stderr.on('data', chunk => {
  stderr += chunk.toString();
});
let buffer = '';
childProcess.stdout.on('data', chunk => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (!byUuid.has(row.uuid)) continue;
      const current = vendorPrices.get(row.uuid) || {
        prices: {},
        currencies: {},
        dates: {},
      };
      if (typeof row.currency === 'string')
        current.currencies[row.vendor] = row.currency;
      if (typeof row.price === 'number' && row.price > 0) {
        current.prices[row.vendor] = row.price;
        current.dates[row.vendor] = row.date;
      }
      vendorPrices.set(row.uuid, current);
    } catch {
      // Ignore malformed stream lines; the final coverage count makes gaps explicit.
    }
  }
});
const exitCode = await new Promise(resolve =>
  childProcess.on('close', resolve)
);
if (exitCode !== 0) {
  throw new Error(
    `MTGJSON price stream failed (${exitCode}): ${stderr.slice(-600)}`
  );
}
if (buffer.trim()) {
  try {
    const row = JSON.parse(buffer);
    if (byUuid.has(row.uuid)) {
      const current = vendorPrices.get(row.uuid) || {
        prices: {},
        currencies: {},
        dates: {},
      };
      if (typeof row.currency === 'string')
        current.currencies[row.vendor] = row.currency;
      if (typeof row.price === 'number' && row.price > 0) {
        current.prices[row.vendor] = row.price;
        current.dates[row.vendor] = row.date;
      }
      vendorPrices.set(row.uuid, current);
    }
  } catch {
    // The main stream parser already reports coverage; an incomplete final line is ignored.
  }
}

const observedPriceDates = [...vendorPrices.values()]
  .flatMap(row => Object.values(row.dates))
  .filter(Boolean)
  .sort();
const priceDate = observedPriceDates.at(-1) || null;
if (!priceDate)
  throw new Error(
    'No eligible paper normal retail prices were found for the local archive.'
  );

const refreshedAt = new Date().toISOString();
let resolved = 0;
for (const record of records) {
  const row = record.uuid ? vendorPrices.get(record.uuid) : undefined;
  const prices = row?.prices || {};
  const currencies = row?.currencies || {};
  const tcgplayerUsd =
    currencies.tcgplayer === 'USD' ? (prices.tcgplayer ?? null) : null;
  const cardkingdomUsd =
    currencies.cardkingdom === 'USD' ? (prices.cardkingdom ?? null) : null;
  const usd = tcgplayerUsd ?? cardkingdomUsd;

  // Replace the old quote on every record, including records absent from today's feed.
  // Cardmarket is retained in its native currency and is never treated as USD equity.
  record.usd = usd;
  record.prices = {
    tcgplayer: prices.tcgplayer ?? null,
    tcgplayerCurrency: currencies.tcgplayer ?? null,
    cardkingdom: prices.cardkingdom ?? null,
    cardkingdomCurrency: currencies.cardkingdom ?? null,
    cardmarket: prices.cardmarket ?? null,
    cardmarketCurrency: currencies.cardmarket ?? null,
  };
  record.source =
    [
      tcgplayerUsd && 'MTGJSON / TCGplayer (USD)',
      cardkingdomUsd && 'MTGJSON / Card Kingdom (USD)',
    ]
      .filter(Boolean)
      .join(' + ') || 'No eligible USD price in MTGJSON AllPricesToday';
  record.updated_at = row
    ? Object.values(row.dates).filter(Boolean).sort().at(-1) || priceDate
    : priceDate;
  if (typeof usd === 'number' && usd > 0) resolved += 1;
}

snapshot.generatedAt = refreshedAt;
snapshot.source = 'MTGJSON AllPricesToday';
snapshot.sourceBuildDate = sourceBuildDate;
snapshot.sourceVersion = sourceVersion;
snapshot.sourceUrl = 'https://mtgjson.com/api/v5/AllPricesToday.json.gz';
snapshot.priceDate = priceDate;
snapshot.currencyPolicy =
  'USD equity uses TCGplayer and Card Kingdom USD quotes; Cardmarket is retained in EUR and excluded from USD estimates.';
snapshot.coverage = {
  total: records.length,
  resolved,
  unresolved: records.length - resolved,
  tcgplayer: records.filter(
    record =>
      record.prices?.tcgplayerCurrency === 'USD' &&
      typeof record.prices?.tcgplayer === 'number'
  ).length,
  cardkingdom: records.filter(
    record =>
      record.prices?.cardkingdomCurrency === 'USD' &&
      typeof record.prices?.cardkingdom === 'number'
  ).length,
  cardmarket: records.filter(
    record =>
      record.prices?.cardmarketCurrency === 'EUR' &&
      typeof record.prices?.cardmarket === 'number'
  ).length,
  usdCurrency: 'USD',
  cardmarketCurrency: 'EUR',
};
snapshot.records = records;
const tempPath = `${snapshotPath}.tmp`;
const metadata = {
  generatedAt: snapshot.generatedAt,
  priceDate: snapshot.priceDate,
  source: snapshot.source,
  coverage: snapshot.coverage,
};
const metadataTempPath = `${metadataPath}.tmp`;
await writeFile(metadataTempPath, `${JSON.stringify(metadata, null, 2)}\n`);
await writeFile(tempPath, `${JSON.stringify(snapshot, null, 2)}\n`);
await rename(tempPath, snapshotPath);
await rename(metadataTempPath, metadataPath);

console.log(
  `MTGJSON build: ${sourceVersion || 'version unavailable'} (${sourceBuildDate})`
);
console.log(`Latest eligible quote date: ${priceDate}`);
const recordsWithQuotes = [...vendorPrices.values()].filter(
  row => Object.keys(row.prices).length > 0
).length;
console.log(
  `Matched ${records.length} local archive card identifiers; current quotes are present for ${recordsWithQuotes}.`
);
console.log(
  `USD price coverage: ${snapshot.coverage.resolved}/${snapshot.coverage.total} identifiers; ${snapshot.coverage.unresolved} missing USD quotes.`
);
console.log(
  `Vendor availability: TCGplayer ${snapshot.coverage.tcgplayer}; Card Kingdom ${snapshot.coverage.cardkingdom}; Cardmarket ${snapshot.coverage.cardmarket} EUR quotes (excluded from USD equity).`
);

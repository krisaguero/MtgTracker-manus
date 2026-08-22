import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const snapshotPath = process.argv[2] || 'client/src/data/commanderCardPriceSnapshot.json';
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
const records = Array.isArray(snapshot.records) ? snapshot.records : [];
const byUuid = new Map(records.filter((record) => record.uuid).map((record) => [record.uuid, record]));
const vendorPrices = new Map();

const command = "curl -fsSL --max-time 240 https://mtgjson.com/api/v5/AllPricesToday.json.gz | gzip -dc | jq --stream -c 'select(length == 2 and .[0][0] == \"data\" and (.[0][2] == \"paper\") and ((.[0][3] == \"tcgplayer\") or (.[0][3] == \"cardkingdom\") or (.[0][3] == \"cardmarket\")) and .[0][4] == \"retail\" and .[0][5] == \"normal\" and (.[0] | length == 7)) | {uuid: .[0][1], vendor: .[0][3], date: .[0][6], usd: .[1]}'";
const childProcess = spawn('sh', ['-c', command], { stdio: ['ignore', 'pipe', 'pipe'] });
let stderr = '';
childProcess.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
let buffer = '';
childProcess.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (!byUuid.has(row.uuid) || typeof row.usd !== 'number' || row.usd <= 0) continue;
      const current = vendorPrices.get(row.uuid) || {};
      current[row.vendor] = row.usd;
      current.date = row.date;
      vendorPrices.set(row.uuid, current);
    } catch {
      // Ignore malformed stream lines; the final coverage count makes gaps explicit.
    }
  }
});
const exitCode = await new Promise((resolve) => childProcess.on('close', resolve));
if (exitCode !== 0) throw new Error(`MTGJSON price stream failed (${exitCode}): ${stderr.slice(-600)}`);

const refreshedAt = new Date().toISOString();
let resolved = 0;
for (const record of records) {
  const prices = record.uuid ? vendorPrices.get(record.uuid) : undefined;
  if (!prices) continue;
  const primary = prices.tcgplayer ?? prices.cardkingdom ?? prices.cardmarket ?? null;
  record.usd = typeof primary === 'number' && primary > 0 ? primary : null;
  record.prices = {
    tcgplayer: prices.tcgplayer ?? null,
    cardkingdom: prices.cardkingdom ?? null,
    cardmarket: prices.cardmarket ?? null,
  };
  record.source = [prices.tcgplayer && 'MTGJSON / TCGplayer', prices.cardkingdom && 'MTGJSON / Card Kingdom', prices.cardmarket && 'MTGJSON / Cardmarket'].filter(Boolean).join(' + ');
  record.updated_at = prices.date || refreshedAt.slice(0, 10);
  resolved += record.usd ? 1 : 0;
}

snapshot.generatedAt = refreshedAt;
snapshot.source = 'MTGJSON AllPricesToday';
snapshot.priceDate = Array.from(vendorPrices.values()).map((row) => row.date).filter(Boolean).sort().pop() || null;
snapshot.coverage = {
  total: records.length,
  resolved,
  unresolved: records.length - resolved,
  tcgplayer: records.filter((record) => typeof record.prices?.tcgplayer === 'number').length,
  cardkingdom: records.filter((record) => typeof record.prices?.cardkingdom === 'number').length,
  cardmarket: records.filter((record) => typeof record.prices?.cardmarket === 'number').length,
};
snapshot.records = records;
await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Joined ${vendorPrices.size} price records from MTGJSON AllPricesToday.`);
console.log(`Price coverage: ${snapshot.coverage.resolved}/${snapshot.coverage.total} identifiers; price date ${snapshot.priceDate || 'unknown'}.`);

import { publicProcedure, router } from "../_core/trpc.js";
import fs from "fs";
import path from "path";
import parquetjs from "parquetjs-lite";
import type { MarketEndpointResponse, MarketRow } from "../../shared/market.js";

const { ParquetReader } = parquetjs;
const PARQUET_DIR = path.resolve(process.cwd(), "data", "parquet");

function toNumber(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toRecentPrices(value: unknown, currentPrice: number, pastPrice: number) {
  let candidate = value;
  if (typeof value === "string") {
    try {
      candidate = JSON.parse(value);
    } catch {
      candidate = undefined;
    }
  }
  if (Array.isArray(candidate)) {
    const parsed = candidate.map(toNumber).filter((price) => price >= 0);
    if (parsed.length > 0) return parsed;
  }
  return [pastPrice, currentPrice];
}

function normalizeRow(raw: Record<string, unknown>): MarketRow | null {
  const name = String(raw.name ?? "").trim();
  // Filter out hex-ID placeholders or invalid names
  if (!name || /^[0-9a-f]{4,}$/i.test(name) || name.toLowerCase() === 'unknown card') {
    return null;
  }
  const currentPrice = toNumber(raw.current_price);
  const pastPrice = toNumber(raw.past_price);
  return {
    name,
    set_code: String(raw.set_code ?? ""),
    rarity: String(raw.rarity ?? "rare"),
    is_reserved: Boolean(raw.is_reserved),
    provider: String(raw.provider ?? "unknown"),
    current_price: currentPrice,
    past_price: pastPrice,
    pct_change: toNumber(raw.pct_change),
    recent_prices: toRecentPrices(raw.recent_prices, currentPrice, pastPrice),
    category: String(raw.category ?? "daily-movers"),
    signal_source: String(raw.signal_source ?? "Scryfall Snapshot"),
  };
}

async function readParquetView(fileName: string, limit: number): Promise<MarketEndpointResponse> {
  const parquetPath = path.join(PARQUET_DIR, fileName);
  if (!fs.existsSync(parquetPath)) {
    return { source: "fallback", rows: [], generatedAt: new Date().toISOString() };
  }

  try {
    const reader: any = await ParquetReader.openFile(parquetPath);
    const cursor = reader.getCursor();
    const rows: MarketRow[] = [];
    let record: Record<string, unknown> | null = await cursor.next();

    while (record) {
      const normalized = normalizeRow(record);
      if (normalized) {
        rows.push(normalized);
      }
      record = await cursor.next();
    }

    await reader.close();
    rows.sort((left, right) => right.pct_change - left.pct_change);

    return {
      source: "parquet",
      rows: rows.slice(0, Math.max(1, Math.min(limit, 500))),
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Parquet query failed for ${fileName}:`, error);
    return { source: "fallback", rows: [], generatedAt: new Date().toISOString() };
  }
}

export const marketRouter = router({
  getMovers: publicProcedure.query(() => readParquetView("daily_movers.parquet", 500)),
  getOldSchoolSpikes: publicProcedure.query(() => readParquetView("oldschool_spikes.parquet", 100)),
});

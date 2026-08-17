export type MarketRow = {
  name: string;
  set_code: string;
  rarity: string;
  is_reserved?: boolean;
  provider: string;
  current_price: number;
  past_price: number;
  pct_change: number;
  recent_prices: number[];
  category?: string;
  signal_source?: string;
};

export type MarketEndpointResponse = {
  source: 'duckdb' | 'parquet' | 'fallback';
  rows: MarketRow[];
  generatedAt: string;
};

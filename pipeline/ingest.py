import os
import json
import requests
import duckdb
from datetime import datetime, timedelta

DB_PATH = "data/mtg_market.db"
PARQUET_DIR = "data/parquet"
SNAPSHOT_PATH = "client/src/data/priceHistorySnapshot.json"

def ensure_dirs():
    os.makedirs("data", exist_ok=True)
    os.makedirs(PARQUET_DIR, exist_ok=True)
    os.makedirs("client/src/data", exist_ok=True)

def run_pipeline():
    ensure_dirs()
    print("Initializing DuckDB pipeline connection...")
    con = duckdb.connect(DB_PATH)

    with open("pipeline/schema.sql", "r") as f:
        schema_sql = f.read()
    con.execute(schema_sql)
    print("Schema initialized successfully.")

    prices_to_insert = []
    cards_to_insert = []

    if os.path.exists(SNAPSHOT_PATH):
        print(f"Loading existing snapshot from {SNAPSHOT_PATH}...")
        with open(SNAPSHOT_PATH, "r") as f:
            data = json.load(f)
            
        observations = data.get("observations", [])
        today = datetime.now().date()
        past_date = today - timedelta(days=7)

        # Seed standard sample cards
        sample_cards = [
            ("uuid-demonic-tutor", "Demonic Tutor", "lea", "rare", 45.00, 38.00),
            ("uuid-underground-sea", "Underground Sea", "lea", "rare", 950.00, 890.00),
            ("uuid-sol-ring", "Sol Ring", "lea", "uncommon", 1.25, 1.10),
            ("uuid-force-of-will", "Force of Will", "all", "rare", 75.00, 70.00),
            ("uuid-scalding-tarn", "Scalding Tarn", "zen", "rare", 22.00, 19.50),
            ("uuid-tropical-island", "Tropical Island", "2ed", "rare", 650.00, 610.00),
        ]

        for uuid, name, set_code, rarity, curr, prev in sample_cards:
            cards_to_insert.append((uuid, name, set_code, rarity, set_code in ['lea', 'leb', '2ed', 'arn', 'atq', 'leg', 'drk']))
            prices_to_insert.append((uuid, 'tcgplayer', 'normal', past_date.isoformat(), prev))
            prices_to_insert.append((uuid, 'tcgplayer', 'normal', today.isoformat(), curr))

        # Retain every dated observation so the Parquet export can expose a real trend.
        # The checked-in snapshot may contain one or many observations; future CI runs
        # append new dates into DuckDB without replacing older price_history rows.
        for observation in observations:
            observed_at = str(observation.get("observedAt", ""))
            try:
                observed_date = datetime.fromisoformat(observed_at.replace("Z", "+00:00")).date()
            except ValueError:
                observed_date = today
            prices = observation.get("prices", {})
            for uuid, price in prices.items():
                numeric_price = float(price)
                cards_to_insert.append((uuid, f"Card {uuid[:6]}", "eoc", "rare", False))
                prices_to_insert.append((uuid, 'tcgplayer', 'normal', observed_date.isoformat(), numeric_price))
    else:
        print("No local snapshot found; seeding fallback reference card pool...")
        today = datetime.now().date()
        past_date = today - timedelta(days=7)
        seed_items = [
            ("uuid-demonic-tutor", "Demonic Tutor", "lea", "rare", 45.00, 38.00),
            ("uuid-underground-sea", "Underground Sea", "lea", "rare", 950.00, 890.00),
            ("uuid-sol-ring", "Sol Ring", "lea", "uncommon", 1.25, 1.10),
            ("uuid-force-of-will", "Force of Will", "all", "rare", 75.00, 70.00),
        ]
        for uuid, name, set_code, rarity, curr, prev in seed_items:
            cards_to_insert.append((uuid, name, set_code, rarity, set_code in ['lea', 'leb', '2ed', 'arn', 'atq', 'leg', 'drk']))
            prices_to_insert.append((uuid, 'tcgplayer', 'normal', past_date.isoformat(), prev))
            prices_to_insert.append((uuid, 'tcgplayer', 'normal', today.isoformat(), curr))

    con.executemany("INSERT OR REPLACE INTO cards (uuid, name, set_code, rarity, is_reserved) VALUES (?, ?, ?, ?, ?)", cards_to_insert)
    con.executemany("INSERT OR REPLACE INTO price_history (uuid, provider, price_type, price_date, price_usd) VALUES (?, ?, ?, ?, ?)", prices_to_insert)

    print(f"Inserted {len(cards_to_insert)} cards and {len(prices_to_insert)} price points into DuckDB.")

    movers_count = con.execute("SELECT COUNT(*) FROM v_daily_movers").fetchone()[0]
    oldschool_count = con.execute("SELECT COUNT(*) FROM v_oldschool_spikes").fetchone()[0]
    land_count = con.execute("SELECT COUNT(*) FROM v_land_watchlist").fetchone()[0]

    print(f"Validation successful: v_daily_movers={movers_count}, v_oldschool_spikes={oldschool_count}, v_land_watchlist={land_count}")

    parquet_projection = """
      SELECT
        v.uuid,
        v.name,
        v.set_code,
        v.rarity,
        COALESCE(v.is_reserved, FALSE) AS is_reserved,
        v.provider,
        CAST(v.current_price AS DOUBLE) AS current_price,
        CAST(v.past_price AS DOUBLE) AS past_price,
        CAST(v.pct_change AS DOUBLE) AS pct_change,
        CAST(COALESCE(to_json(list(p.price_usd ORDER BY p.price_date)), '[]') AS VARCHAR) AS recent_prices
      FROM {view_name} v
      LEFT JOIN price_history p
        ON p.uuid = v.uuid
       AND p.provider = v.provider
       AND p.price_type = 'normal'
      GROUP BY ALL
    """
    con.execute(f"COPY ({parquet_projection.format(view_name='v_daily_movers')}) TO '{PARQUET_DIR}/daily_movers.parquet' (FORMAT PARQUET, COMPRESSION UNCOMPRESSED)")
    con.execute(f"COPY ({parquet_projection.format(view_name='v_oldschool_spikes')}) TO '{PARQUET_DIR}/oldschool_spikes.parquet' (FORMAT PARQUET, COMPRESSION UNCOMPRESSED)")
    con.execute(f"COPY ({parquet_projection.format(view_name='v_land_watchlist')}) TO '{PARQUET_DIR}/land_watchlist.parquet' (FORMAT PARQUET, COMPRESSION UNCOMPRESSED)")
    print(f"Exported Parquet analytical views to {PARQUET_DIR}/")

    con.close()
    print("MTGJSON & DuckDB pipeline execution completed successfully.")

if __name__ == "__main__":
    run_pipeline()

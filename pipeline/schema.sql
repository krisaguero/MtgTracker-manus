-- MTGJSON & DuckDB Analytical Pipeline Schema
-- Designed for high-performance serverless and local analytical queries over Magic: The Gathering card and pricing data.

-- 1. Cards Table (Relational projection from MTGJSON AllPrintings.json)
CREATE TABLE IF NOT EXISTS cards (
    uuid VARCHAR PRIMARY KEY,
    scryfall_id VARCHAR,
    name VARCHAR NOT NULL,
    set_code VARCHAR NOT NULL,
    rarity VARCHAR,
    is_reprint BOOLEAN DEFAULT FALSE,
    is_reserved BOOLEAN DEFAULT FALSE,
    color_identity VARCHAR[],
    mana_cost VARCHAR,
    cmc DECIMAL(5,2),
    type VARCHAR
);

-- 2. Daily Price History Table (Parquet / DuckDB partitioned by date)
CREATE TABLE IF NOT EXISTS price_history (
    uuid VARCHAR NOT NULL,
    provider VARCHAR NOT NULL, -- e.g., 'tcgplayer', 'cardkingdom', 'cardmarket'
    price_type VARCHAR NOT NULL, -- 'normal', 'foil'
    price_date DATE NOT NULL,
    price_usd DECIMAL(10,2),
    PRIMARY KEY (uuid, provider, price_type, price_date)
);

-- 3. Set Summary Table
CREATE TABLE IF NOT EXISTS sets (
    set_code VARCHAR PRIMARY KEY,
    set_name VARCHAR NOT NULL,
    release_date DATE,
    set_type VARCHAR,
    total_cards INTEGER
);

-- 4. Analytical View: Daily Movers & Spikes (7-day trailing percentage change)
CREATE OR REPLACE VIEW v_daily_movers AS
WITH latest_prices AS (
    SELECT 
        p.uuid,
        p.provider,
        p.price_type,
        p.price_usd AS current_price,
        p.price_date AS current_date
    FROM price_history p
    WHERE p.price_date = (SELECT MAX(price_date) FROM price_history)
),
past_prices AS (
    SELECT 
        p.uuid,
        p.provider,
        p.price_type,
        p.price_usd AS past_price,
        p.price_date AS past_date
    FROM price_history p
    WHERE p.price_date = (SELECT MAX(price_date) - INTERVAL 7 DAY FROM price_history)
)
SELECT 
    c.uuid,
    c.name,
    c.set_code,
    c.rarity,
    c.is_reserved,
    l.provider,
    l.current_price,
    COALESCE(pp.past_price, l.current_price) AS past_price,
    ROUND(((l.current_price - COALESCE(pp.past_price, l.current_price)) / NULLIF(pp.past_price, 0)) * 100, 2) AS pct_change
FROM latest_prices l
JOIN cards c ON l.uuid = c.uuid
LEFT JOIN past_prices pp ON l.uuid = pp.uuid AND l.provider = pp.provider AND l.price_type = pp.price_type
WHERE pp.past_price IS NOT NULL AND pp.past_price > 0.25;

-- 5. Analytical View: Old-School Spikes (Alpha, Beta, Unlimited, Antiquities, Arabian Nights, Legends)
CREATE OR REPLACE VIEW v_oldschool_spikes AS
SELECT 
    m.*
FROM v_daily_movers m
WHERE m.set_code IN ('lea', 'leb', '2ed', 'arn', 'atq', 'leg', 'drk')
  AND m.pct_change >= 10.0
ORDER BY m.pct_change DESC;

-- 6. Analytical View: Dedicated Land Watchlist (Fetchlands, Duals, Shocklands)
CREATE OR REPLACE VIEW v_land_watchlist AS
SELECT 
    m.*,
    CASE 
        WHEN m.name LIKE '%Dual%' OR m.set_code IN ('2ed', '3ed', 'rev') THEN 'Original Dual'
        WHEN m.name LIKE '%Fetch%' OR m.set_code IN ('zen', 'mh2') THEN 'Fetchland'
        ELSE 'Shockland / Other'
    END as land_category
FROM v_daily_movers m
WHERE m.name LIKE '%Land%' 
   OR m.name IN ('Underground Sea', 'Tropical Island', 'Volcanic Island', 'Tundra', 'Badlands', 'Plateau', 'Savannah', 'Scrubland', 'Taiga', 'Bayou', 'Scalding Tarn', 'Verdant Catacombs', 'Misty Rainforest', 'Arid Mesa', 'Marsh Flats');

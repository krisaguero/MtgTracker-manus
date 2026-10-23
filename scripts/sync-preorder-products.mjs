import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalogFile = resolve(root, "data/releases/preorder-products.json");
const observationsFile = resolve(
  root,
  "data/releases/preorder-product-observations.json"
);
const outputFile = resolve(root, "data/releases/preorder-products.json");

function number(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function round(value) {
  return Number(Number(value).toFixed(2));
}
function daysUntil(releaseDate, asOf) {
  return Math.ceil(
    (new Date(`${releaseDate}T00:00:00Z`) - new Date(`${asOf}T00:00:00Z`)) /
      86400000
  );
}

export function scoreProductRisk(product, asOf) {
  const knownPrices = Object.values(product.prices || {}).filter(number);
  const knownAvailability = Object.values(product.availability || {}).filter(
    value => value && value !== "unknown"
  );
  const spread =
    knownPrices.length >= 2
      ? round(
          ((Math.max(...knownPrices) - Math.min(...knownPrices)) /
            Math.min(...knownPrices)) *
            100
        )
      : null;
  const releaseWindow = daysUntil(product.releaseDate, asOf);
  const factors = [...(product.riskFlags || [])];
  if (releaseWindow >= 0 && releaseWindow <= 30)
    factors.push("release-within-30-days");
  if (knownPrices.length < 2) factors.push("thin-price-coverage");
  if (knownAvailability.some(value => value === "out-of-stock"))
    factors.push("stock-fragmentation");
  if (spread !== null && spread >= 12) factors.push("marketplace-disagreement");
  const score = Math.min(
    100,
    25 + factors.length * 10 + (spread !== null ? Math.min(25, spread) : 0)
  );
  return {
    riskScore: score,
    riskBand: score >= 70 ? "high" : score >= 45 ? "elevated" : "watch",
    releaseWindowDays: releaseWindow,
    marketplaceSpreadPct: spread,
    riskFactors: [...new Set(factors)],
  };
}

export async function syncPreorderProducts(
  asOf = new Date().toISOString().slice(0, 10)
) {
  const catalog = JSON.parse(await readFile(catalogFile, "utf8"));
  let observations = { asOf, products: [] };
  try {
    observations = JSON.parse(await readFile(observationsFile, "utf8"));
  } catch {}
  const byId = new Map(
    (observations.products || []).map(product => [product.id, product])
  );
  const products = catalog.products.map(product => {
    const observed = byId.get(product.id) || {};
    const merged = {
      ...product,
      ...observed,
      prices: { ...product.prices, ...(observed.prices || {}) },
      availability: {
        ...product.availability,
        ...(observed.availability || {}),
      },
    };
    const priced = Object.values(merged.prices).filter(number);
    return {
      ...merged,
      sourceCount: priced.length,
      lastObservedAt: observed.lastObservedAt || product.lastObservedAt || null,
      ...scoreProductRisk(merged, asOf),
    };
  });
  const output = {
    ...catalog,
    asOf,
    status: products.some(product => product.sourceCount > 0)
      ? "observations-loaded"
      : "catalog-seeded-awaiting-retailer-observations",
    products,
  };
  await writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  return output;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  syncPreorderProducts()
    .then(output =>
      console.log(
        `Preorder catalog synced: ${output.products.length} products; ${output.products.filter(product => product.sourceCount > 0).length} with prices.`
      )
    )
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}

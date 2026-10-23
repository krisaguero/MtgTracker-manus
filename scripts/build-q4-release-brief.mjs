import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const catalogFile = resolve(root, "data/releases/preorder-products.json");
const alertFile = resolve(root, "data/market/preorder-volatility-alert.json");
const outputDirectory = resolve(root, "docs/market-briefs");
const asOf = process.env.REPORT_DATE || new Date().toISOString().slice(0, 10);
export async function buildQ4ReleaseBrief() {
  const catalog = JSON.parse(await readFile(catalogFile, "utf8"));
  const alert = JSON.parse(await readFile(alertFile, "utf8"));
  const highRisk = catalog.products.filter(
    product => product.riskBand === "high" || product.riskBand === "elevated"
  );
  const lines = [
    `# Q4 Release Risk Brief — ${asOf}`,
    "",
    "## Scan summary",
    "",
    `- Products tracked: ${catalog.products.length}`,
    `- Products with price observations: ${catalog.products.filter(product => product.sourceCount > 0).length}`,
    `- Volatility alerts: ${alert.alerts.length}`,
    `- Alert status: ${alert.status}`,
    "",
    "## Watchlist",
    "",
  ];
  for (const product of highRisk)
    lines.push(
      `- **${product.name}** (${product.setCode}) — ${product.riskBand} risk, score ${product.riskScore}/100; ${product.riskFactors.join(", ")}.`
    );
  if (!highRisk.length)
    lines.push(
      "- No elevated product-level risk score in the current catalog snapshot. This does not mean the products are low-risk; most are awaiting retailer observations."
    );
  lines.push(
    "",
    "## Guardrail",
    "",
    "This is a monitoring brief, not a purchase recommendation. Preorder prices can be distorted by thin listings, regional delays, and incomplete supply. Recheck exact product identity, retailer availability, and completed sales before acting.",
    ""
  );
  const output = resolve(outputDirectory, `${asOf}-q4-release-risk.md`);
  await (
    await import("node:fs/promises")
  ).mkdir(outputDirectory, { recursive: true });
  await writeFile(output, `${lines.join("\\n")}\\n`, "utf8");
  return output;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  buildQ4ReleaseBrief()
    .then(file => console.log(`Q4 release brief written: ${file}`))
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });

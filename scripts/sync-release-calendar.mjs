import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const releaseDirectory = resolve(root, "data/releases");
const upcomingSetsFile = resolve(releaseDirectory, "upcoming-sets.json");
const preconCalendarFile = resolve(
  releaseDirectory,
  "precon-release-calendar.json"
);

export const SOURCE_URLS = {
  setList: "https://mtgjson.com/api/v5/SetList.json",
  deckList: "https://mtgjson.com/api/v5/DeckList.json",
};

const RELEVANT_SET_TYPES = new Set([
  "core",
  "expansion",
  "commander",
  "draft_innovation",
  "starter",
]);
const PAST_DAYS = 180;
const FUTURE_DAYS = 730;

function parseDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? String(value) : null;
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function statusFor(releaseDate, asOf) {
  return releaseDate <= asOf ? "released" : "upcoming";
}

function source(label, url, type = "structured") {
  return { label, url, type };
}

function stableSources(previousSources, generatedSources) {
  const sources = [
    ...(Array.isArray(previousSources) ? previousSources : []),
    ...generatedSources,
  ];
  const seen = new Set();
  return sources.filter(item => {
    if (!item?.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function readJson(file, fallback) {
  return readFile(file, "utf8")
    .then(value => JSON.parse(value))
    .catch(() => fallback);
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "mtg-sets-tracker-release-calendar/1.0",
    },
  });
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

function setId(record) {
  return String(record?.code || record?.id || "")
    .trim()
    .toUpperCase();
}

function deckId(record) {
  const code = String(record?.code || "")
    .trim()
    .toUpperCase();
  const fileName = String(record?.fileName || record?.name || "").trim();
  return `${code}:${fileName}`;
}

function normalizeSet(raw, previous, sourceBuildDate, asOf) {
  const releaseDate = parseDate(raw.releaseDate);
  const code = setId(raw);
  const status = statusFor(releaseDate, asOf);
  const commanderCompanion = String(raw.name || "")
    .toLowerCase()
    .includes("commander")
    ? code
    : undefined;
  return {
    id: code,
    setCode: code,
    name: raw.name,
    setType: raw.type || "unknown",
    releaseDate,
    status,
    confidence: previous?.confidence || "upstream-structured",
    commanderSetCode: previous?.commanderSetCode || commanderCompanion || null,
    commanderProductStatus:
      previous?.commanderProductStatus ||
      (commanderCompanion ? "catalog-record" : "not-specified"),
    sources: stableSources(previous?.sources, [
      source("MTGJSON set record", `https://mtgjson.com/api/v5/${code}.json`),
      source("MTGJSON SetList", SOURCE_URLS.setList),
    ]),
    notes: previous?.notes || null,
    sourceBuildDate,
  };
}

function normalizePrecon(raw, previous, sourceBuildDate, asOf) {
  const releaseDate = parseDate(raw.releaseDate);
  const id = deckId(raw);
  return {
    id,
    name: raw.name,
    productType: "commander-deck",
    setCode: String(raw.code || "").toUpperCase(),
    setName: previous?.setName || null,
    releaseDate,
    status: statusFor(releaseDate, asOf),
    decklistStatus: "complete",
    confidence: previous?.confidence || "upstream-structured",
    knownDeckNames: previous?.knownDeckNames || [raw.name],
    sources: stableSources(previous?.sources, [
      source(
        "MTGJSON deck record",
        `https://mtgjson.com/api/v5/decks/${raw.fileName}.json`
      ),
      source("MTGJSON DeckList", SOURCE_URLS.deckList),
    ]),
    officialSourceUrl: previous?.officialSourceUrl || null,
    notes: previous?.notes || null,
    sourceBuildDate,
  };
}

function keepInWindow(releaseDate, asOf) {
  return (
    releaseDate >= addDays(asOf, -PAST_DAYS) &&
    releaseDate <= addDays(asOf, FUTURE_DAYS)
  );
}

export function buildReleaseCalendars({
  setList,
  deckList,
  existingSets = {},
  existingPrecons = {},
  asOf,
}) {
  const sourceBuildDate =
    parseDate(setList?.meta?.date) || parseDate(deckList?.meta?.date) || asOf;
  const previousSets = new Map(
    (existingSets.records || []).map(record => [setId(record), record])
  );
  const previousPrecons = new Map(
    (existingPrecons.records || []).map(record => [String(record.id), record])
  );
  const rawSets = Array.isArray(setList?.data) ? setList.data : [];
  const rawDecks = Array.isArray(deckList?.data) ? deckList.data : [];

  const setRecords = rawSets
    .filter(
      record =>
        RELEVANT_SET_TYPES.has(record?.type) &&
        parseDate(record?.releaseDate) &&
        record.releaseDate >= asOf &&
        record.releaseDate <= addDays(asOf, FUTURE_DAYS)
    )
    .map(record =>
      normalizeSet(
        record,
        previousSets.get(setId(record)),
        sourceBuildDate,
        asOf
      )
    );

  for (const previous of existingSets.records || []) {
    if (
      previous?.sourceKind === "manual" &&
      previous.id &&
      !setRecords.some(record => record.id === previous.id)
    )
      setRecords.push(previous);
  }

  const preconRecords = rawDecks
    .filter(
      record =>
        String(record?.type || "").toLowerCase() === "commander deck" &&
        parseDate(record?.releaseDate) &&
        keepInWindow(record.releaseDate, asOf)
    )
    .map(record =>
      normalizePrecon(
        record,
        previousPrecons.get(deckId(record)),
        sourceBuildDate,
        asOf
      )
    );

  for (const previous of existingPrecons.records || []) {
    if (
      previous?.sourceKind === "manual" &&
      previous.id &&
      !preconRecords.some(record => record.id === previous.id)
    )
      preconRecords.push(previous);
  }

  const uniqueSets = [
    ...new Map(setRecords.map(record => [record.id, record])).values(),
  ].sort(
    (a, b) =>
      a.releaseDate.localeCompare(b.releaseDate) || a.name.localeCompare(b.name)
  );
  const uniquePrecons = [
    ...new Map(preconRecords.map(record => [record.id, record])).values(),
  ].sort(
    (a, b) =>
      a.releaseDate.localeCompare(b.releaseDate) || a.name.localeCompare(b.name)
  );

  return {
    upcomingSets: {
      schemaVersion: 1,
      kind: "upcoming-mtg-sets",
      sourceBuildDate,
      asOf,
      lookaheadDays: FUTURE_DAYS,
      records: uniqueSets,
    },
    preconReleaseCalendar: {
      schemaVersion: 1,
      kind: "precon-release-calendar",
      sourceBuildDate,
      asOf,
      window: { pastDays: PAST_DAYS, futureDays: FUTURE_DAYS },
      records: uniquePrecons,
    },
  };
}

async function main() {
  const asOf =
    parseDate(
      process.argv.find(arg => arg.startsWith("--date="))?.split("=")[1]
    ) || new Date().toISOString().slice(0, 10);
  const [setList, deckList, existingSets, existingPrecons] = await Promise.all([
    fetchJson(SOURCE_URLS.setList),
    fetchJson(SOURCE_URLS.deckList),
    readJson(upcomingSetsFile, { records: [] }),
    readJson(preconCalendarFile, { records: [] }),
  ]);
  const { upcomingSets, preconReleaseCalendar } = buildReleaseCalendars({
    setList,
    deckList,
    existingSets,
    existingPrecons,
    asOf,
  });
  await mkdir(releaseDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      upcomingSetsFile,
      `${JSON.stringify(upcomingSets, null, 2)}\n`,
      "utf8"
    ),
    writeFile(
      preconCalendarFile,
      `${JSON.stringify(preconReleaseCalendar, null, 2)}\n`,
      "utf8"
    ),
  ]);
  console.log(
    `Release calendar sync complete: ${upcomingSets.records.length} upcoming sets and ${preconReleaseCalendar.records.length} Commander products (${asOf}).`
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

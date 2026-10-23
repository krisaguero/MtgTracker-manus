import {
  importedMarketReports,
  formatPricingDate,
} from "./marketReportArchive";
import sourceSnapshot from "./notionMarketWatchSnapshot.json";
import creatorSpotlight from "./tabletopPaperSpotlight.json";

type ChronologyKind =
  "price snapshot" | "catalyst brief" | "market watch" | "creator spotlight";

export interface MarketChronologyEntry {
  id: string;
  dateKey: string;
  title: string;
  href: string;
  source: string;
  kind: ChronologyKind;
  verification: string;
  dataWindow: string;
  caveat: string;
}

const importedEntries: MarketChronologyEntry[] = importedMarketReports.map(
  report => ({
    id: `imported-${report.dateKey}`,
    dateKey: report.dateKey,
    title: report.title,
    href: `/market-report/${report.dateKey}`,
    source: "Imported dated report archive",
    kind: "price snapshot",
    verification: report.status,
    dataWindow: report.dataWindow,
    caveat:
      "Historical pricing and moves belong to this report date; they are not live quotes.",
  })
);

const briefEntries: MarketChronologyEntry[] = [
  {
    id: "quarterly-comparison-2026-10-22",
    dateKey: "2026-10-22",
    title: "October vs. Historical Quarterly Market Trends",
    href: "/market-report/quarterly-trend-comparison-2026-10-22",
    source: "Tracker-generated quarterly comparison",
    kind: "market watch",
    verification: "Snapshot-derived; coverage expansion caveat disclosed",
    dataWindow: "Available Q3 historical files through October 22, 2026",
    caveat:
      "October 20–22 uses a full-universe snapshot while earlier periods use a smaller tracked panel; raw mover counts are not directly comparable.",
  },
  {
    id: "brief-2026-10-17",
    dateKey: "2026-10-17",
    title: "Daily MTG Market Movers — 30-Signal Brief",
    href: "/market-report/october-17-30-signal-brief",
    source: "User-supplied source-dated catalyst brief",
    kind: "catalyst brief",
    verification:
      "No confirmed card-level price movers; catalyst evidence only",
    dataWindow: "October 16, 2026 prior trading day",
    caveat:
      "Tournament, format, policy, and supply signals are not confirmed price movement. Exact printings and completed sales remain incomplete.",
  },
  {
    id: "brief-2026-10-16",
    dateKey: "2026-10-16",
    title: "Daily MTG Market Movers — 30-Signal Brief",
    href: "/market-report/october-16-30-signal-brief",
    source: "User-supplied source-dated catalyst brief",
    kind: "catalyst brief",
    verification: "Price movement and completed sales unverified",
    dataWindow:
      "October 15 prior trading day; supplemented with October 16 tournament signals",
    caveat:
      "30 source-auditable watch/catalyst signals, not 30 confirmed price movers. Separate from the October 16 Notion market-watch snapshot; not current quotes.",
  },
  {
    id: "brief-2026-10-15",
    dateKey: "2026-10-15",
    title: "Daily MTG Market Movers — 30-Signal Brief",
    href: "/market-report/october-15-30-signal-brief",
    source: "Catalyst brief",
    kind: "catalyst brief",
    verification: "Price movement unverified",
    dataWindow: "Catalyst and metagame signals",
    caveat:
      "Not a verified 30-mover price feed; preserve each signal confidence and citation.",
  },
  {
    id: "brief-2026-10-11",
    dateKey: "2026-10-11",
    title: "Daily MTG Market Movers Report",
    href: "/market-report/october-11-daily-market-movers",
    source: "Catalyst brief",
    kind: "catalyst brief",
    verification: "Historical observations; verification limited",
    dataWindow: "Data through October 10",
    caveat:
      "Repeated names are not unique-printing counts; historical moves are not current quotes.",
  },
  {
    id: "brief-2026-10-05",
    dateKey: "2026-10-05",
    title: "Daily MTG Market Movers Report",
    href: "/market-report/october-05-daily-market-movers",
    source: "Catalyst brief",
    kind: "catalyst brief",
    verification: "Price claims often unverified",
    dataWindow: "Approximate September 19–October 1 window",
    caveat:
      "Repeated cards are cross-category mentions, not unique-card counts or current movers.",
  },
];

const watchEntries: MarketChronologyEntry[] = sourceSnapshot.reports.map(
  report => ({
    id: `watch-${report.date}`,
    dateKey: report.date,
    title: report.title,
    href: `/market-watch?date=${report.date}`,
    source: "Notion static read-only snapshot",
    kind: "market watch",
    verification: report.marketStatus,
    dataWindow: report.dataWindow,
    caveat: report.sourceNotes,
  })
);

const creatorEntries: MarketChronologyEntry[] = [
  {
    id: "spotlight-tabletop-paper-company-2026-10-17",
    dateKey: creatorSpotlight.dateKey,
    title: creatorSpotlight.title,
    href: creatorSpotlight.href,
    source: creatorSpotlight.channel.name + " · YouTube viewing guide",
    kind: "creator spotlight",
    verification: "Video attribution labeled; no live price claims",
    dataWindow:
      "Seven-card editorial selection dated October 17, 2026; linked videos retain their own publication dates",
    caveat:
      "Rules-based editorial notes are separate from creator commentary. Each card links to its video segment; this is not a buy recommendation.",
  },
];

export const chronologicalMarketEntries = [
  ...importedEntries,
  ...briefEntries,
  ...watchEntries,
  ...creatorEntries,
].sort(
  (a, b) => b.dateKey.localeCompare(a.dateKey) || a.id.localeCompare(b.id)
);
export const latestMarketWatchEntries = chronologicalMarketEntries
  .filter(entry => entry.kind === "market watch")
  .slice(0, 3);
export { formatPricingDate };

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const RELEASE_DIR = resolve(ROOT, 'data/releases');
const CLIENT_DATA_DIR = resolve(ROOT, 'client/src/data');
const NEWS_URL = 'https://magic.wizards.com/en/news';
const OUTPUT_PATH = resolve(RELEASE_DIR, 'spoiler-announcement-feed.json');
const CLIENT_OUTPUT_PATH = resolve(CLIENT_DATA_DIR, 'spoilerAnnouncementFeed.json');
const ARTICLE_OUTPUT_PATH = resolve(CLIENT_DATA_DIR, 'automatedSpoilerArticles.json');
const USER_AGENT = 'MTGTracker-Official-Announcement-Watch/1.0';
const ARTICLE_LIMIT = 24;
const FEED_LIMIT = 120;

const parseDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : null;
const today = process.argv.find(arg => arg.startsWith('--date='))?.split('=')[1] || new Date().toISOString().slice(0, 10);
if (!parseDate(today)) throw new Error(`Invalid --date value: ${today}`);

async function fetchText(url) {
  const response = await fetch(url, { headers: { Accept: 'text/html,application/json', 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
}
async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}
function decodeHtml(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/\s+/g, ' ').trim();
}
function slugify(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function isRelevant(title, href) {
  const haystack = `${title} ${href}`.toLowerCase();
  return /(commander|precon|decklist|spoiler|card-image-gallery|product|release|preview|secret-lair|universes-beyond)/.test(haystack);
}
function kindFor(title, href) {
  const haystack = `${title} ${href}`.toLowerCase();
  if (/decklist|commander/.test(haystack)) return 'commander-announcement';
  if (/card-image-gallery|spoiler|preview/.test(haystack)) return 'spoiler';
  if (/product|release|secret-lair|preorder/.test(haystack)) return 'product-release';
  return 'official-news';
}
function extractOfficialNews(html) {
  const rows = [];
  const pattern = /<a[^>]+href="(\/en\/news\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const href = `https://magic.wizards.com${match[1]}`;
    const title = decodeHtml(match[2]);
    if (!title || title.length < 8 || !isRelevant(title, href)) continue;
    rows.push({ id: slugify(match[1]), title, url: href, kind: kindFor(title, href), source: 'DailyMTG' });
  }
  return [...new Map(rows.map(row => [row.id, row])).values()].slice(0, FEED_LIMIT);
}
function calendarHighlights(calendar) {
  return (calendar.records || []).filter(record => record.status === 'upcoming').sort((a, b) => a.releaseDate.localeCompare(b.releaseDate)).slice(0, 12).map(record => ({
    id: record.id,
    name: record.name,
    setCode: record.setCode,
    releaseDate: record.releaseDate,
    productType: record.productType,
    sources: record.sources || [],
    officialSourceUrl: record.officialSourceUrl || null,
  }));
}
function sourceLine(item) {
  return `- [${item.title}](${item.url}) — ${item.kind.replaceAll('-', ' ')}`;
}
function buildArticle({ officialNews, precons, asOf }) {
  const slug = `daily-spoiler-watch-${asOf}`;
  const commanderNews = officialNews.filter(item => item.kind === 'commander-announcement');
  const spoilerNews = officialNews.filter(item => item.kind === 'spoiler');
  const productNews = officialNews.filter(item => item.kind === 'product-release');
  const articleTitle = `Daily Spoiler & Precon Watch — ${asOf}`;
  const summary = `${officialNews.length} official DailyMTG announcement or spoiler records were matched, with ${precons.length} upcoming Commander products carried forward from the release calendar.`;
  const sections = [
    `# ${articleTitle}`,
    '',
    `This automated journal entry records the official Wizards/DailyMTG pages found during the ${asOf} scan and the upcoming Commander products already present in the tracker’s structured release calendar. It is a source index, not a claim that every spoiler page represents a complete decklist.`,
    '',
    `## What changed`,
    '',
    `The scan found **${commanderNews.length} Commander/precon-related page${commanderNews.length === 1 ? '' : 's'}**, **${spoilerNews.length} spoiler or card-preview page${spoilerNews.length === 1 ? '' : 's'}**, and **${productNews.length} product/release page${productNews.length === 1 ? '' : 's'}**. New-to-Magic status, deck completeness, exact cards, and prices remain separate checks in the catalog refresh.`,
    '',
    commanderNews.length ? `### Commander and precon announcements\n\n${commanderNews.slice(0, 10).map(sourceLine).join('\n')}` : '### Commander and precon announcements\n\nNo new Commander announcement page matched this scan.',
    '',
    spoilerNews.length ? `### Spoilers and card previews\n\n${spoilerNews.slice(0, 10).map(sourceLine).join('\n')}` : '### Spoilers and card previews\n\nNo new spoiler or card-image-gallery page matched this scan.',
    '',
    precons.length ? `### Upcoming Commander products already on the release radar\n\n${precons.slice(0, 12).map(record => `- **${record.name}** (${record.setCode}) — scheduled for ${record.releaseDate}.`).join('\n')}` : '### Upcoming Commander products already on the release radar\n\nNo upcoming Commander products were available in the structured calendar.',
    '',
    '## How to use this in the tracker',
    '',
    'Use the linked official page to confirm the announcement. Use the Commander Library to inspect a complete deck record when MTGJSON has one. Then open the deck’s upgrade paths to compare EDHREC-supported packages, your scanned copies, and cards that may be transferable from another owned precon. The automation does not infer ownership from an announcement.',
    '',
    '## Data notes',
    '',
    `- Official source index: [DailyMTG news](${NEWS_URL})` ,
    '- Structured product source: MTGJSON SetList and DeckList, refreshed separately by the daily catalog jobs.',
    '- Spoiler pages are evidence of an official page, not proof of a complete card list or a purchase recommendation.',
  ].join('\n');
  return { slug, category: 'Automated Spoiler & Precon Watch', title: articleTitle, dateLabel: `${asOf} · Automated source scan`, summary, body: sections, sourceUrl: NEWS_URL, dataWindow: `Official DailyMTG page scan and structured release calendar checked ${asOf}.`, caveat: 'Automated source index. Verify complete decklists, exact printings, release dates, and prices before acting.' };
}
async function main() {
  const [html, calendar, previousFeed, previousArticles] = await Promise.all([
    fetchText(NEWS_URL),
    readJson(resolve(RELEASE_DIR, 'precon-release-calendar.json'), { records: [] }),
    readJson(OUTPUT_PATH, { records: [] }),
    readJson(ARTICLE_OUTPUT_PATH, []),
  ]);
  const officialNews = extractOfficialNews(html);
  const precons = calendarHighlights(calendar);
  const feed = {
    schemaVersion: 1,
    kind: 'official-spoiler-announcement-feed',
    asOf: today,
    sourceUrl: NEWS_URL,
    records: [...officialNews, ...precons.map(record => ({ id: `precon-${record.id}`, title: record.name, url: record.officialSourceUrl || NEWS_URL, kind: 'upcoming-precon', source: 'MTGJSON release calendar', releaseDate: record.releaseDate, setCode: record.setCode }))].slice(0, FEED_LIMIT),
    previousRecordCount: Array.isArray(previousFeed.records) ? previousFeed.records.length : 0,
  };
  const previousRecords = Array.isArray(previousFeed.records) ? previousFeed.records : [];
  const previousById = new Map(previousRecords.map(record => [record.id, JSON.stringify(record)]));
  const currentRecords = feed.records;
  const newRecordCount = currentRecords.filter(record => !previousById.has(record.id)).length;
  const changedRecordCount = currentRecords.filter(record => previousById.has(record.id) && previousById.get(record.id) !== JSON.stringify(record)).length;
  const meaningfulChange = newRecordCount > 0 || changedRecordCount > 0 || previousRecords.length === 0;
  const priorArticles = Array.isArray(previousArticles) ? previousArticles : [];
  const article = meaningfulChange ? buildArticle({ officialNews, precons, asOf: today }) : null;
  const articles = (article ? [article, ...priorArticles.filter(item => item?.slug !== article.slug)] : priorArticles).slice(0, ARTICLE_LIMIT);
  await mkdir(RELEASE_DIR, { recursive: true });
  await mkdir(CLIENT_DATA_DIR, { recursive: true });
  await Promise.all([
    writeFile(OUTPUT_PATH, `${JSON.stringify(feed, null, 2)}\n`, 'utf8'),
    writeFile(CLIENT_OUTPUT_PATH, `${JSON.stringify(feed, null, 2)}\n`, 'utf8'),
    writeFile(ARTICLE_OUTPUT_PATH, `${JSON.stringify(articles, null, 2)}\n`, 'utf8'),
  ]);
  console.log(JSON.stringify({ asOf: today, officialNews: officialNews.length, upcomingPrecons: precons.length, newRecordCount, changedRecordCount, meaningfulChange, articleSlug: article?.slug || null, outputs: [OUTPUT_PATH, CLIENT_OUTPUT_PATH, ARTICLE_OUTPUT_PATH] }, null, 2));
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });

import React, { useState } from 'react';
import evidence from '@/data/verifiedHistoricalEvidence.json';

function date(value: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}
function percent(start: number, end: number) { return ((end / start - 1) * 100).toFixed(2); }

function DipReplay({ dip }: { dip: (typeof evidence.dips)[number] }) {
  const [index, setIndex] = useState(dip.points.length - 1);
  const first = dip.points[0];
  const selected = dip.points[index];
  const values = dip.points.map((point) => point.usd);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const startTime = Date.parse(first.date);
  const span = Date.parse(dip.points.at(-1)!.date) - startTime || 1;
  const xy = dip.points.map((point) => ({ x: 8 + (Date.parse(point.date) - startTime) / span * 284, y: 12 + (high - point.usd) / (high - low || 1) * 64 }));
  return <article className="border border-border bg-background p-4 sm:p-5">
    <p className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">Archived reference dip · {dip.setCode.toUpperCase()} #{dip.collectorNumber}</p>
    <h3 className="mt-2 text-xl font-black">{dip.name}</h3>
    <p className="mt-1 text-xs text-muted-foreground">{date(first.date)} → {date(dip.points.at(-1)!.date)}</p>
    <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
      <p className="text-2xl font-black">${first.usd.toFixed(2)} → ${selected.usd.toFixed(2)}</p>
      <p className="font-mono text-lg font-black text-destructive">{percent(first.usd, selected.usd)}%</p>
    </div>
    <svg viewBox="0 0 300 90" role="img" aria-label={`${dip.name} archived reference-price observations; full window decline ${dip.percentChange.toFixed(2)} percent`} className="mt-3 h-24 w-full text-destructive">
      <polyline points={xy.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" />
      {xy.map((point, pointIndex) => <circle key={dip.points[pointIndex].date} cx={point.x} cy={point.y} r={pointIndex === index ? 5 : 2.5} fill="currentColor" opacity={pointIndex === index ? 1 : 0.5} />)}
    </svg>
    <label className="mt-2 block text-xs font-bold" htmlFor={`replay-${dip.uuid}`}>Replay saved observation · {date(selected.date)}</label>
    <input id={`replay-${dip.uuid}`} className="mt-2 w-full accent-primary" type="range" min={0} max={dip.points.length - 1} step={1} value={index} onChange={(event) => setIndex(Number(event.target.value))} />
    <button type="button" onClick={() => setIndex(0)} className="mt-1 min-h-10 font-mono text-[10px] font-bold uppercase text-primary underline">Replay from start</button>
    <p className="mt-2 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">Latest archived check: <strong>${dip.latest.usd.toFixed(2)}</strong> on {date(dip.latest.date)}. A dip may rebound; this is not a current quote or a prediction win.</p>
    <details className="mt-3 text-xs"><summary className="cursor-pointer font-bold text-primary">Exact saved observations &amp; provenance</summary><p className="mt-2 break-all text-[10px] text-muted-foreground">Card UUID: {dip.uuid}</p><table className="mt-2 w-full text-left"><caption className="sr-only">Saved {dip.name} reference prices</caption><thead><tr><th scope="col" className="py-1">Capture date</th><th scope="col">Reference USD</th></tr></thead><tbody>{dip.points.map((point) => <tr key={point.date} className="border-t border-border"><td className="py-1">{date(point.date)}</td><td>${point.usd.toFixed(2)}</td></tr>)}</tbody></table></details>
  </article>;
}

export function VerifiedHistoricalEvidence() {
  const reviews = evidence.notionReviewCheck.records;
  const pending = reviews.filter((review) => review.resolution === 'pending').length;
  return <section id="historical-evidence" aria-labelledby="historical-evidence-heading" className="scroll-mt-6 border-2 border-primary/50 bg-card p-5 sm:p-7">
    <header className="border-b border-border pb-5">
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-primary">Evidence desk · historical observations, not live quotes</p>
      <h2 id="historical-evidence-heading" className="mt-2 text-2xl font-black sm:text-3xl">Real dips. No invented prediction wins.</h2>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">Replay actual saved reference-price observations below. Every slider position is a recorded snapshot—no simulated prices or fabricated outcomes. These deliberately selected decline windows are retrospective examples, not representative returns.</p>
      <p className="mt-3 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground">Source-reconciled MTGJSON-derived reference values, not completed sales. Finish is not preserved by the archive, so these are not independently verified nonfoil quotes. No cause of decline is claimed. Research only, not personalized financial advice.</p>
    </header>
    <div className="mt-5 grid gap-4 lg:grid-cols-3">{evidence.dips.map((dip) => <DipReplay key={dip.uuid} dip={dip} />)}</div>
    <details className="mt-4 border border-border bg-background p-4 text-xs leading-5 text-muted-foreground"><summary className="cursor-pointer font-bold text-foreground">How these observations were verified</summary><p className="mt-3">{evidence.methodology}</p><p className="mt-2">Change = {evidence.formula}. Chart lines connect saved observations; no intermediate values are asserted. Market-wide causes, supply, liquidity, and completed sales are not verified here.</p><p className="mt-2 break-all">Pinned source release: {evidence.sourceCommit}.</p><div className="mt-3 flex flex-wrap gap-4"><a href="/verified-history-evidence.json" className="font-bold text-primary underline">Open evidence JSON, source paths &amp; artifact checksums</a><a href="https://mtgjson.com/data-models/price/" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">MTGJSON price documentation ↗</a></div></details>
    <section className="mt-7 border border-amber-500/60 bg-amber-500/5 p-4 sm:p-5" aria-labelledby="source-review-scorecard-heading">
      <p className="font-mono text-[10px] font-black uppercase text-amber-800 dark:text-amber-300">Source review check · {date(evidence.notionReviewCheck.checkedAt)} · static, read-only</p>
      <h3 id="source-review-scorecard-heading" className="mt-2 text-xl font-black">Notion prediction scorecard</h3>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Pending', pending], ['Resolved', reviews.length - pending], ['Verified wins', 0], ['Win rate', 'N/A']].map(([label, value]) => <div key={label} className="border border-border bg-background p-3"><dt className="font-mono text-[10px] font-bold uppercase text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-black">{value}</dd></div>)}</dl>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{evidence.notionReviewCheck.note} No verified wins yet; an unresolved call is neither a win nor a loss. Earliest scheduled review: October 22, 2026. No automatic monitoring or Notion write-back is configured by this release.</p>
      <details className="mt-3 text-xs"><summary className="cursor-pointer font-bold">Review the {reviews.length} pending records</summary><ul className="mt-3 grid gap-2 sm:grid-cols-2">{reviews.map((review) => <li key={review.name} className="border border-border bg-background p-2"><strong>{review.name}</strong><br />{review.actualOutcome} Review {date(review.reviewDate)}.</li>)}</ul></details>
    </section>
    <section className="mt-7" aria-labelledby="external-backtests-heading">
      <p className="font-mono text-[10px] font-black uppercase text-primary">Independently published research</p>
      <h3 id="external-backtests-heading" className="mt-2 text-xl font-black">Forecasts tested against historical outcomes</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">These are source-verified academic backtest results, not documented contemporaneous public winning calls. They do not count toward this tracker’s scorecard.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{evidence.studies.map((study) => <article key={study.id} className="border border-border bg-background p-4"><p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">{study.kind}</p><h4 className="mt-2 font-black">{study.title}</h4><p className="mt-3 text-sm font-semibold leading-6">{study.result}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{study.context}</p><p className="mt-3 border-l-2 border-amber-500 pl-3 text-xs leading-5 text-muted-foreground">{study.limitation}</p><a href={study.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center text-xs font-bold text-primary underline">Read original study ↗</a></article>)}</div>
    </section>
  </section>;
}

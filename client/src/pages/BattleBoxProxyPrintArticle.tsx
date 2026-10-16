import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Printer, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';

const services = [
  {
    name: 'MTG Print',
    url: 'https://mtgprint.net/',
    detail: 'Accepts Magic Arena-format card lists and generates a printable PDF.',
  },
  {
    name: 'prox.cc',
    url: 'https://prox.cc/',
    detail: 'Accepts typed or pasted lists, or a dragged-and-dropped .txt or .dec file. Its site says PDF output is generated locally in your browser.',
  },
];

export default function BattleBoxProxyPrintArticle() {
  useEffect(() => {
    document.title = 'How to Print Battle Box Playtest Proxies | MTG Sets Tracker';
    const description = 'A privacy-first guide to selecting missing Battle Box cards, manually using independent proxy-print services, and printing a test-play PDF.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = description;
    return () => { if (created && meta?.parentNode) meta.parentNode.removeChild(meta); };
  }, []);

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b-2 border-border bg-card print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <Link href="/battle-box#inventory-queue" className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to the Battle Box queue</Link>
        <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 border-2 border-border px-3 py-2 font-mono text-[10px] font-black uppercase hover:border-primary"><Printer className="h-4 w-4" /> Print this guide</button>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-14">
      <article className="print:text-black">
        <div className="max-w-4xl border-l-4 border-primary pl-5 sm:pl-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-primary print:text-black">Optional · manual · local-first</p>
          <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-tight sm:text-6xl">How to print selected Battle Box playtest cards</h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground print:text-black">Use the browser-local inventory queue to identify gaps, choose only the cards you want, then copy or download a short list and paste it yourself into an independent print service.</p>
        </div>

        <section className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Independent printing services">
          {services.map((service) => <a key={service.name} href={service.url} target="_blank" rel="noopener noreferrer" className="group border-2 border-border bg-card p-5 hover:border-primary print:hidden">
            <span className="flex items-center justify-between gap-3"><strong className="text-xl font-black">{service.name}</strong><ExternalLink className="h-4 w-4 text-primary" /></span>
            <span className="mt-2 block text-sm leading-6 text-muted-foreground">{service.detail}</span>
            <span className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-primary">Open service <ArrowRight className="h-3.5 w-3.5" /></span>
          </a>)}
          <div className="hidden border-2 border-border p-5 print:block"><strong className="text-xl font-black">MTG Print</strong><p className="mt-2 text-sm">mtgprint.net — accepts Arena-format lists and generates a printable PDF.</p></div>
          <div className="hidden border-2 border-border p-5 print:block"><strong className="text-xl font-black">prox.cc</strong><p className="mt-2 text-sm">prox.cc — accepts pasted lists or .txt/.dec files; its site says PDF output is generated in your browser.</p></div>
        </section>

        <section className="mt-10 border-2 border-primary/40 bg-primary/5 p-5 sm:p-7">
          <h2 className="text-2xl font-black">Quick steps</h2>
          <ol className="mt-4 space-y-4 text-sm leading-6">
            <li className="flex gap-3"><span className="font-mono font-black text-primary">01</span><span><strong>Open the Battle Box queue.</strong> Import a collection file locally or refresh the collection saved in this browser. Importing is optional; without inventory, only the source lists’ proxy-marked cards are offered.</span></li>
            <li className="flex gap-3"><span className="font-mono font-black text-primary">02</span><span><strong>Opt in.</strong> Turn on “Enable proxy-print support” in the queue. It is off by default and this preference is stored only in this browser.</span></li>
            <li className="flex gap-3"><span className="font-mono font-black text-primary">03</span><span><strong>Select just the cards you want.</strong> Check individual missing/proxy candidates, or use “Select all eligible.” The generated list contains only selected card names and quantities, in lines such as <code className="rounded bg-muted px-1 py-0.5">4 Lightning Bolt</code>; it omits collection rows, printing details, and deck names.</span></li>
            <li className="flex gap-3"><span className="font-mono font-black text-primary">04</span><span><strong>Copy or download the list yourself.</strong> The same simple quantity-and-name lines are plain text and Arena-compatible. Nothing is sent to a print site from this tracker.</span></li>
            <li className="flex gap-3"><span className="font-mono font-black text-primary">05</span><span><strong>Open one service and paste or drop the list manually.</strong> The service receives the list only after you choose to paste or upload it there. No list is put in an automatic link or transmitted by the tracker.</span></li>
            <li className="flex gap-3"><span className="font-mono font-black text-primary">06</span><span><strong>Review the PDF, then print a test page.</strong> Choose the correct paper size (A4 or Letter) and set print scale to 100% before printing; check alignment and card size before making a full batch.</span></li>
          </ol>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="border border-border bg-card p-5">
            <h2 className="text-xl font-black">Privacy &amp; service boundaries</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Collection matching happens in this browser. The tracker does not automatically upload scan-derived data, collection rows, credentials, or AI keys. Copying writes only the selected card list to your clipboard; downloading saves only that list. Opening a service sends no card list in the URL. If you manually paste or drop a list into a third-party site, that site receives the list you provide—review its own privacy practices first.</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">MTG Print and prox.cc are independent third-party services, not affiliated with Wizards of the Coast or this tracker. Their features and terms can change.</p>
          </div>
          <div className="border border-amber-700/40 bg-amber-500/5 p-5">
            <h2 className="flex items-center gap-2 text-xl font-black"><ShieldCheck className="h-5 w-5 text-amber-700" /> Playtest use only</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Treat these as playtest proxies for personal, noncommercial casual play or testing. Ask your playgroup or store before using them. Wizards’ policy says sanctioned events require authentic cards and does not endorse selling counterfeits. Do not represent a proxy as an authentic card or sell counterfeits.</p>
            <a className="mt-3 inline-block text-sm font-semibold text-primary underline" href="https://magic.wizards.com/en/news/announcements/proxies-policy-and-communication-2016-01-14" target="_blank" rel="noopener noreferrer">Read Wizards’ proxy policy and communication</a>
          </div>
        </section>

        <section className="mt-8 border-t-2 border-border pt-6">
          <h2 className="text-2xl font-black">Troubleshooting</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground md:grid-cols-2">
            <li className="border border-border p-4"><strong className="text-foreground">No additional missing cards appear.</strong> A collection must be loaded to calculate inventory gaps. With no inventory, the list offers only source proxy-marked quantities.</li>
            <li className="border border-border p-4"><strong className="text-foreground">A card is not selected.</strong> The proxy list starts empty. Check the card row, or explicitly select eligible cards; “Copy” and “Download” never include unselected rows.</li>
            <li className="border border-border p-4"><strong className="text-foreground">The imported list is rejected.</strong> Use one card per line in <code>quantity Card Name</code> form. MTG Print accepts Arena-format text; prox.cc also accepts pasted text and .txt/.dec files.</li>
            <li className="border border-border p-4"><strong className="text-foreground">Printed cards are mis-sized or misaligned.</strong> In the print dialog, choose A4 or Letter to match the paper and set scale to 100%; verify a test page before printing more.</li>
            <li className="border border-border p-4"><strong className="text-foreground">The preference did not persist.</strong> Browser storage may be blocked or full. The support switch still controls this page while open, but a blocked browser may not remember it after you leave.</li>
            <li className="border border-border p-4"><strong className="text-foreground">You change your mind.</strong> Turn proxy-print support off at any time. The selection tools disappear; the ordinary collection and order-gap workflow remains available.</li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3 print:hidden">
          <Link href="/battle-box#inventory-queue" className="inline-flex min-h-11 items-center gap-2 border-2 border-primary bg-primary px-4 py-2 font-mono text-xs font-black uppercase text-primary-foreground">Open the inventory queue <ArrowRight className="h-4 w-4" /></Link>
          <a href="https://mtgprint.net/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase">MTG Print <ExternalLink className="h-4 w-4" /></a>
          <a href="https://prox.cc/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-4 py-2 font-mono text-xs font-black uppercase">prox.cc <ExternalLink className="h-4 w-4" /></a>
        </div>
      </article>
    </main>
  </div>;
}

import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { getDeckGalleryRoleReading } from "@/lib/deckGalleryRoles";
import { getDeckboxBattleBoxTileImageUri } from "@/lib/deckboxBattleBoxTileImageUris";
import { getDeckboxBattleBoxEntries, type DeckboxBattleBoxEntry } from "@/lib/deckboxBattleBox";
import { loadDeckGallery } from "@/lib/deckGallery";

function DeckboxBattleBoxTileArt({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const imageUri = getDeckboxBattleBoxTileImageUri(name);

  if (!imageUri || failed) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
        Card art unavailable
      </div>
    );
  }

  return (
    <img
      src={imageUri}
      alt=""
      aria-hidden="true"
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export function DeckboxBattleBoxTiles({ entries }: { entries: DeckboxBattleBoxEntry[] }) {
  return (
    <section
      id="deckbox-60-card-archive"
      className="mt-14 border-t-4 border-primary pt-8"
      aria-labelledby="deckbox-archive-heading"
    >
      <header className="max-w-4xl">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">
          Separate source-list collection
        </p>
        <h2 id="deckbox-archive-heading" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Deckbox 60-card Battle Box references
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {entries.length} saved lists are supported as complete 60-card non-Commander entries. Each keeps its exact source title, credit, count, and original list. These references stay separate from the nine curated Battle Box decks and do not enter its inventory or print queue.
        </p>
      </header>

      {entries.length ? (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {entries.map(entry => {
            const reading = getDeckGalleryRoleReading(entry.id);
            const featureCard =
              reading?.main.find(group => group.id === "threats")?.cards[0] ??
              reading?.main.find(group => group.id !== "lands")?.cards[0] ??
              entry.main[0];
            return (
              <li key={entry.id} className="min-w-0">
                <Link
                  href={`/battle-box/deckbox/${encodeURIComponent(entry.id)}`}
                  aria-label={`Open Deckbox Battle Box entry: ${entry.sourceTitle}, 60-card non-Commander list`}
                  className="group block h-full border-2 border-border bg-card transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="relative aspect-[488/680] overflow-hidden bg-muted">
                    {featureCard ? (
                      <DeckboxBattleBoxTileArt name={featureCard.name} />
                    ) : (
                      <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                        Card art unavailable
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-16 text-white">
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
                        {entry.mainCopies} cards · {entry.savedFormat || "Format not specified"}
                      </p>
                      <h3 className="mt-2 text-lg font-black leading-tight">{entry.sourceTitle}</h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-3 text-xs font-bold">
                    <span>Source title & exact list</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-6 border border-dashed border-border p-5 text-sm text-muted-foreground">
          {"Loading public Deckbox source lists…"}
        </p>
      )}
    </section>
  );
}

export default function DeckboxBattleBoxLibrary() {
  const [entries, setEntries] = useState<DeckboxBattleBoxEntry[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    loadDeckGallery()
      .then(payload => {
        if (active) setEntries(getDeckboxBattleBoxEntries(payload));
      })
      .catch(() => {
        if (active) setLoadError("Public Deckbox source lists could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  if (loadError) {
    return (
      <section id="deckbox-60-card-archive" className="mt-14 border-t-4 border-primary pt-8" aria-labelledby="deckbox-archive-heading">
        <h2 id="deckbox-archive-heading" className="text-3xl font-black tracking-tight">Deckbox 60-card Battle Box references</h2>
        <p className="mt-4 border border-dashed border-border p-5 text-sm text-muted-foreground">{loadError}</p>
      </section>
    );
  }
  return <DeckboxBattleBoxTiles entries={entries} />;
}

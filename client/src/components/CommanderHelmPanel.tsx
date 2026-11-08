import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import type {
  DeckGalleryChildGuess,
  DeckGalleryHelm,
  DeckGalleryHelmCard,
} from "@/lib/deckGallery";

const cardImageUrl = (name: string) =>
  `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=art_crop`;

function CardArt({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-amber-500/20 ${className}`}
      role="img"
      aria-label={`${name} card art`}
    >
      {!failed && (
        <img
          src={cardImageUrl(name)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div className="flex h-full items-center justify-center p-3 text-center font-mono text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          {name}
        </div>
      )}
    </div>
  );
}

function sourceLocationText(card: DeckGalleryHelmCard) {
  if (card.sourceLocation === "not_in_source")
    return "Not present in source list";
  const section = card.sourceLocation === "main" ? "Main" : "Sideboard";
  return card.proposedZoneMove
    ? `Proposed zone move: ${section} → command zone · source row retained`
    : `Present in ${section} · no source row changed`;
}

function childLocationText(guess: DeckGalleryChildGuess) {
  if (guess.sourceLocation === "not_in_source")
    return "Not present in source list";
  const section = guess.sourceLocation === "main" ? "Main" : "Sideboard";
  return guess.proposedZoneMove
    ? `Hypothetical child only: proposed move from ${section} to command zone`
    : `Hypothetical child only · source section: ${section}`;
}

function statusClass(helm: DeckGalleryHelm) {
  if (helm.status === "assigned")
    return "border-primary/40 bg-primary/5 text-primary";
  if (helm.status === "not_a_commander_deck")
    return "border-sky-700/40 bg-sky-500/10 text-sky-900 dark:text-sky-200";
  return "border-amber-700/40 bg-amber-500/10 text-amber-900 dark:text-amber-200";
}

function SeparateChildGuess({ guess }: { guess: DeckGalleryChildGuess }) {
  return (
    <section
      className="mt-4 border-l-4 border-amber-600 bg-amber-500/[0.06] p-3"
      aria-label="Separate hypothetical child helm"
    >
      <p className="font-mono text-[9px] font-black uppercase tracking-widest text-amber-900 dark:text-amber-200">
        {guess.label}
      </p>
      <div className="mt-2 grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
        <CardArt name={guess.name} className="aspect-[488/330] w-20" />
        <div className="min-w-0">
          <p className="break-words text-sm font-black">{guess.name}</p>
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
            {childLocationText(guess)}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {guess.note}
      </p>
      {guess.evidence.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {guess.evidence.map((item, index) => (
            <a
              key={`${item.url}-${index}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 items-center gap-1 border border-border bg-background px-2 py-1 text-[9px] font-semibold hover:border-primary hover:text-primary"
            >
              {item.label} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export function CommanderHelmPanel({
  helm,
  className = "",
}: {
  helm: DeckGalleryHelm;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden border-2 border-border bg-card p-4 ${className}`}
      aria-label="Commander at the helm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-primary">
          At the helm
        </p>
        <span
          className={`inline-flex border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider ${statusClass(helm)}`}
        >
          {helm.label}
        </span>
      </div>

      {helm.commanders.length > 0 ? (
        <ul
          className={`mt-3 grid gap-3 ${helm.commanders.length > 1 ? "sm:grid-cols-2" : ""}`}
        >
          {helm.commanders.map(card => (
            <li
              key={card.name}
              className="min-w-0 border border-border bg-background p-2"
            >
              <CardArt name={card.name} className="aspect-[488/330] w-full" />
              <p className="mt-2 break-words text-sm font-black leading-5">
                {card.name}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                {sourceLocationText(card)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 border-2 border-dashed border-border bg-background p-4">
          <p className="text-base font-black">{helm.label}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {helm.note}
          </p>
        </div>
      )}

      {helm.commanders.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {helm.note}
        </p>
      )}

      {helm.evidence.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          {helm.evidence.some(item => item.url.includes("edhrec.com")) && (
            <p className="mb-2 text-[10px] leading-4 text-muted-foreground">
              EDHREC is aggregate context, not proof of the source list’s
              intent.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {helm.evidence.map((item, index) => (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1 border border-border bg-background px-2 py-1 text-[9px] font-semibold hover:border-primary hover:text-primary"
              >
                {item.label} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {helm.separateChildGuess && (
        <SeparateChildGuess guess={helm.separateChildGuess} />
      )}
      <p className="mt-3 border-t border-border pt-2 text-[10px] leading-4 text-muted-foreground">
        This helm panel is separate from the saved list; no source card row was
        added, removed, or moved here.
      </p>
    </section>
  );
}

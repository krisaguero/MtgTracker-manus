import { ArrowUpRight } from "lucide-react";
import React from "react";

export const CARD_MEDIA_CLASS = "aspect-[488/680] w-full overflow-hidden bg-muted";

export function cardIndexHref(name: string) {
  return `/card/${encodeURIComponent(name.trim())}`;
}

export function CardIndexLink({
  name,
  compact = false,
  className = "",
}: {
  name: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <a
      href={cardIndexHref(name)}
      className={`inline-flex min-h-9 items-center gap-1 border border-primary/40 bg-primary/5 px-2 py-1 font-mono font-bold uppercase tracking-wide text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${compact ? "text-[9px]" : "text-[10px]"} ${className}`}
      aria-label={`Open ${name} in the card market tracker`}
    >
      Market tracker
      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

export function CardMediaFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`${CARD_MEDIA_CLASS} ${className}`}>{children}</div>;
}

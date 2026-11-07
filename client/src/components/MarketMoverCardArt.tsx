import React, { useEffect, useMemo, useState } from "react";

type MarketMoverCardArtProps = {
  name: string;
  setCode?: string;
  size?: "thumb" | "small";
  className?: string;
};

function cleanCardName(name: string) {
  return name.replace(/\s*\([^)]*\)/g, "").trim();
}

function usableSetCode(value?: string) {
  const code = value?.trim().toLowerCase();
  return code && !["all", "unknown", "—", "-", "n/a"].includes(code)
    ? code
    : undefined;
}

export function MarketMoverCardArt({
  name,
  setCode,
  size = "thumb",
  className = "",
}: MarketMoverCardArtProps) {
  const cardName = cleanCardName(name);
  const hintedSet = usableSetCode(setCode);
  const [useNameOnlyFallback, setUseNameOnlyFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setUseNameOnlyFallback(false);
    setFailed(false);
  }, [cardName, hintedSet, size]);

  const imageSrc = useMemo(() => {
    const params = new URLSearchParams({
      fuzzy: cardName,
      format: "image",
      version: size === "small" ? "normal" : "small",
    });
    if (hintedSet && !useNameOnlyFallback) params.set("set", hintedSet);
    return `https://api.scryfall.com/cards/named?${params.toString()}`;
  }, [cardName, hintedSet, size, useNameOnlyFallback]);

  const dimensions = size === "small" ? "h-24 w-16" : "h-14 w-10";

  return (
    <div
      className={`relative ${dimensions} shrink-0 overflow-hidden border border-border bg-muted shadow-sm ${className}`}
      title={`Representative card art for ${cardName}; the exact printing may differ`}
    >
      {failed ? (
        <div
          role="img"
          aria-label={`${cardName} artwork unavailable`}
          className="flex h-full w-full items-center justify-center bg-muted px-1 text-center font-mono text-[8px] font-bold uppercase leading-tight text-muted-foreground"
        >
          Art unavailable
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={`${cardName} card art`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
          onError={() => {
            if (hintedSet && !useNameOnlyFallback) {
              setUseNameOnlyFallback(true);
              return;
            }
            setFailed(true);
          }}
        />
      )}
    </div>
  );
}

export default MarketMoverCardArt;

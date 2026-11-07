import React, { useEffect, useMemo, useState } from "react";
import { waitForMarketMoverImageSlot } from "@/lib/marketMoverImageQueue";

type MarketMoverCardArtProps = {
  name: string;
  setCode?: string;
  size?: "thumb" | "small";
  className?: string;
};

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

function cleanCardName(name: string) {
  return name.replace(/\s*\([^)]*\)/g, "").trim();
}

function lookupCardName(name: string) {
  const fullName = cleanCardName(name);
  return fullName.split(/\s*\/\/\s*/)[0]?.trim() || fullName;
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
  const lookupName = lookupCardName(name);
  const hintedSet = usableSetCode(setCode);
  const [useNameOnlyFallback, setUseNameOnlyFallback] = useState(false);
  const [failed, setFailed] = useState(false);
  const [readyImageSrc, setReadyImageSrc] = useState<string | null>(null);

  useEffect(() => {
    setUseNameOnlyFallback(false);
    setFailed(false);
  }, [cardName, hintedSet, size]);

  const imageSrc = useMemo(() => {
    const params = new URLSearchParams({
      fuzzy: lookupName,
      format: "image",
      version: size === "small" ? "normal" : "small",
    });
    if (hintedSet && !useNameOnlyFallback) params.set("set", hintedSet);
    return `https://api.scryfall.com/cards/named?${params.toString()}`;
  }, [hintedSet, lookupName, size, useNameOnlyFallback]);

  useEffect(() => {
    let active = true;
    setReadyImageSrc(null);
    void waitForMarketMoverImageSlot().then(() => {
      if (active) setReadyImageSrc(imageSrc);
    });
    return () => {
      active = false;
    };
  }, [imageSrc]);

  const dimensions = size === "small" ? "h-24 w-16" : "h-14 w-10";
  const imageIsQueued = readyImageSrc !== imageSrc;

  return (
    <div
      className={`relative ${dimensions} shrink-0 overflow-hidden border border-border bg-muted shadow-sm ${className}`}
      title={`Representative card art for ${cardName}; the exact printing may differ`}
      aria-busy={!failed && imageIsQueued}
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
          src={imageIsQueued ? TRANSPARENT_PIXEL : imageSrc}
          data-scryfall-src={imageSrc}
          alt={`${cardName} card art`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`h-full w-full object-contain ${imageIsQueued ? "opacity-0" : ""}`}
          onError={() => {
            if (imageIsQueued) return;
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

import React, { useEffect, useMemo, useState } from "react";
import { getMarketCardImageUrls } from "@/lib/marketCardArtLookup";

type MarketMoverCardArtProps = {
  name: string;
  setCode?: string;
  collectorNumber?: string | number | null;
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

export function MarketMoverCardArt({
  name,
  setCode,
  collectorNumber,
  size = "thumb",
  className = "",
}: MarketMoverCardArtProps) {
  const cardName = cleanCardName(name);
  const lookupName = lookupCardName(name);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setImageUrl(null);
    setFailed(false);
    void getMarketCardImageUrls(cardName, setCode, collectorNumber).then(urls => {
      if (!active) return;
      const preferred = size === "small" ? urls?.normal : urls?.small;
      const fallback = size === "small" ? urls?.small : urls?.normal;
      const nextUrl = preferred || fallback || null;
      if (nextUrl) setImageUrl(nextUrl);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [cardName, collectorNumber, setCode, size]);

  const dimensions = size === "small" ? "h-24 w-16" : "h-14 w-10";
  const imageIsLoading = !failed && !imageUrl;
  const title = useMemo(
    () => `Representative card art for ${cardName}; the exact printing may differ`,
    [cardName],
  );

  return (
    <div
      className={`relative ${dimensions} shrink-0 overflow-hidden border border-border bg-muted shadow-sm ${className}`}
      title={title}
      aria-busy={imageIsLoading}
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
          src={imageUrl || TRANSPARENT_PIXEL}
          data-card-art-query={lookupName}
          alt={`${cardName} card art`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`h-full w-full object-contain ${imageIsLoading ? "opacity-0" : ""}`}
          onError={() => {
            if (imageUrl) setFailed(true);
          }}
        />
      )}
    </div>
  );
}

export default MarketMoverCardArt;

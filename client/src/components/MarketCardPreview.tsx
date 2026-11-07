import React, { useEffect, useMemo, useRef, useState } from "react";
import { CardImageZoom } from "./CardImageZoom";
import { getMarketCardImageUrls } from "@/lib/marketCardArtLookup";

interface MarketCardPreviewProps {
  name: string;
  setCode?: string;
  collectorNumber?: string | number | null;
  size?: "sm" | "md" | "full";
}

export function MarketCardPreview({
  name,
  setCode,
  collectorNumber,
  size = "sm",
}: MarketCardPreviewProps) {
  const cleanName = size === "full" ? name.trim() : name.replace(/\s*\([^)]*\)/g, "").trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(size !== "full");
  useEffect(() => {
    if (visible || !containerRef.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visible]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const dimensions = size === "full" ? "aspect-[488/680] w-full" : size === "md" ? "h-44 w-32" : "h-24 w-16";

  useEffect(() => {
    let active = true;
    setImageUrl(null);
    setFailed(false);
    if (!visible) return;

    void getMarketCardImageUrls(cleanName, setCode, collectorNumber).then(urls => {
      if (!active) return;
      const preferred = size === "sm" ? urls?.small : urls?.normal;
      const fallback = size === "sm" ? urls?.normal : urls?.small;
      const nextUrl = preferred || fallback || null;
      if (nextUrl) setImageUrl(nextUrl);
      else setFailed(true);
    });
    return () => {
      active = false;
    };
  }, [cleanName, collectorNumber, setCode, size, visible]);

  return (
    <div
      ref={containerRef}
      className={`${dimensions} flex-shrink-0 overflow-hidden border-2 border-border bg-muted shadow-sm`}
      title={`${name} · representative card image via Scryfall`}
    >
      {failed ? (
        <div
          role="img"
          aria-label={`${name} artwork unavailable`}
          className="flex h-full w-full items-center justify-center p-4 text-center text-xs leading-6 text-muted-foreground"
        >
          Artwork unavailable. Card research and retailer links remain available.
        </div>
      ) : imageUrl ? (
        size === "full" ? (
          <CardImageZoom src={imageUrl} alt={`${name} full card`} />
        ) : (
          <img
            src={imageUrl}
            alt={`${name} card image from Scryfall`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-contain"
            onError={() => {
              setImageUrl(null);
              setFailed(true);
            }}
          />
        )
      ) : (
        <div
          className="h-full w-full animate-pulse bg-gradient-to-br from-primary/15 via-muted to-background"
          aria-label={`Loading ${name} card image`}
        />
      )}
    </div>
  );
}

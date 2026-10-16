import type { ReactNode } from "react";

export type MarketDataStatus = "idle" | "loading" | "error" | "ready";
export type MarketIndexLoadState = "idle" | "loading" | "error";

export function marketDataStatusFromIndex(
  indexLoadState: MarketIndexLoadState,
  hasSummary: boolean
): MarketDataStatus {
  if (indexLoadState === "error") return "error";
  if (indexLoadState === "loading") return "loading";
  return hasSummary ? "ready" : "idle";
}

export function marketDataCueText(
  status: MarketDataStatus,
  source = "",
  asOf = "",
  lastRefreshedAt = ""
) {
  if (status === "idle")
    return "Market index not loaded · open All precons or sort by value";
  if (status === "loading")
    return "Market index loading · dated card-price data";
  if (status === "error")
    return "Market index unavailable · archive browsing remains available";
  const refreshed = lastRefreshedAt ? ` · last refreshed ${lastRefreshedAt}` : "";
  return `${source || "Card-price index"} snapshot · quotes as of ${asOf || "date unavailable"}${refreshed}`;
}

export function MarketDataCue({
  status,
  source,
  asOf,
  lastRefreshedAt,
  className = "",
  children,
}: {
  status: MarketDataStatus;
  source?: string;
  asOf?: string;
  lastRefreshedAt?: string;
  className?: string;
  children?: ReactNode;
}) {
  const color =
    status === "error"
      ? "text-destructive"
      : status === "ready"
        ? "text-muted-foreground"
        : "text-muted-foreground";

  return (
    <p
      data-market-data-status={status}
      className={`${color} ${className}`.trim()}
    >
      {children ? <>{children} · </> : null}
      {marketDataCueText(status, source, asOf, lastRefreshedAt)}
    </p>
  );
}

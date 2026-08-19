import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("market router", () => {
  it("returns Parquet-backed daily movers", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.market.getMovers();

    expect(result.source).toBe("parquet");
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]).toMatchObject({
      name: expect.any(String),
      set_code: expect.any(String),
      current_price: expect.any(Number),
      pct_change: expect.any(Number),
      recent_prices: expect.arrayContaining([expect.any(Number)]),
    });
    expect(result.rows.some((row) => row.recent_prices.length >= 3)).toBe(true);
  });

  it("returns Parquet-backed old-school spike rows", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.market.getOldSchoolSpikes();

    expect(result.source).toBe("parquet");
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows.every((row) => ["lea", "leb", "2ed", "arn", "atq", "leg", "drk"].includes(row.set_code))).toBe(true);
  });
});

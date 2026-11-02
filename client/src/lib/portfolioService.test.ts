import { describe, expect, it } from 'vitest';
import { availableQuantity, approveTransfer, reconcileImport, tryReserveCard, type PortfolioServiceState } from './portfolioService';
import type { OwnedCard } from './manaboxParser';

const card: OwnedCard = { name: 'Wall of Denial', quantity: 2, setCode: 'arb', collectorNumber: '5' };
const state: PortfolioServiceState = { missions: {}, savedBuilds: [], reservations: [], acquisitionEstimates: [], transferApprovals: [] };

describe('portfolio service hardening', () => {
  it('flags name-only rows and approves exact printings by default', () => {
    const result = reconcileImport([], [card, { name: 'Wall of Denial', quantity: 1 }]);
    expect(result.preview[0]?.approved).toBe(true);
    expect(result.preview[1]?.action).toBe('flagged');
    expect(result.preview[1]?.approved).toBe(false);
  });

  it('prevents reservation quantities from exceeding scanned copies', () => {
    const first = tryReserveCard(state, card, 'abzan-armor', 2);
    expect(first.accepted).toBe(true);
    expect(availableQuantity(first.state, card)).toBe(0);
    const second = tryReserveCard(first.state, card, 'fantastic-four', 1);
    expect(second.accepted).toBe(false);
    expect(second.available).toBe(0);
  });

  it('records a transfer approval event without toggling unrelated mission state', () => {
    const next = approveTransfer(state, 'fantastic-four-wall-conversion');
    expect(next.transferApprovals).toEqual(['fantastic-four-wall-conversion']);
    expect(next.missions).toEqual({});
  });
});

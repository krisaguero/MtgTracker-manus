import { describe, expect, it } from 'vitest';
import { addAcquisitionEvent, availableQuantity, approveTransfer, reconcileImport, releaseReservation, setPlanDecision, tryReserveCard, type PortfolioServiceState } from './portfolioService';
import type { OwnedCard } from './manaboxParser';

const card: OwnedCard = { name: 'Wall of Denial', quantity: 2, setCode: 'arb', collectorNumber: '5' };
const state: PortfolioServiceState = { missions: {}, savedBuilds: [], reservations: [], acquisitionEstimates: [], acquisitionEvents: [], planDecisions: {}, transferApprovals: [] };

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

  it('releases one reserved copy and records dated cash events', () => {
    const reserved = tryReserveCard(state, card, 'abzan-armor', 2).state;
    const released = releaseReservation(reserved, reserved.reservations[0]!.identity, 'abzan-armor');
    expect(availableQuantity(released, card)).toBe(1);
    const withEvent = addAcquisitionEvent(released, { date: '2026-11-01', kind: 'singles', label: 'Wall package', amountUsd: 12.5 });
    expect(withEvent.acquisitionEvents[0]?.amountUsd).toBe(12.5);
  });

  it('persists an explicit execution decision without changing reservations', () => {
    const next = setPlanDecision(state, 'wall of denial', 'buy');
    expect(next.planDecisions['wall of denial']).toBe('buy');
    expect(next.reservations).toEqual([]);
  });
});

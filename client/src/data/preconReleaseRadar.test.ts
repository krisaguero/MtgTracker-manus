import { describe, expect, it } from 'vitest';
import { preconReleaseRadar } from './preconReleaseRadar';

describe('precon release radar', () => {
  it('keeps the five official Foundations Commander decks marked as released', () => {
    const released = preconReleaseRadar.filter((item) => item.status === 'released');
    expect(released.map((item) => item.name)).toEqual([
      'Calling All Angels',
      'Keen Engineering',
      'Wretched Ranks',
      'Reign of Dragons',
      'Tramplesaurus Rex',
    ]);
    expect(released.every((item) => item.releaseDate === '2026-10-02')).toBe(true);
  });

  it('does not present unverified schedule entries as complete decklists', () => {
    expect(preconReleaseRadar.find((item) => item.name === 'Magic: The Gathering | Star Trek')?.status).toBe('announced');
    expect(preconReleaseRadar.find((item) => item.name === 'Mystery Booster Commander Edition')?.status).toBe('spoiler-watch');
  });
});

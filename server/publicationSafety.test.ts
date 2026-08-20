import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('publication safety', () => {
  it('does not track the local-only project configuration file', () => {
    const tracked = execFileSync('git', ['ls-files', '.project-config.json'], { cwd: process.cwd(), encoding: 'utf8' }).trim();

    expect(tracked).toBe('');
  });
});

import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('publication safety', () => {
  it('does not track the local-only project configuration file', () => {
    const tracked = execFileSync('git', ['ls-files', '.project-config.json'], { cwd: process.cwd(), encoding: 'utf8' }).trim();

    expect(tracked).toBe('');
  });

  it('does not contain tracked AWS credentials, Resend keys, or bearer tokens', () => {
    const patterns = [
      'AKIA[0-9A-Z]{16}',
      'ASIA[0-9A-Z]{16}',
      're_[A-Za-z0-9]{20,}',
      'Bearer[[:space:]]+[A-Za-z0-9._-]{24,}',
    ];

    for (const pattern of patterns) {
      let matches = '';
      try {
        matches = execFileSync('git', ['grep', '-nE', pattern], { cwd: process.cwd(), encoding: 'utf8' });
      } catch (error: any) {
        if (error?.status !== 1) throw error;
      }
      expect(matches.trim()).toBe('');
    }
  });
});
